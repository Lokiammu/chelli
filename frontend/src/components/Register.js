import React, { useState } from "react";
import { ethers } from "ethers";
import CONTRACT_JSON from "../abi/TrackSupplyChain.json";

const ABI = CONTRACT_JSON.abi;
const GANACHE_CHAIN_ID = "0x539";

const getEthereumProvider = () => {
  if (!window.ethereum) return null;

  if (Array.isArray(window.ethereum.providers)) {
    const metaMaskProvider = window.ethereum.providers.find(
      (provider) => provider?.isMetaMask
    );
    return metaMaskProvider || window.ethereum;
  }

  return window.ethereum;
};

const getContract = async () => {
  const eth = getEthereumProvider();
  if (!eth) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider(eth);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId).toString();
  const deployedNetwork = CONTRACT_JSON.networks?.[chainId];

  if (!deployedNetwork?.address) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  return new ethers.Contract(deployedNetwork.address, ABI, signer);
};

function Register({ account, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Farmer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eth = getEthereumProvider();
    if (!eth) {
      alert("MetaMask not detected!");
      return;
    }

    if (!account) {
      alert("Please connect MetaMask wallet first");
      return;
    }

    try {
      setLoading(true);

      const chainId = await eth.request({ method: "eth_chainId" });
      if (chainId !== GANACHE_CHAIN_ID) {
        alert("Please switch MetaMask network to Ganache Localhost (1337).");
        return;
      }

      const contract = await getContract();
      let tx;

      if (role === "Farmer") {
        tx = await contract.registerFarmer(name, "Unknown", "NA");
      } else if (role === "Supplier") {
        tx = await contract.registerSupplier(name, "Unknown", "NA");
      } else if (role === "Aggregator") {
        tx = await contract.registerAggregator(name, "Unknown", "NA");
      } else if (role === "Retailer") {
        tx = await contract.registerRetailer(name, "Unknown", "NA");
      } else if (role === "Customer") {
        tx = await contract.registerCustomer(name, "Unknown", "NA");
      }

      await tx.wait();

      alert(`Successfully registered as ${role} on blockchain`);
      onSwitchToLogin();
    } catch (err) {
      console.error(err);
      alert("Blockchain transaction failed or rejected");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <p>
            <b>Wallet:</b> {account || "Not Connected"}
          </p>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Farmer">Farmer</option>
            <option value="Supplier">Supplier</option>
            <option value="Aggregator">Aggregator</option>
            <option value="Retailer">Retailer</option>
            <option value="Customer">Customer</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "12px", fontSize: "14px" }}>
          Already registered?{" "}
          <span
            style={{ color: "#f28c6f", cursor: "pointer", fontWeight: "bold" }}
            onClick={onSwitchToLogin}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
