function createCropController({ cropSupplyChain, account, store }) {
  async function saveCrop(req, res) {
    try {
      const { cropId, cropType, origin, farmerAddress } = req.body;
      if (!cropId || !cropType || !origin) {
        return res
          .status(400)
          .json({ error: "cropId, cropType and origin are required" });
      }

      let txHash = null;
      let blockchainError = null;
      let onChainCrop = null;

      if (cropSupplyChain?.methods?.createCrop) {
        try {
          const tx = await cropSupplyChain.methods
            .createCrop(cropId, cropType, origin)
            .send({ from: farmerAddress || account.address, gas: 300000 });

          txHash = tx.transactionHash;

          if (cropSupplyChain?.methods?.getCrop) {
            onChainCrop = await cropSupplyChain.methods.getCrop(cropId).call();
          }
        } catch (err) {
          blockchainError = err.message;
          console.warn("Blockchain createCrop failed:", blockchainError);
        }
      }

      const stored = store.upsertCrop({
        cropId: onChainCrop?.[0] ?? cropId,
        cropType: onChainCrop?.[1] ?? cropType,
        origin: onChainCrop?.[2] ?? origin,
        currentStage: onChainCrop?.[3] ?? "Created",
        currentHolder: onChainCrop?.[4] ?? (farmerAddress || account.address),
        totalPrice: Number(onChainCrop?.[5] ?? 0),
        txHash,
      });

      const response = {
        cropId: stored.cropId,
        cropType: stored.cropType,
        origin: stored.origin,
        currentStage: stored.currentStage,
        currentHolder: stored.currentHolder,
        totalPrice: stored.totalPrice,
        txHash,
      };

      if (blockchainError) {
        response.blockchainError = blockchainError;
      }

      return res.json(response);
    } catch (err) {
      console.error("❌ saveCrop error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  async function updateCrop(req, res) {
    try {
      const { cropId, to, note, cost, from } = req.body;
      if (!cropId || !to) {
        return res.status(400).json({ error: "cropId and to are required" });
      }

      let txHash = null;
      let blockchainError = null;
      let onChainCrop = null;
      let onChainHistory = null;

      if (cropSupplyChain?.methods?.transferCrop) {
        try {
          const tx = await cropSupplyChain.methods
            .transferCrop(cropId, to, note || "", Number(cost || 0))
            .send({ from: from || account.address, gas: 300000 });

          txHash = tx.transactionHash;

          if (cropSupplyChain?.methods?.getCrop) {
            onChainCrop = await cropSupplyChain.methods.getCrop(cropId).call();
          }
          if (cropSupplyChain?.methods?.getCropHistory) {
            onChainHistory = await cropSupplyChain.methods
              .getCropHistory(cropId)
              .call();
          }
        } catch (err) {
          blockchainError = err.message;
          console.warn("Blockchain transferCrop failed:", blockchainError);
        }
      }

      const existing = store.getCrop(cropId) || {
        cropId,
        cropType: "",
        origin: "",
        currentStage: "Created",
        currentHolder: from || account.address,
        totalPrice: 0,
        history: [],
      };

      const transferCost = Number(cost || 0);
      const historyEntry = {
        step: (existing.history?.length || 0) + 1,
        role: "Transfer",
        date: new Date().toISOString(),
        cost: transferCost,
        sender: from || existing.currentHolder || account.address,
        receiver: to,
        note: note || "Crop transferred",
      };

      const history = Array.isArray(onChainHistory)
        ? onChainHistory
        : [...(existing.history || []), historyEntry];

      const stored = store.upsertCrop({
        cropId: onChainCrop?.[0] ?? cropId,
        cropType: onChainCrop?.[1] ?? existing.cropType,
        origin: onChainCrop?.[2] ?? existing.origin,
        currentStage: onChainCrop?.[3] ?? (note || "Transferred"),
        currentHolder: onChainCrop?.[4] ?? to,
        totalPrice: Number(onChainCrop?.[5] ?? existing.totalPrice + transferCost),
        history,
        txHash,
      });

      const response = {
        cropId: stored.cropId,
        cropType: stored.cropType,
        origin: stored.origin,
        currentStage: stored.currentStage,
        currentHolder: stored.currentHolder,
        totalPrice: stored.totalPrice,
        history: stored.history,
        txHash,
      };

      if (blockchainError) {
        response.blockchainError = blockchainError;
      }

      return res.json(response);
    } catch (err) {
      console.error("❌ updateCrop error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  function getCrops(req, res) {
    return res.json(store.listCrops());
  }

  return {
    saveCrop,
    updateCrop,
    getCrops,
  };
}

module.exports = createCropController;
