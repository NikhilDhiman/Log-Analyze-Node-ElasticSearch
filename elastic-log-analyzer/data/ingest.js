import fs from "fs";
import readline from "readline";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS,
  },
});

const logRegex =
  /^(\S+) - - \[(.*?)\] "(\S+) (\S+) (\S+)" (\d{3}) (\d+) "(.*?)" "(.*?)"/;

async function createIndex() {
  const indexName = "web-logs";

  const exists = await client.indices.exists({ index: indexName });
  if (!exists) {
    await client.indices.create({
      index: indexName,
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
    console.log("Index created: web-logs");
  } else {
    console.log("Index already exists");
  }
}

async function ingestLogs() {
  await createIndex();

  const fileStream = fs.createReadStream("access.log");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let bulkBody = [];
  let counter = 0;
  const batchSize = 500; // index 500 logs at a time

  for await (const line of rl) {
    const match = line.match(logRegex);
    if (match) {
      const [_, ip, timestamp, method, url, protocol, status, bytes, referrer, agent] = match;
      const logEntry = {
        ip,
        timestamp,
        method,
        url,
        protocol,
        status: Number(status),
        bytes: Number(bytes),
        referrer,
        agent,
      };
      bulkBody.push({ index: { _index: "web-logs" } });
      bulkBody.push(logEntry);
      counter++;
    }

    // Send in batches to avoid memory overflow
    if (bulkBody.length >= batchSize * 2) {
      await client.bulk({ refresh: false, body: bulkBody });
      bulkBody = [];
      console.log(`Indexed ${counter} logs so far...`);
    }
  }

  // Index any remaining logs
  if (bulkBody.length > 0) {
    await client.bulk({ refresh: true, body: bulkBody });
  }

  console.log(`Finished indexing ${counter} logs`);
}


ingestLogs().catch(console.error);
