# SOS DAO

SOS Chain is an open-source blockchain infrastructure for transparent humanitarian fundraising and programmable aid distribution.

Open-source infrastructure for transparent humanitarian funding using blockchain.

This repository is designed as a **humanitarian use case** for public-good aligned funding, accountability, and on-chain coordination.

## Project Overview

SOS DAO provides a modular stack for:

- Transparent fundraising through on-chain pools
- Controlled treasury operations via role-based and multisig flows
- Donation-to-NFT minting for auditable participation records
- API and UI layers for operational visibility

Repository layout:

- `contracts/` reviewer-friendly contract entry point (maps to `main/contracts/`)
- `interface/` reviewer-friendly app entry point (maps to `ui/`)
- `docs/` project documentation
- `scripts/` repository-level helper scripts
- `main/` canonical Hardhat workspace
- `ui/` canonical frontend/backend workspaces

## Architecture

The system has three layers:

1. Protocol layer (smart contracts)
2. Data/API layer (backend indexing and services)
3. Application layer (frontend user experience)

## Smart Contracts

Canonical source: `main/contracts/platform`

Reviewer-focused components:

- Fundraising contracts: `PoolManager`, `Pool`
- Treasury / pool logic: `Vault`, `RequestManager`, `Authority`
- Multisig interaction: `Vault` execution and signer approval flow
- Supporting primitives: `Mint`, `Registry`

Smart contracts have been independently audited.

## How to Run

Install dependencies per package:

```bash
cd main && npm install
cd ../ui/sosdao-ui-main && npm install
cd ../sosdao-backend-master && npm install
```

Run contract tests:

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

MIT License. See `LICENSE`.
