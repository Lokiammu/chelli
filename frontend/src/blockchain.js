import { ethers } from "ethers";
import ABI from "./abi/TrackSupplyChain.json";

export const CONTRACT_ADDRESS = "0x6934948aa57D9909f90b06905559ddf0851BE29F";

export async function getContract() {
  if (!window.ethereum) {
    alert("Install MetaMask");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI.abi,
    signer
  );

  return contract;
}