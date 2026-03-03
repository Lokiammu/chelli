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

function Login({ onLogin, account }) {
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
      alert("Connect MetaMask first!");
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
      let isValid = false;

      if (role === "Farmer") {
        isValid = await contract.farmers(account);
      } else if (role === "Supplier") {
        isValid = await contract.suppliers(account);
      } else if (role === "Aggregator") {
        isValid = await contract.aggregators(account);
      } else if (role === "Retailer") {
        isValid = await contract.retailers(account);
      } else if (role === "Customer") {
        isValid = await contract.customers(account);
      }

      if (!isValid) {
        alert(`This wallet is not registered as ${role}`);
        return;
      }

      const message = `Login as ${role}`;
      await eth.request({
        method: "personal_sign",
        params: [message, account],
      });

      onLogin({
        address: account,
        role,
      });

      alert(`Login successful as ${role}`);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <p>
            <b>Wallet:</b> {account || "Not Connected"}
          </p>

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Farmer">Farmer</option>
            <option value="Supplier">Supplier</option>
            <option value="Aggregator">Aggregator</option>
            <option value="Retailer">Retailer</option>
            <option value="Customer">Customer</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
