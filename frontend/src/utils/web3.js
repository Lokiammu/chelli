/**
 * Shared Web3 / Blockchain Utility
 * ─────────────────────────────────
 * Single source of truth for:
 *  - MetaMask provider detection
 *  - Contract instantiation
 *  - Network validation
 *
 * All components should import from here instead of
 * duplicating getContract() / getEthereumProvider().
 */

import { ethers } from "ethers";
import CONTRACT_JSON from "../abi/TrackSupplyChain.json";

// ── Constants ────────────────────────────────────────────
export const ABI = CONTRACT_JSON.abi;
export const GANACHE_CHAIN_ID = "0x539"; // 1337 decimal

// ── Provider Detection ──────────────────────────────────
/**
 * Returns the MetaMask Ethereum provider, handling Brave
 * multi-provider edge cases.
 */
export function getEthereumProvider() {
    if (!window.ethereum) return null;

    // Brave can inject multiple providers — prefer MetaMask
    if (Array.isArray(window.ethereum.providers)) {
        const metaMask = window.ethereum.providers.find(
            (p) => p?.isMetaMask
        );
        return metaMask || window.ethereum;
    }

    return window.ethereum;
}

// ── Contract Address Resolution ─────────────────────────
/**
 * Determines the deployed contract address by checking
 * multiple sources in priority order:
 *
 *   1. Truffle ABI networks field (chain id "1337")
 *   2. Truffle ABI networks field (network id "5777")
 *   3. Last deployed network in the ABI
 *   4. REACT_APP_CONTRACT_ADDRESS env variable
 */
export function getContractAddress() {
    // 1. Try Truffle build artifact `networks` field
    if (CONTRACT_JSON.networks) {
        // Ganache chain IDs to try
        const tryIds = ["1337", "5777"];

        for (const id of tryIds) {
            if (CONTRACT_JSON.networks[id]?.address) {
                return CONTRACT_JSON.networks[id].address;
            }
        }

        // Fallback: use last deployed network (any chain)
        const keys = Object.keys(CONTRACT_JSON.networks);
        if (keys.length > 0) {
            const last = CONTRACT_JSON.networks[keys[keys.length - 1]];
            if (last?.address) return last.address;
        }
    }

    // 2. Environment variable (Create React App supports REACT_APP_ prefix)
    if (process.env.REACT_APP_CONTRACT_ADDRESS) {
        return process.env.REACT_APP_CONTRACT_ADDRESS;
    }

    return null;
}

// ── Network Validation ──────────────────────────────────
/**
 * Checks that MetaMask is connected to Ganache.
 * Returns { ok: true } or { ok: false, error: "..." }
 */
export async function checkNetwork() {
    const eth = getEthereumProvider();
    if (!eth) {
        return { ok: false, error: "MetaMask not detected. Please install MetaMask." };
    }

    const chainId = await eth.request({ method: "eth_chainId" });
    // Ganache CLI usually uses 1337 (0x539), Ganache GUI sometimes uses 5777 (0x1691)
    if (chainId !== "0x539" && chainId !== "0x1691") {
        return {
            ok: false,
            error: `Please switch MetaMask to Ganache Localhost (Chain ID 1337 or 5777). Current Chain ID is ${parseInt(chainId, 16)}.`,
        };
    }

    return { ok: true };
}

// ── Contract Instance ───────────────────────────────────
/**
 * Returns a connected ethers.Contract instance.
 * Throws descriptive errors if anything is missing.
 */
export async function getContract() {
    const eth = getEthereumProvider();
    if (!eth) {
        throw new Error("MetaMask not detected. Please install MetaMask.");
    }

    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();

    const address = getContractAddress();
    if (!address) {
        throw new Error(
            "Contract address not found.\n\n" +
            "To fix this:\n" +
            "  1. Start Ganache on port 7545\n" +
            "  2. Run: truffle migrate --reset\n" +
            "  3. Copy build/contracts/TrackSupplyChain.json to frontend/src/abi/\n" +
            "  4. Restart the frontend (npm start)"
        );
    }

    return new ethers.Contract(address, ABI, signer);
}
