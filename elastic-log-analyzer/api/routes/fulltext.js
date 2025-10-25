import express from "express";
const router = express.Router();

// Remove this code and implement full text routes here
router.get("/fulltext", (req, res) => {
  res.json({ message: "fulltext is working!" });
});

export default router;
