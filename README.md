# Elasticsearch Log Analyzer (Node.js + Express)
The Elasticsearch Log Analyzer is a Node.js + Express API that allows users to upload, store, search, and analyze web server logs using Elasticsearch.

## Project Overview
The **Elasticsearch Log Analyzer** is a Node.js + Express API that allows users to upload, store, search, and analyze web server logs using **Elasticsearch**.

It supports:
- Uploading large `.log` files via API  
- Automatic ingestion into Elasticsearch (background job system)  
- Search and advanced full-text search  
- Aggregated analytics and statistics  
- CSV/JSON export  
- Elasticsearch connection health check  
- Reset or reinitialize the entire database  

---

## Tech Stack

| Component | Description |
|------------|--------------|
| **Node.js** | Backend runtime environment |
| **Express.js** | REST API framework |
| **Elasticsearch** | NoSQL database for search and analytics |
| **Multer** | File upload middleware |
| **uuid** | Unique job ID generation |
| **dotenv** | Environment variable management |

---

## Environment Setup

Create a `.env` file in the project root directory and add:

```env
ELASTIC_URL=http://localhost:9200
ELASTIC_USER=<USERNAME>
ELASTIC_PASS=<PASSWORD>
PORT=3000

```

## Run Elasticsearch (Docker)
```env
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "ELASTIC_PASSWORD=<PASSWORD>" \
  docker.elastic.co/elasticsearch/elasticsearch:8.15.3
```

