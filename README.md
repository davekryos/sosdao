# SOS DAO

SOS Chain is an open-source blockchain infrastructure for transparent humanitarian fundraising and programmable aid distribution.

This repository is designed as a **humanitarian use case** for public-good aligned funding, accountability, and on-chain coordination.

## Project Overview

SOS DAO provides a modular stack for:

- Transparent fundraising through on-chain pools
- Controlled treasury operations via role-based and multisig flows
- Donation-to-NFT minting for auditable participation records
- API and UI layers for operational visibility

Repository structure:

- `main/` smart contracts (Hardhat)
- `ui/sosdao-ui-main/` frontend application (React)
- `ui/sosdao-backend-master/` backend/indexer services (NestJS)

## Architecture

The system has three layers:

1. Protocol layer (smart contracts)
- Pool lifecycle and fund custody
- Role-based permissions and governance controls
- Minting and registry primitives

2. Data/API layer (backend)
- Event/log indexing from chain
- Normalized API endpoints for funds, donations, and NFTs

3. Application layer (frontend)
- Wallet connection and transaction UX
- Pool discovery, donation flow, and balance views
- NFT rendering and transaction traceability

## Smart Contracts

Main contracts in `main/contracts/platform`:

- `PoolManager`: deploys and tracks pools
- `Pool`: accepts deposits and connects to vault/mint flow
- `Vault`: multisig execution path for controlled fund movements
- `Mint`: mints donation NFTs
- `Registry`: stores canonical contract addresses
- `Authority`: access-control authority and role enforcement
- `RequestManager`: request/approval execution workflow

## How to Run

Install dependencies per package:

```bash
cd main && npm install
cd ../ui/sosdao-ui-main && npm install
cd ../sosdao-backend-master && npm install
```

Run contracts tests:

```bash
cd main
npm run test
```

Run frontend:

```bash
cd ui/sosdao-ui-main
npm run start
```

Run backend:

```bash
cd ui/sosdao-backend-master
npm run start:dev
```

## License

This repository contains multiple subprojects. License terms should be evaluated per package and its declared license metadata/files.
