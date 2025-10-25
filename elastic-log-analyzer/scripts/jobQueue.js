import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";

const jobQueue = [];
let isRunning = false;

function runNextJob() {
  if (isRunning || jobQueue.length === 0) return;

  const job = jobQueue.shift();
  isRunning = true;

  const process = spawn("node", ["./scripts/ingestLogs.js", job.id, job.file]);
  console.log(`[Queue] Started job ${job.id}`);

  process.stdout.on("data", (data) => console.log(`[${job.id}] ${data}`));
  process.stderr.on("data", (data) => console.error(`[${job.id}] ERROR: ${data}`));

  process.on("close", (code) => {
    console.log(`[Queue] Job ${job.id} finished with code ${code}`);
    isRunning = false;
    runNextJob();
  });
}

export function addJob(file) {
  const id = uuidv4();
  jobQueue.push({ id, file });
  console.log(`[Queue] Added job ${id} for file ${file}`);
  runNextJob();
  return id;
}
