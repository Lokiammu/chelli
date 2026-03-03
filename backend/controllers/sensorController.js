function createSensorController({ cropSupplyChain, account, store, spawn }) {
  async function updateFreshness(req, res) {
    try {
      const { productId, voc, temperature, humidity } = req.body;
      if (productId === undefined || productId === null) {
        return res.status(400).json({ error: "productId is required" });
      }

      const latestSensorData = store.setLatestSensorData({
        productId,
        voc,
        temperature,
        humidity,
        timestamp: new Date().toISOString(),
      });

      let txHash = null;
      let blockchainError = null;

      if (cropSupplyChain?.methods?.updateFreshness) {
        try {
          const tx = await cropSupplyChain.methods
            .updateFreshness(
              productId,
              Math.round(Number(voc || 0)),
              Math.round(Number(temperature || 0)),
              Math.round(Number(humidity || 0))
            )
            .send({ from: account.address, gas: 300000 });

          txHash = tx.transactionHash;
          console.log("📦 Storing IoT data...");
          console.log("✅ Data stored on blockchain");
        } catch (err) {
          blockchainError = err.message;
          console.warn("Blockchain freshness write failed:", blockchainError);
        }
      }

      const response = {
        status: blockchainError ? "partial_success" : "success",
        txHash,
        latestSensorData,
      };

      if (blockchainError) {
        response.blockchainError = blockchainError;
      }

      return res.json(response);
    } catch (err) {
      console.error("❌ updateFreshness error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  function getLatestData(req, res) {
    const latestSensorData = store.getLatestSensorData();
    if (!latestSensorData?.timestamp) {
      return res.status(404).json({ message: "No sensor data yet" });
    }
    return res.json(latestSensorData);
  }

  function predictVQI(req, res) {
    const python = spawn("python", ["ml/predict_vqi.py"]);
    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", () => {
      try {
        if (errorOutput) {
          console.error("Python error:", errorOutput);
        }
        return res.json(JSON.parse(output));
      } catch {
        return res.status(500).json({ error: "Prediction failed" });
      }
    });

    python.stdin.write(JSON.stringify(req.body));
    python.stdin.end();
  }

  return {
    updateFreshness,
    getLatestData,
    predictVQI,
  };
}

module.exports = createSensorController;
