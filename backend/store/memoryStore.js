function normalizeCropId(cropId) {
  return String(cropId);
}

function createMemoryStore() {
  const crops = new Map();
  const sensorHistory = [];
  let latestSensorData = null;

  return {
    upsertCrop(cropData) {
      const id = normalizeCropId(cropData.cropId);
      const existing = crops.get(id) || {
        cropId: id,
        cropType: "",
        origin: "",
        currentStage: "Created",
        currentHolder: "",
        history: [],
        totalPrice: 0,
        txHash: null,
      };

      const next = {
        ...existing,
        ...cropData,
        cropId: id,
        history: Array.isArray(cropData.history)
          ? cropData.history
          : existing.history,
        totalPrice:
          cropData.totalPrice !== undefined
            ? Number(cropData.totalPrice)
            : Number(existing.totalPrice || 0),
        updatedAt: new Date().toISOString(),
      };

      crops.set(id, next);
      return next;
    },

    getCrop(cropId) {
      return crops.get(normalizeCropId(cropId)) || null;
    },

    listCrops() {
      return Array.from(crops.values());
    },

    appendCropHistory(cropId, historyEntry) {
      const existing = this.getCrop(cropId);
      if (!existing) return null;

      const nextHistory = [...(existing.history || []), historyEntry];
      return this.upsertCrop({ ...existing, history: nextHistory });
    },

    setLatestSensorData(sensorData) {
      latestSensorData = sensorData;
      sensorHistory.push(sensorData);
      return latestSensorData;
    },

    getLatestSensorData() {
      return latestSensorData;
    },

    getSensorHistory() {
      return sensorHistory;
    },
  };
}

module.exports = createMemoryStore;
