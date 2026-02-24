# Protochain

Welcome to our `Blockchain Prototype project`, a cutting-edge simulation that mirrors the foundational aspects of Bitcoin, but with a modern twist: it's built using TypeScript. This prototype aims to provide developers and enthusiasts alike with a hands-on experience of blockchain technology, including the creation, verification, and management of blocks in a decentralized environment.
## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Dependencies](#dependencies)
- [Scripts](#scripts)
- [Building the Project](#building-the-project)
- [Testing](#testing)
- [Contributors](#contributors)
- [License](#license)

## Introduction

[//]: # (Provide a more detailed introduction to the project, its goals, and any relevant background information.)

## Installation


```bash
# Clone the repository and install dependencies
git clone https://github.com/Reshzera/Protochain.git
cd protochain
npm install
```

## Usage

To start the project, you can use the following commands:

- For development:
  - API server: `npm run dev:api`
  - Miner client: `npm run dev:miner`
  - Wallet client: `npm run dev:wallet`
- To build the project: `npm run build`
- To start the production server: `npm start`

## Features

### Blockchain and Core Classes

- **Blockchain Core**: Implementation of the blockchain data structure, enabling secure storage of blocks in a continuous and immutable chain.
- **Transactions (TX)**: Development of a transaction system that allows users to securely send and receive digital values within the network.
- **Transaction Inputs (TXI)**: Creation of transaction inputs, which are references to outputs from previous transactions, allowing the origin of values to be traced.
- **Transaction Outputs (TXO)**: Implementation of transaction outputs, which determine how the values from transactions are distributed to new owners.
- **Wallets**: Development of digital wallets allowing users to manage their private and public keys, conduct transactions, and check their balances.
- **Block**: Implementation of the block structure, which includes a header containing metadata (such as proof of work) and a body composed of a set of transactions.

### Unit Testing to Ensure Code Security

- **Testing Framework**: Use of `jest` and `supertest` to create and execute unit and integration tests, ensuring all components of the blockchain function correctly and securely.
- **Test Coverage**: Implementation of tests to cover all essential functionalities, including generating and validating transactions, creating blocks, the mining process, and managing wallets.

### Clients for Users to Create Wallets and Become Miners

- **Wallet Client**: Development of a client that allows users to create and manage their wallets, send and receive transactions through an intuitive user interface.
- **Miner Client**: Implementation of a mining client that allows users to participate in the transaction validation process and the creation of new blocks, receiving rewards in exchange for their computational power.

## Dependencies

### Production Dependencies

- `axios`: Promise based HTTP client for the browser and node.js
- `crypto-js`: JavaScript library of crypto standards.
- `dotenv`: Loads environment variables from a `.env` file.
- `ecpair`: Library for elliptic curve pairs.
- `express`: Fast, unopinionated, minimalist web framework for node.
- `morgan`: HTTP request logger middleware for node.js.
- `tiny-secp256k1`: A small and efficient JavaScript library for Secp256k1 signatures.

### Development Dependencies

- TypeScript and various typings (`@types/*`)
- Linting tools (`eslint`, `eslint-config-prettier`, etc.)
- Testing tools (`jest`, `supertest`, `ts-jest`)
- Build tools (`tsc`, `ts-node-dev`)

## Scripts

The `scripts` section of the `package.json` defines the following:

- `dev:api`: Runs the development server for the API.
- `build`: Compiles TypeScript code to JavaScript.
- `start`: Starts the compiled server.
- `lint`: Runs ESLint to check for code quality issues.
- `test`: Runs the test suite using Jest.
- `dev:miner`: Runs the development server for the miner client.
- `dev:wallet`: Runs the development server for the wallet client.

## Building the Project

```bash
npm run build
```

This command compiles the TypeScript source files into JavaScript to the `dist/` directory.

## Testing

```bash
npm run test
```

This command runs the test suite defined with Jest.


## License

This project is open-sourced software licensed under the MIT License.
