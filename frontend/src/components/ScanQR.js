import React, { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/web3";

function parseScannedPayload(rawValue) {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    return parsed;
  } catch (_) {
    // Continue with URL parsing.
  }

  try {
    const url = new URL(rawValue);
    const cropId = url.searchParams.get("cropId");
    const txHash = url.searchParams.get("tx");
    const cid = url.searchParams.get("cid");

    if (cropId || txHash || cid) {
      return { cropId, txHash, cid };
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "trace") {
      return { cropId: parts[1] };
    }
  } catch (_) {
    // Not a URL payload.
  }

  return { raw: rawValue };
}

function toContractCropId(cropId) {
  if (!cropId) return cropId;
  if (cropId.startsWith("0x")) return cropId;

  try {
    return ethers.encodeBytes32String(cropId);
  } catch (_) {
    return cropId;
  }
}

export default function ScanQR() {
  const [scannedText, setScannedText] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [cropData, setCropData] = useState(null);
  const [ipfsData, setIpfsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resolveTraceData = async (parsed) => {
    if (!parsed) return;

    setIsLoading(true);
    setErrorMsg("");
    setCropData(null);
    setIpfsData(null);

    try {
      if (parsed.cropId) {
        const contract = await getContract();
        const chainCropId = toContractCropId(parsed.cropId);
        const crop = await contract.crops(chainCropId);
        setCropData({
          cropID: crop.cropID,
          cropType: crop.cropType,
          origin: crop.origin,
          date: crop.date,
          price: crop.price?.toString?.() ?? String(crop.price),
          stage: crop.stage?.toString?.() ?? String(crop.stage),
          currentHolder: crop.currentHolder,
          transferDate: crop.transferDate,
        });
      }

      if (parsed.cid) {
        const response = await fetch(
          `https://gateway.pinata.cloud/ipfs/${parsed.cid}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load IPFS data (HTTP ${response.status})`);
        }

        const json = await response.json();
        setIpfsData(json);
      }
    } catch (err) {
      setErrorMsg(err.message || "Trace lookup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const consumeScan = async (rawValue) => {
    const parsed = parseScannedPayload(rawValue);
    setScannedText(rawValue);
    setDecoded(parsed);
    await resolveTraceData(parsed);
  };

  const decodeFromImage = async (file) => {
    if (!file) return;
    if (!("BarcodeDetector" in window)) {
      setErrorMsg("This browser does not support BarcodeDetector. Paste QR text manually.");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);

      if (!codes.length || !codes[0].rawValue) {
        throw new Error("No QR code detected in selected image");
      }

      await consumeScan(codes[0].rawValue);
    } catch (err) {
      setErrorMsg(err.message || "Image QR decode failed");
    }
  };

  return (
    <div className="dashboard-section" style={{ maxWidth: "820px" }}>
      <div className="section-title">Scan QR</div>

      <div style={{ marginBottom: "14px" }}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => decodeFromImage(e.target.files?.[0])}
        />
        <p style={{ fontSize: "12px", marginTop: "8px" }}>
          Upload a QR image (or capture with camera) to decode automatically.
        </p>
      </div>

      <textarea
        className="detail-input"
        rows={3}
        placeholder="Or paste QR text/URL here"
        value={scannedText}
        onChange={(e) => setScannedText(e.target.value)}
      />

      <button
        className="action-btn"
        style={{ marginTop: "10px" }}
        onClick={() => consumeScan(scannedText)}
      >
        Decode Pasted Data
      </button>

      {isLoading && <p style={{ marginTop: "12px" }}>Loading trace data...</p>}
      {errorMsg && <p style={{ marginTop: "12px", color: "#b00020" }}>{errorMsg}</p>}

      {decoded && (
        <div style={{ marginTop: "14px" }}>
          <h4>Decoded QR Payload</h4>
          <pre>{JSON.stringify(decoded, null, 2)}</pre>
        </div>
      )}

      {cropData && (
        <div style={{ marginTop: "14px" }}>
          <h4>Blockchain Crop Data</h4>
          <pre>{JSON.stringify(cropData, null, 2)}</pre>
        </div>
      )}

      {ipfsData && (
        <div style={{ marginTop: "14px" }}>
          <h4>IPFS Metadata</h4>
          <pre>{JSON.stringify(ipfsData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
