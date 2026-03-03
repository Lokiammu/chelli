const axios = require("axios");

const PINATA_JWT = process.env.PINATA_JWT;

async function uploadToIPFS(sensorData) {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT is not configured");
  }

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    sensorData,
    {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    }
  );

  return res.data.IpfsHash;
}

module.exports = { uploadToIPFS };
