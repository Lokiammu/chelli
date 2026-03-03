// src/utils/contract.js
import Web3 from "web3";
import TrackSupplyChain from "../contracts/TrackSupplyChain.json";

let web3;
let contract;

export const loadWeb3 = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    return web3;
  } else {
    alert("Please install MetaMask!");
  }
};

export const loadContract = async () => {
  const netId = await web3.eth.net.getId();
  const deployedNetwork = TrackSupplyChain.networks[netId];
  if (deployedNetwork) {
    contract = new web3.eth.Contract(TrackSupplyChain.abi, deployedNetwork.address);
    return contract;
  } else {
    alert("Contract not deployed on this network!");
  }
};

export const getAccount = async () => {
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
};
