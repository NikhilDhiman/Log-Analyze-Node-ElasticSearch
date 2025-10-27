import express from "express";
import dotenv from "dotenv";
import searchRoutes from "./api/routes/search.js";
import fulltextRoutes from "./api/routes/fulltext.js";
import analyticsRoutes from "./api/routes/analytics.js";
import exportRoutes from "./api/routes/export.js";
import filterRoutes from "./api/routes/filtering.js";
import ingestRoutes from "./api/routes/ingest.js";

import getLogs from "./api/routes/getLogs.js";



dotenv.config();
const app = express();
app.use(express.json());

// Routes
app.use("/api/log", searchRoutes);
app.use("/api/log", filterRoutes);
app.use("/api/log", fulltextRoutes);
app.use("/api/log", analyticsRoutes);
app.use("/api/log", exportRoutes);
app.use("/api/log", ingestRoutes);
app.use("/api/logs", ingestRoutes);

app.use("/api/log", getLogs);//display logs from Elasticsearch

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
