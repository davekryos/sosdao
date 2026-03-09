# SOS DAO

SOS DAO is a platform built for transparent community fund management and on-chain donation tracking.

## Project Overview

This repository has 3 main parts:

- `main/`: Smart contracts (Hardhat)
- `ui/sosdao-ui-main/`: Web interface (React + Redux + Wagmi)
- `ui/sosdao-backend-master/`: API and indexing services (NestJS)

The system supports donations to fund pools, on-chain data synchronization, and donation NFT minting.

## Architecture

### 1. Smart Contracts (`main/`)

Core contracts:

- `PoolManager`: Creates new pools
- `Pool`: Handles fund deposits and pool operations
- `Vault`: Multi-signature transaction flow
- `Mint`: Mints NFTs for donations
- `Registry`: Stores contract address mappings
- `Authority`: Role-based access control
- `RequestManager`: Manages spending/request workflows

Tech stack:

- Hardhat
- OpenZeppelin Contracts
- UUPS upgradeable pattern

### 2. Frontend (`ui/sosdao-ui-main/`)

Frontend features:

- Wallet connection
- Pool listing and pool detail pages
- Donation flow (native + ERC20)
- NFT display
- On-chain transaction links

Tech stack:

- React
- Redux + Redux-Saga
- Wagmi / Ethers
- Bootstrap

### 3. Backend (`ui/sosdao-backend-master/`)

Backend responsibilities:

- Reads fund, donation, and NFT data from chain and serves it via API
- Runs periodic cron sync jobs for event/log indexing

Tech stack:

- NestJS
- Ethers
- Axios

## Folder Structure

```text
sos dao/
├─ main/                      # smart contracts
├─ ui/
│  ├─ sosdao-ui-main/         # frontend
│  └─ sosdao-backend-master/  # backend
└─ README.md
```

## Setup

Each subproject has its own dependencies.

### Smart Contracts

```bash
cd main
npm install
```

### Frontend

```bash
cd ui/sosdao-ui-main
npm install
```

### Backend

```bash
cd ui/sosdao-backend-master
npm install
```

## Run

### Smart Contracts

```bash
cd main
npm run test
```

> Note: `main/package.json` does not define a `compile` script by default. It includes test/lint/coverage scripts.

### Frontend

```bash
cd ui/sosdao-ui-main
npm run start
```

### Backend

```bash
cd ui/sosdao-backend-master
npm run start:dev
```

## Environment Variables

Frontend and backend use `.env` files for network and integration settings.

Common values include:

- Registry contract address
- RPC endpoint
- WalletConnect project id

## Notes

- Project name and branding are updated to **SOS DAO**.
- `Mint` is used as the NFT contract in the current flow.
- Network connection URLs (`haqq` endpoints) are intentionally preserved for chain connectivity.

## License

Licensing should be evaluated per subproject based on each package/license declaration.
