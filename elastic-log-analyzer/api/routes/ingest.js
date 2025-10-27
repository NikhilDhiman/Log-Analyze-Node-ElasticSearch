import express from "express";
import multer from "multer";
import path from "path";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import client from "../../db/connect.js";


import { addJob } from "../../scripts/jobQueue.js";
import fs from "fs";

const router = express.Router();

const INDEX_NAME = "web-logs";


// save uploads to /uploads directory
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("logfile"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = path.resolve(req.file.path);
  const jobId = addJob(filePath);

  res.json({
    message: "File uploaded & ingestion started",
    file: req.file.filename,
    jobId,
  });
});


router.get("/ingest/status/:id", (req, res) => {
  const file = `status/ingest-status-${req.params.id}.json`;
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: "Job not found" });
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  res.json(data);
});


router.delete("/reset", async (req, res) => {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      return res.status(404).json({ message: "Index does not exist." });
    }

    const response = await client.indices.delete({ index: INDEX_NAME });
    res.json({ message: "Index deleted successfully!", acknowledged: response.acknowledged });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Health Check API
router.get("/health", async (req, res) => {
  try {
    // Ping the Elasticsearch cluster
    await client.ping();

    // Get cluster health info
    const health = await client.cluster.health();

    res.json({
      cluster_name: health.cluster_name,
      status: health.status,
      node_count: health.number_of_nodes,
      message:
        health.status === "green"
          ? "Elasticsearch cluster is healthy ✅"
          : health.status === "yellow"
          ? "Elasticsearch cluster is okay ⚠️ (some replicas missing)"
          : "Elasticsearch cluster has issues 🔴",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to connect to Elasticsearch",
      details: error.message,
    });
  }
});


export default router;
