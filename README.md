# 🌾 AgriChain (Chelli)

Blockchain-powered agricultural supply chain tracking with IoT sensors and ML quality prediction.

## Structure

```
chelli/
├── backend/           ← Express API + Solidity contracts + ML + IoT firmware
│   ├── contracts/     ← Solidity smart contracts
│   ├── migrations/    ← Truffle deployment scripts
│   ├── controllers/   ← Route handlers
│   ├── routes/        ← Express routes
│   ├── store/         ← In-memory data store
│   ├── ml/            ← SVM model for quality prediction
│   ├── firmware/      ← ESP8266 Arduino sketches
│   ├── scripts/       ← Deployment helpers
│   ├── server.js      ← Main API server (port 3000)
│   └── truffle-config.js
│
└── frontend/          ← React app with MetaMask integration
    └── src/
        ├── abi/       ← Contract ABI (auto-copied after deploy)
        ├── components/← Role-specific dashboards
        └── utils/     ← Shared web3 utilities
```

## Quick Start

```bash
# 1. Install everything
npm run install:all

# 2. Start Ganache (GUI or CLI on port 7545)

# 3. Deploy contracts
cd backend
npm run deploy          # compiles, migrates, copies ABI to frontend

# 4. Configure backend
cp .env.example .env    # edit: add PRIVATE_KEY from Ganache

# 5. Start backend
npm start               # runs on port 3000

# 6. Start frontend (new terminal)
cd frontend
npm start               # runs on port 3001

# 7. In MetaMask: add network http://127.0.0.1:7545 (Chain ID 1337)
# 8. Import a Ganache account → Register → Login → Dashboard
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Truffle |
| Backend API | Express.js, Web3.js, GraphQL |
| Frontend | React 18, ethers.js, MetaMask |
| ML | Python, scikit-learn (SVM) |
| IoT | ESP8266, MQ135, DHT11 |
| Storage | IPFS (Pinata), Ethereum (Ganache) |
