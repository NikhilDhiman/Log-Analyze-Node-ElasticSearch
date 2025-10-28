import fs from "fs";
import readline from "readline";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const jobId = process.argv[2];
const filePath = process.argv[3];
const STATUS_FILE = `status/ingest-status-${jobId}.json`;
const INDEX_NAME = "web-logs";

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: { username: process.env.ELASTIC_USER, password: process.env.ELASTIC_PASS },
});

const logRegex =
  /^(\S+) - - \[(.*?)\] "(\S+) (\S+) (\S+)" (\d{3}) (\d+) "(.*?)" "(.*?)"/;

function updateStatus(status) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

// ✅ Ensure index exists with correct mapping
async function ensureIndex() {
  const exists = await client.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    console.log("Creating index with proper mapping...");
    await client.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            ip: { type: "keyword" },
            timestamp: { type: "date", format: "dd/MMM/yyyy:HH:mm:ss Z" },
            method: { type: "keyword" },
            url: { type: "text" },
            protocol: { type: "keyword" },
            status: { type: "integer" },
            bytes: { type: "integer" },
            referrer: { type: "text" },
            agent: { type: "text" },
          },
        },
      },
    });
    console.log("✅ Index created successfully!");
  } else {
    console.log("ℹ️ Index already exists, continuing ingestion...");
  }
}

async function ingestLogs() {
  await ensureIndex(); // ✅ add this line

  updateStatus({ status: "running", indexed: 0, file: filePath });

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let bulkBody = [];
  let counter = 0;
  const batchSize = 500;

  for await (const line of rl) {
    const match = line.match(logRegex);
    if (match) {
      const [_, ip, timestamp, method, url, protocol, status, bytes, referrer, agent] = match;
      const doc = { ip, timestamp, method, url, protocol, status: +status, bytes: +bytes, referrer, agent };
      bulkBody.push({ index: { _index: INDEX_NAME } }, doc);
      counter++;
    }

    if (bulkBody.length >= batchSize * 2) {
      await client.bulk({ refresh: false, body: bulkBody });
      bulkBody = [];
      updateStatus({ status: "running", indexed: counter, file: filePath });
    }
  }

  if (bulkBody.length) await client.bulk({ refresh: true, body: bulkBody });

  updateStatus({
    status: "completed",
    indexed: counter,
    file: filePath,
    finishedAt: new Date().toISOString(),
  });
  console.log(`[${jobId}] ✅ Finished indexing ${counter} logs`);
}

ingestLogs().catch((err) => {
  console.error(err);
  updateStatus({ status: "error", message: err.message });
});
