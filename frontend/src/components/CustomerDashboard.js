// src/components/CustomerDashboard.js
import React, { useState } from "react";
import { ethers } from "ethers";
import CONTRACT_JSON from "../abi/TrackSupplyChain.json";

const ABI = CONTRACT_JSON.abi;
const CONTRACT_ADDRESS = "0x6934948aa57D9909f90b06905559ddf0851BE29F";

function CustomerDashboard({ crops, setCrops }) {
  const [cropId, setCropId] = useState("");
  const [crop, setCrop] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);

  // 🔗 CONNECT CONTRACT
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  };

  // =========================
  // TRACE FROM BLOCKCHAIN (Same as header TraceProduct)
  // =========================
  const handleTrace = async () => {
    if (!cropId) {
      alert("Please enter Crop ID");
      return;
    }

    try {
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropId.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropId;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropId);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          return;
        }
      }

      // read mappings from blockchain (same as TraceProduct)
      const cropData = await contract.crops(cropID);
      const supplyData = await contract.supplies(cropID);
      const batchData = await contract.batches(cropID);
      const retailData = await contract.retails(cropID);
      const purchaseData = await contract.purchases(cropID);

      // build timeline with proper holder verification (same as TraceProduct)
      console.log("Customer Trace Debug - Building timeline from blockchain data");
      
      // Determine actual holders from each mapping
      let farmerHolder = cropData.currentHolder;
      let supplierHolder = supplyData.currentHolder && supplyData.currentHolder !== "0x0000000000000000000000000000000000000" 
        ? supplyData.currentHolder 
        : null;
      let aggregatorHolder = batchData.currentHolder && batchData.currentHolder !== "0x0000000000000000000000000000000000000000" 
        ? batchData.currentHolder 
        : null;
      let retailerHolder = retailData.holder && retailData.holder !== "0x0000000000000000000000000000000000000000" 
        ? retailData.holder 
        : null;
      let customerBuyer = purchaseData.buyer && purchaseData.buyer !== "0x0000000000000000000000000000000000000000" 
        ? purchaseData.buyer 
        : null;

      console.log("Customer Trace Debug - Determined holders:", {
        farmer: farmerHolder,
        supplier: supplierHolder,
        aggregator: aggregatorHolder,
        retailer: retailerHolder,
        customer: customerBuyer
      });

      // Build timeline based on actual data availability
      const history = [];

      // Always include farmer (crop creation)
      history.push({
        role: "Farmer",
        date: cropData.date || "N/A",
        cost: Number(cropData.price) || 0,
        sender: farmerHolder || "N/A",
        receiver: supplierHolder || "N/A",
        note: "Crop harvested & registered",
        active: true
      });

      // Include supplier if data exists
      if (supplierHolder) {
        history.push({
          role: "Supplier",
          date: supplyData.receivedDate || "N/A",
          cost: Number(supplyData.transportCost) || 0,
          sender: farmerHolder || "N/A",
          receiver: aggregatorHolder || "N/A",
          note: "Transported to aggregator",
          active: true
        });
      }

      // Include aggregator if data exists
      if (aggregatorHolder) {
        history.push({
          role: "Aggregator",
          date: batchData.receivedDate || "N/A",
          cost: Number(batchData.processingCost) || 0,
          sender: supplierHolder || farmerHolder || "N/A",
          receiver: aggregatorHolder || "N/A",
          note: "Processed & sent to retailer",
          active: true
        });
      }

      // Include retailer if data exists
      if (retailerHolder) {
        // Only show retail price if product hasn't been sold to customer yet
        const isSoldToCustomer = customerBuyer && purchaseData.purchased;
        history.push({
          role: "Retailer",
          date: retailData.receivedDate || "N/A",
          cost: isSoldToCustomer ? 0 : Number(retailData.retailPrice) || 0,
          sender: aggregatorHolder || supplierHolder || farmerHolder || "N/A",
          receiver: customerBuyer || "Awaiting customer purchase",
          note: isSoldToCustomer ? "Sold to customer" : "Available for purchase",
          active: true
        });
      }

      // Include customer if data exists
      if (customerBuyer && purchaseData.purchased) {
        history.push({
          role: "Customer",
          date: purchaseData.purchaseDate || "N/A",
          cost: Number(purchaseData.purchasePrice) || 0,
          sender: retailerHolder || "N/A",
          receiver: customerBuyer || "N/A",
          note: "Purchased successfully",
          active: true
        });
      }

      // Debug logging (same as TraceProduct)
      console.log("Customer Trace Data Debug:", {
        cropData: {
          price: cropData.price,
          date: cropData.date,
          currentHolder: cropData.currentHolder
        },
        supplyData: {
          transportCost: supplyData.transportCost,
          receivedDate: supplyData.receivedDate,
          currentHolder: supplyData.currentHolder
        },
        batchData: {
          receivedDate: batchData.receivedDate,
          currentHolder: batchData.currentHolder
        },
        retailData: {
          retailPrice: retailData.retailPrice,
          receivedDate: retailData.receivedDate,
          holder: retailData.holder
        },
        purchaseData: {
          purchasePrice: purchaseData.purchasePrice,
          purchaseDate: purchaseData.purchaseDate,
          buyer: purchaseData.buyer
        }
      });

      const formatted = {
        cropId,
        cropType: cropData.cropType,
        origin: cropData.origin,
        history,
      };

      setCrop(formatted);
      setShowTimeline(true);

    } catch (err) {
      console.error("Customer trace failed, using fallback", err);
      
      // fallback to local data (same as TraceProduct)
      const found = crops.find((c) => c.id === cropId);
      if (!found) {
        alert("Invalid Crop ID");
        return;
      }

      setCrop(found);
      setShowTimeline(true);
    }
  };

  // =========================
  // CALCULATE TOTAL PRICE
  // =========================
  const finalPrice =
    crop?.history?.reduce((sum, h) => sum + Number(h.cost || 0), 0) || 0;

  // =========================
  // CONFIRM PURCHASE (BLOCKCHAIN)
  // =========================
  const confirmPurchase = async () => {
    if (!crop || !purchaseDate) {
      alert("Please select purchase date");
      return;
    }

    try {
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      const cropIdToUse = crop.cropId || crop.id;
      if (cropIdToUse.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropIdToUse;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropIdToUse);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          return;
        }
      }

      const tx = await contract.consumerConfirmPurchase(
        cropID,
        true,
        "Good quality",
        purchaseDate
      );

      await tx.wait();

      alert("Purchase stored on blockchain 🎉");

      const updated = crops.map((c) =>
        c.id === (crop.cropId || crop.id)
          ? {
              ...c,
              stage: "Purchased by Customer",
              holder: "Customer",
              transferDate: purchaseDate,
            }
          : c
      );

      setCrops(updated);
      setPurchaseDate("");

    } catch (err) {
      console.error(err);
      alert("Blockchain purchase failed");
    }
  };

  return (
    <div className="customer-root">
      <div
        className="background-layer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/images/customer.png')",
          backgroundSize: "cover",
          backgroundPosition: "left 20%",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
        }}
      />

      <div className="ui-layer">
        <div className="container">
          <div className="customer-horizontal">

            {/* TRACE */}
            <div className="dashboard-section">
              <div className="section-title">Step 1: Trace Product</div>

              <input
                className="detail-input"
                placeholder="Enter Crop ID"
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
              />

              <button className="action-btn" onClick={handleTrace}>
                Trace Product
              </button>
            </div>

            {/* PURCHASE */}
            <div className="dashboard-section">
              <div className="section-title">Step 2: Purchase</div>

              <input
                type="date"
                className="detail-input"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={!crop}
              />

              <button
                className="action-btn"
                onClick={confirmPurchase}
                disabled={!crop}
              >
                Confirm Purchase
              </button>
            </div>
          </div>

          {/* TIMELINE */}
          {showTimeline && crop && (
            <div className="timeline-overlay">
              <div className="timeline-modal">
                <button
                  className="close-btn"
                  onClick={() => setShowTimeline(false)}
                >
                  ✕
                </button>

                <h2>Supply Chain Timeline</h2>

                <div className="timeline-grid" style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "25px",
                  marginBottom: "20px"
                }}>
                  {crop.history.map((stage, index) => (
                    <div key={index} className="timeline-card" style={{
                      padding: "20px",
                      minHeight: "200px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <h4>{index + 1}. {stage.role}</h4>
                        <p><b>Date:</b> {stage.date}</p>
                        <p><b>Cost:</b> ₹{stage.cost}</p>
                        <p><b>From:</b> {stage.sender}</p>
                        <p><b>To:</b> {stage.receiver}</p>
                      </div>
                      <p className="timeline-note" style={{ marginTop: "10px", fontStyle: "italic" }}>{stage.note}</p>
                    </div>
                  ))}
                </div>

                <div className="total-box">
                  Total Amount to Pay: ₹{finalPrice}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;