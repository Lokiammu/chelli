import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CONTRACT_JSON from "./abi/TrackSupplyChain.json";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import SalesDashboard from "./components/SalesDashboard";
import PaymentPage from "./components/PaymentPage";
import ChatPage from "./components/ChatPage";
import TraceProduct from "./components/TraceProduct";
import ScanQR from "./components/ScanQR";
import AboutUs from "./components/AboutUs";
import "./App.css";

const ABI = CONTRACT_JSON.abi;
const GANACHE_CHAIN_ID = "0x539";
const NETWORKS = {
  "0x1": "Ethereum Mainnet",
  "0x539": "Ganache Localhost",
  "0x7a69": "Hardhat Localhost",
  "0x5": "Goerli Testnet",
};

const getEthereumProvider = () => {
  if (!window.ethereum) return null;

  // Brave can inject multiple providers. Prefer MetaMask if present.
  if (Array.isArray(window.ethereum.providers)) {
    const metaMaskProvider = window.ethereum.providers.find(
      (provider) => provider?.isMetaMask
    );
    return metaMaskProvider || window.ethereum;
  }

  return window.ethereum;
};

export default function App() {
  const [page, setPage] = useState("login");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [crops, setCrops] = useState([]);
  const [activeRole, setActiveRole] = useState("farmer");
  const [showCropStatus, setShowCropStatus] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [networkWarning, setNetworkWarning] = useState("");
  const currentRole = currentUser?.role?.toLowerCase() || "";

  const setNetworkFromChainId = (chainId) => {
    setNetwork(NETWORKS[chainId] || chainId);
    setNetworkWarning(
      chainId !== GANACHE_CHAIN_ID
        ? "Please switch MetaMask to Ganache Localhost (Chain ID 1337)."
        : ""
    );
  };

  const clearSessionIfWalletChanged = (walletAddress) => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (
      storedUser?.address &&
      walletAddress &&
      storedUser.address.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      setCurrentUser(null);
      setPage("login");
    }
  };

  const syncWalletState = async (provider) => {
    const eth = provider || getEthereumProvider();
    if (!eth) return;

    const accounts = await eth.request({ method: "eth_accounts" });
    const activeAccount = accounts[0] || null;
    setAccount(activeAccount);
    if (activeAccount) {
      clearSessionIfWalletChanged(activeAccount);
    }

    const chainId = await eth.request({ method: "eth_chainId" });
    setNetworkFromChainId(chainId);
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

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUsers(storedUsers);
    setCurrentUser(storedUser);
  }, []);

  useEffect(() => {
    const { pathname, search } = window.location;
    if (!pathname.startsWith("/trace")) return;

    const params = new URLSearchParams(search);
    const cropId = params.get("cropId");
    if (cropId) {
      setSelectedCrop({ id: cropId });
    }
    setPage("trace");
  }, []);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    const loadCropsFromBlockchain = async () => {
      try {
        if (!getEthereumProvider()) return;

        const contract = await getContract();
        const count = Number(await contract.cropCount());
        const loaded = [];

        for (let i = 0; i < count; i++) {
          const cropID = await contract.cropIDs(i);
          const crop = await contract.crops(cropID);
          loaded.push({
            id: cropID,
            type: crop.cropType,
            origin: crop.origin,
            stage: crop.stage,
            holder: crop.currentHolder,
            transferDate: crop.transferDate,
            history: [],
            price: crop.price,
          });
        }

        setCrops(loaded);
      } catch (err) {
        console.error("Blockchain crop load error:", err);
      }
    };

    loadCropsFromBlockchain();
  }, []);

  const connectWallet = async () => {
    const eth = getEthereumProvider();
    if (!eth) {
      alert("MetaMask not detected!");
      return;
    }

    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const activeAccount = accounts[0] || null;
    setAccount(activeAccount);
    if (activeAccount) {
      clearSessionIfWalletChanged(activeAccount);
    }

    const chainId = await eth.request({ method: "eth_chainId" });
    setNetworkFromChainId(chainId);
  };

  useEffect(() => {
    const eth = getEthereumProvider();
    if (!eth) return;

    syncWalletState(eth);

    const handleAccountsChanged = (accounts) => {
      const activeAccount = accounts[0] || null;
      setAccount(activeAccount);
      if (activeAccount) {
        clearSessionIfWalletChanged(activeAccount);
      }
    };

    const handleChainChanged = (chainId) => {
      setNetworkFromChainId(chainId);
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      if (eth.removeListener) {
        eth.removeListener("accountsChanged", handleAccountsChanged);
        eth.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const handleRegister = (user) => {
    setUsers((prev) => [...prev, user]);
    alert("Registered successfully! Please login.");
    setPage("login");
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setPage("dashboard");
  };

  const logout = () => {
    setCurrentUser(null);
    setPage("login");
  };

  const handleTrackProduce = (crop) => {
    setSelectedCrop(crop);
    setPage("trace");
  };

  const handlePay = (crop) => {
    setSelectedProduct(crop);
    setPage("payment");
    setActiveRole("customer");
  };

  const handleContact = (crop) => {
    setSelectedFarmer({
      name: crop.farmerName,
      contact: crop.farmerContact,
      product: crop,
    });
    setPage("chat");
  };

  return (
    <div className="App">
      <header className="header">
        <div className="logo">
          <b>AgriChain</b>
        </div>

        <div className="header-nav">
          <div className="nav-buttons">
            {currentUser ? (
              <>
                <button onClick={() => setPage("dashboard")}>Dashboard</button>
                <button onClick={() => setShowCropStatus(!showCropStatus)}>
                  {showCropStatus ? "Hide Crop Status" : "Show Crop Status"}
                </button>
                <button onClick={() => setPage("sales")}>Sales Dashboard</button>
                <button onClick={() => setPage("trace")}>Trace Product</button>
                <button onClick={() => setPage("scanqr")}>Scan QR</button>
                <button onClick={() => setPage("about")}>About Us</button>
                <button onClick={logout}>Logout</button>
              </>
            ) : (
              <button onClick={() => setPage("register")}>Register</button>
            )}
          </div>
        </div>
      </header>

      <div className="network-box">
        <p>
          <b>Wallet:</b> {account || "Not Connected"}
        </p>
        <p>
          <b>Network:</b> {network || "Unknown"}
        </p>
        {networkWarning && (
          <p style={{ color: "#d32f2f" }}>
            <b>{networkWarning}</b>
          </p>
        )}
        {!account && <button onClick={connectWallet}>Connect MetaMask</button>}
      </div>

      {(page === "register" || page === "login") && (
        <>
          {page === "register" && (
            <Register
              onRegister={handleRegister}
              onSwitchToLogin={() => setPage("login")}
              account={account}
              users={users}
            />
          )}
          {page === "login" && (
            <Login onLogin={handleLogin} account={account} users={users} />
          )}
        </>
      )}

      {page === "sales" && currentUser && (
        <SalesDashboard
          crops={crops}
          onTrackProduce={handleTrackProduce}
          onPay={handlePay}
          onContact={handleContact}
          currentUser={currentUser}
        />
      )}

      {page === "payment" && currentUser && (
        <PaymentPage product={selectedProduct} currentUser={currentUser} />
      )}

      {page === "dashboard" && currentUser && (
        <Dashboard
          userAddress={currentUser.address}
          crops={crops}
          setCrops={setCrops}
          role={currentRole}
          activeRole={currentRole}
          setActiveRole={setActiveRole}
          showCropStatus={showCropStatus}
          setShowCropStatus={setShowCropStatus}
        />
      )}

      {page === "chat" && currentUser && selectedFarmer && (
        <ChatPage
          farmer={selectedFarmer.name}
          farmerContact={selectedFarmer.contact}
          product={selectedFarmer.product}
          currentUser={currentUser}
        />
      )}

      {page === "trace" && (
        <TraceProduct crops={crops} selectedCrop={selectedCrop} />
      )}

      {page === "scanqr" && currentUser && <ScanQR getContract={getContract} />}

      {page === "about" && <AboutUs />}
    </div>
  );
}
