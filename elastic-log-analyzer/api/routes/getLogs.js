import express from "express";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

const router = express.Router();


dotenv.config();


const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY, 
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = "web-logs";

/**
 * API Endpoint: GET /logs
 * Retrieves logs from the Elasticsearch 'web-logs' index.
 * * Query parameters:
 * - size: The number of documents to return (default is 10).
 */
router.get("/all", async (req, res) => {
  // Get the 'size' from query parameters, default to 10 if not provided
  const size = parseInt(req.query.size) || 10;
  
  try {
    const response = await client.search({
      index: INDEX_NAME,
      query: {
        match_all: {} 
      },
      size: size, 
    });


    const total = response.hits.total.value;
    const logs = response.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source 
    }));



    res.status(200).json({
      success: true,
      total_found: total,
      returned_count: logs.length,
      logs: logs,
    });

  } catch (error) {
    console.error("Error retrieving logs from Elasticsearch:", error.message);
    

    res.status(500).json({
      success: false,
      message: "Failed to retrieve logs from Elasticsearch.",
      error: error.message,
    });
  }
});


export default router;