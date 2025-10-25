import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS,
  },
  apiVersion: '8.15',   
  tls: {
    rejectUnauthorized: false, 
  },
});

async function checkConnection() {
  try {
    const info = await client.info();
    console.log("Connected to Elasticsearch!");
    console.log(info);
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

checkConnection();
export default client;
