# SOS DAO

This repository contains the smart contracts source code for SOS DAO project.

## Compiling

To compile the project, run:

```bash
npx hardhat compile
```

This task will also generate TypeScript bindings using TypeChain.

## Testing

Run the full test suite with the following commands:

```bash
npm run test
```

## Deployment

This project leverages the [hardhat-deploy](https://github.com/wighawag/hardhat-deploy)
plugin for efficient and streamlined deployment of smart contracts.

### Deployment Scripts

Deployment scripts are located in the `deploy` folder. Each script in this folder
should export a function that will be executed by Hardhat when running the deploy
task.

Deployment scripts can be tagged and set to depend on each other. This is useful
for managing deployment order and reusing deployed contract addresses.

### Running Deployments

To execute deployments, use the Hardhat command:

```bash

npx hardhat --network NETWORK_NAME deploy

```

Configure the networks in `hardhat.config.js`. You can specify different network
settings, including mainnet and testnets, by setting the appropriate RPC URLs and
account details.

### Previous Deployments

The `deployments/` directory serves as a repository for artifacts from previous deployments,
organized by network.

The deployment process skips deployment transactions if no code changes are detected,
conserving resources and optimizing deployment time. This also aids in tracking and
managing contract versions across different networks.

## Platform Documentation

See the [Developer Documentation](./docs/platform.md) and the [Integration Documentation](./docs/integration.md).
