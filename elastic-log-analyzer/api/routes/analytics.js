import express from "express";
const router = express.Router();

// Remove this code and implement analytics routes here
router.get("/analytics", (req, res) => {
  res.json({ message: "Filter route is working!" });
});

export default router;
