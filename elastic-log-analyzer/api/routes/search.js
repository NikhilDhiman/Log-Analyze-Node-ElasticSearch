import express from "express";
const router = express.Router();

// Remove this code and implement search routes here
router.get("/search", (req, res) => {
  res.json({ message: "search is working!" });
});

export default router;
