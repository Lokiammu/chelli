import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/web3";

function CropStatusTable() {
  const [crops, setCrops] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Crop ID copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Shorten ID function
  const shortenId = (id) => {
    if (typeof id === 'string' && id.startsWith('0x')) {
      return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
    }
    return id;
  };


  const loadCropsFromBlockchain = async () => {
    try {
      const contract = await getContract();

      const count = await contract.cropCount();
      let list = [];

      for (let i = 0; i < Number(count); i++) {
        const cropID = await contract.cropIDs(i);
        const crop = await contract.crops(cropID);

        // Also read from other mappings to get current holder
        const supply = await contract.supplies(cropID);
        const batch = await contract.batches(cropID);
        const retail = await contract.retails(cropID);

        console.log("CropStatusTable Debug - Reading mappings with cropID:", {
          cropID: cropID,
          cropIDType: typeof cropID,
          cropIDHex: cropID.startsWith('0x') ? 'hex' : 'bytes32'
        });

        // Handle bytes32 decoding properly
        let decodedCropId;
        try {
          decodedCropId = ethers.decodeBytes32String(crop.cropID);
        } catch (err) {
          // If decode fails, use the raw bytes32 as hex string
          decodedCropId = crop.cropID;
        }

        // Determine current holder based on which mapping has data
        let currentHolder = crop.currentHolder; // Default to crops mapping
        let transferDate = crop.transferDate;
        let currentStage = crop.stage || "Harvested";

        console.log("CropStatusTable Date Debug - Initial values:", {
          cropTransferDate: crop.transferDate,
          initialTransferDate: transferDate,
          initialHolder: currentHolder,
          initialStage: currentStage
        });

        // Check if supplier has received this crop
        if (supply.currentHolder && supply.currentHolder !== "0x0000000000000000000000000000000000000000") {
          console.log("CropStatusTable Date Debug - Supplier mapping found:", {
            supplyReceivedDate: supply.receivedDate,
            supplyHolder: supply.currentHolder
          });
          currentHolder = supply.currentHolder;
          transferDate = supply.receivedDate;
          currentStage = "With Supplier";
          console.log("CropStatusTable Date Debug - Updated to supplier:", {
            newTransferDate: transferDate,
            newHolder: currentHolder,
            newStage: currentStage
          });
        }

        // Check if aggregator has received this crop
        if (batch.currentHolder && batch.currentHolder !== "0x0000000000000000000000000000000000000000") {
          console.log("CropStatusTable Date Debug - Aggregator mapping found:", {
            batchReceivedDate: batch.receivedDate,
            batchHolder: batch.currentHolder
          });
          currentHolder = batch.currentHolder;
          transferDate = batch.receivedDate;
          currentStage = "With Aggregator";
          console.log("CropStatusTable Date Debug - Updated to aggregator:", {
            newTransferDate: transferDate,
            newHolder: currentHolder,
            newStage: currentStage
          });
        }

        // Check if retailer has received this crop
        if (retail.holder && retail.holder !== "0x0000000000000000000000000000000000000000") {
          console.log("CropStatusTable Date Debug - Retailer mapping found:", {
            retailReceivedDate: retail.receivedDate,
            retailHolder: retail.holder
          });
          currentHolder = retail.holder;
          transferDate = retail.receivedDate;
          currentStage = "With Retailer";
          console.log("CropStatusTable Date Debug - Updated to retailer:", {
            newTransferDate: transferDate,
            newHolder: currentHolder,
            newStage: currentStage
          });
        } else if (batch.currentHolder && batch.currentHolder !== "0x0000000000000000000000000000000000000000") {
          // Only update to aggregator if retailer hasn't received it yet
          console.log("CropStatusTable Date Debug - Aggregator mapping found (no retailer):", {
            batchReceivedDate: batch.receivedDate,
            batchHolder: batch.currentHolder
          });
          currentHolder = batch.currentHolder;
          transferDate = batch.receivedDate;
          currentStage = "With Aggregator";
          console.log("CropStatusTable Date Debug - Updated to aggregator:", {
            newTransferDate: transferDate,
            newHolder: currentHolder,
            newStage: currentStage
          });
        }

        // Enhanced debugging to identify mapping issues
        console.log("CropStatusTable Enhanced Debug:", {
          cropId: decodedCropId,
          currentStage,
          currentHolder,
          transferDate,
          mappingIssues: {
            cropsMapping: {
              hasData: crop.transferDate !== "",
              transferDate: crop.transferDate,
              holder: crop.currentHolder
            },
            suppliesMapping: {
              hasData: supply.receivedDate !== "",
              receivedDate: supply.receivedDate,
              holder: supply.currentHolder,
              transportCost: supply.transportCost
            },
            batchesMapping: {
              hasData: batch.receivedDate !== "",
              receivedDate: batch.receivedDate,
              holder: batch.currentHolder
            },
            retailsMapping: {
              hasData: retail.receivedDate !== "",
              receivedDate: retail.receivedDate,
              holder: retail.holder,
              retailPrice: retail.retailPrice
            }
          }
        });

        list.push({
          id: decodedCropId,
          type: crop.cropType,
          origin: crop.origin,
          stage: currentStage,
          holder: currentHolder,
          transferDate: transferDate,
        });
      }

      setCrops(list);
      setLastRefresh(new Date());

    } catch (err) {
      console.error("Error loading blockchain crops", err);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    loadCropsFromBlockchain();

    const interval = setInterval(() => {
      loadCropsFromBlockchain();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="section-title">Crop Status Table (Blockchain)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={loadCropsFromBlockchain}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{
        maxHeight: '400px',
        overflow: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <table className="crops-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Crop ID</th>
              <th>Type</th>
              <th>Origin</th>
              <th>Current Holder</th>
              <th>Transfer Date</th>
            </tr>
          </thead>

          <tbody>
            {crops.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No crops found on blockchain
                </td>
              </tr>
            ) : (
              crops.map((crop, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{shortenId(crop.id)}</span>
                      <button
                        onClick={() => copyToClipboard(crop.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        title="Copy Crop ID"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{crop.type}</td>
                  <td>{crop.origin}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{shortenId(crop.holder)}</span>
                      <button
                        onClick={() => copyToClipboard(crop.holder)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        title="Copy Holder Address"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{crop.transferDate || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CropStatusTable;