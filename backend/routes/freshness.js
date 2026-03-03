const express = require("express");
const router = express.Router();

const { uploadToIPFS } = require("../pinata");

// POST /storeFreshness
router.post("/storeFreshness", async (req, res) => {
  try {
    const sensorData = req.body;

    const ipfsHash = await uploadToIPFS(sensorData);

    res.json({
      success: true,
      cid: ipfsHash,
      ipfsHash
    });
  } catch (err) {
    console.error("IPFS upload failed:", err.message);
    res.status(500).json({ error: "Failed to store data in IPFS" });
  }
});

module.exports = router;
