import express from "express";
import client from "../../db/connect.js"; 

const router = express.Router();
const INDEX_NAME = "web-logs";

/**
 * @desc Filters logs by bot or human traffic and returns a list of unique IP addresses.
 * @route GET /api/logs/filter/:type
 * @param type = "bot" | "human"
 * Query params: 
 * - size: The maximum number of documents to analyze for unique IPs. Defaults to 10.
 */
router.get("/filter/:type", async (req, res) => {
  try {
    const { type } = req.params;

    const size = parseInt(req.query.size) || 10; 

    if (type !== "bot" && type !== "human") {
      return res.status(400).json({ error: "Invalid type. Use 'bot' or 'human'." });
    }


    let query;
    const agentFilter = { match_phrase: { agent: "bot" } };

    if (type === "bot") {
      query = {
        bool: {
          filter: [agentFilter]
        }
      };
    } else { // type === "human"

      query = {
        bool: {
          must_not: [
            agentFilter
          ]
        }
      };
    }

    const searchBody = { 
        query: query, 
        sort: [{ timestamp: "desc" }],
        // Filter the source fields to only retrieve 'ip' for both bot and human types
        _source: ['ip'] 
    };

    const response = await client.search({
      index: INDEX_NAME,
      size: size,
      body: searchBody
    });


    const totalFound = response.hits.total.value;
    const returnedHits = response.hits.hits;


    const ips = new Set(returnedHits.map((hit) => hit._source.ip));
    const logs = [...ips];

 
    res.json({
      success: true,
      total_found: totalFound, // Total logs found matching the filter
      returned_count: logs.length, // Number of unique IPs returned
      logs: logs, // List of unique IP addresses
    });
    
  } catch (err) {
    console.error("Filter error:", err);
    res.status(500).json({ 
        success: false,
        error: "An internal server error occurred while filtering logs.",
        details: err.message 
    });
  }
});

/**
 * @desc Filters logs for requests that returned 0 bytes, allowing status codes to be configured via query parameter.
 * @route GET /api/logs/zero-byte-failures
 * Query params: 
 * - size: The maximum number of documents to analyze for unique IPs. Defaults to 100.
 * - statusCodes: An HTTP status code (e.g., "200"). Can be repeated (e.g., ?statusCodes=200&statusCodes=302). 
 * Defaults to [200, 302] if not provided.
 */
router.get("/zero-byte-failures", async (req, res) => {
  try {

    const size = parseInt(req.query.size) || 100; 
    const statusCodesParam = req.query.statusCodes;
    
    const defaultCodes = [200, 302];
    let targetStatusCodes;


    if (statusCodesParam) {
        // If it's a single string (e.g., ?statusCodes=200), wrap it in an array.
        // If it's already an array (e.g., ?statusCodes=200&statusCodes=302), use it.
        const codesArray = Array.isArray(statusCodesParam) ? statusCodesParam : [statusCodesParam];
        

        targetStatusCodes = codesArray
            .map(code => parseInt(code.trim()))
            .filter(code => !isNaN(code)); 
    } else {

        targetStatusCodes = defaultCodes;
    }

    if (targetStatusCodes.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: "Invalid statusCodes parameter. Please provide one or more valid status code numbers." 
        });
    }


    let filters = []; 
    

    const statusFilter = {
      terms: { status: targetStatusCodes } 
    };
    filters.push(statusFilter);


    const bytesFilter = {
      term: { bytes: 0 } // Filter for 0 bytes returned
    };
    filters.push(bytesFilter);


    const query = { bool: { filter: filters } };
    
    const searchBody = { 
        query: query, 
        sort: [{ timestamp: "desc" }],
        _source: ['ip'] 
    };

    const response = await client.search({
      index: INDEX_NAME,
      size: size,
      body: searchBody
    });


    const totalFound = response.hits.total.value;
    const returnedHits = response.hits.hits;

    // Extract unique IPs from the hits
    const ips = new Set(returnedHits.map((hit) => hit._source.ip));
    const logs = [...ips];

    // Return the response
    res.json({
      success: true,
      description: `Unique IPs associated with requests returning 0 bytes and status codes: ${targetStatusCodes.join(', ')}.`,
      total_found_logs: totalFound, 
      returned_unique_ips: logs.length,
      logs: logs, // List of unique IP addresses
    });
    
  } catch (err) {
    console.error("Filter error:", err);
    res.status(500).json({ 
        success: false,
        error: "An internal server error occurred while filtering logs.",
        details: err.message 
    });
  }
});

export default router;


