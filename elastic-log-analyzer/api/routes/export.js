import express from "express";
const router = express.Router();

// Remove this code and implement export routes here
router.get("/export", (req, res) => {
  res.json({ message: "Filter export is working!" });
});

export default router;
