import express from "express";
import fs from "fs";
import path from "path";
import client from "../../db/connect.js";
import moment from "moment"; // ✅ Install: npm install moment

const router = express.Router();
const INDEX_NAME = "web-logs";

// Helper: convert ISO → Apache log format if needed
function convertToApacheFormat(timestamp) {
  // detect ISO format (e.g. 2025-10-25T12:30:00Z)
  if (/^\d{4}-\d{2}-\d{2}T/.test(timestamp)) {
    const m = moment(timestamp);
    if (!m.isValid()) return timestamp;
    return m.format("DD/MMM/YYYY:HH:mm:ss ZZ"); // e.g. 22/Jan/2019:03:00:00 +0330
  }
  return timestamp; // already Apache format
}

// Helper: format logs like original access.log
function formatLog(entry) {
  return `${entry.ip || "-"} - - [${entry.timestamp}] "${entry.method || "-"} ${
    entry.url || "-"
  } ${entry.protocol || "-"}" ${entry.status || 0} ${entry.bytes || 0} "${
    entry.referrer || "-"
  }" "${entry.agent || "-"}"`;
}

// ✅ Export logs within a time range
router.get("/export", async (req, res) => {
  try {
    let { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "Missing query parameters: start and end",
        example:
          "/api/logs/export?start=2019-01-22T03:00:00Z&end=2019-01-22T04:00:00Z",
      });
    }

    // 🕐 Convert ISO timestamps → Apache log format
    start = convertToApacheFormat(start);
    end = convertToApacheFormat(end);

    const result = await client.search({
      index: INDEX_NAME,
      size: 10000,
      query: {
        range: {
          timestamp: {
            gte: start,
            lte: end,
          },
        },
      },
    });

    const hits = result.hits.hits.map((h) => h._source);

    if (hits.length === 0) {
      return res.status(404).json({ message: "No logs found for the specified range." });
    }

    const exportDir = path.resolve("exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filename = `logs_${Date.now()}.log`;
    const filePath = path.join(exportDir, filename);
    fs.writeFileSync(filePath, hits.map(formatLog).join("\n"));

    res.json({
      message: "✅ Logs exported successfully!",
      total_logs: hits.length,
      range: { start, end },
      file: filename,
      path: filePath,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
