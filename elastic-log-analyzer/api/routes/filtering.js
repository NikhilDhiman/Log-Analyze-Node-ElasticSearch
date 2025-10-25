import express from "express";
const router = express.Router();

// Remove this code and implement export routes here
router.get("/filter", (req, res) => {
  res.json({ message: "Filter export is working!" });
});

export default router;