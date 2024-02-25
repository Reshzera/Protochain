/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-console */
import Wallet from '../lib/wallet';
import axio from 'axios';
import readline from 'readline';
import dotenv from 'dotenv';
import Transaction from '../lib/transaction';
import { TransactionType } from '../lib/types/transactionTypes';
import TransactionInput from '../lib/transactionInput';
import TransactionOutput from '../lib/transactionOutput';
dotenv.config();

const BLOCKCHAIN_SERVER =
  process.env.BLOCKCHAIN_SERVER ?? 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let walletPublicKey: string = '';
let walletPrivateKey: string = '';

function menu(): void {
  setTimeout(() => {
    console.clear();

    if (!walletPublicKey) {
      console.log('You are not logged in!');
    }

    console.log(`Your wallet public key: ${walletPublicKey}`);
    console.log('\n');
    console.log('1. Create wallet');
    console.log('2. Recover wallet');
    console.log("3. Get wallet's balance");
    console.log('4. Send transaction');
    console.log('5. Search for a transaction');

    rl.question('Choose an option: ', async (option) => {
      switch (option) {
        case '1':
          console.log('Creating wallet...');
          createWallet();
          break;
        case '2':
          console.log('Recovering wallet...');
          recoverWallet();
          break;
        case '3':
          console.log('Getting wallet balance...');
          await getBalance();

          break;
        case '4':
          console.log('Sending transaction...');
          await sendTx();
          break;
        case '5':
          console.log('Searching for a transaction...');
          searchTx();
          break;
        default:
          console.log('Invalid option');
          menu();
          break;
      }
    });
  }, 1000);
}

function preMenu(): void {
  console.log('\n');

  rl.question('Press any key to continue...', () => {
    menu();
  });
}

function createWallet(): void {
  console.clear();
  const wallet = new Wallet();
  walletPublicKey = wallet.publicKey;
  walletPrivateKey = wallet.privateKey;
  console.log('Wallet created!', wallet);
  preMenu();
}

function recoverWallet(): void {
  console.clear();
  rl.question('Enter your private key or WIF: ', (privateKey) => {
    const wallet = new Wallet(privateKey);
    walletPublicKey = wallet.publicKey;
    walletPrivateKey = wallet.privateKey;
    console.log('Wallet recovered!', wallet);
    preMenu();
  });
}

async function getBalance(): Promise<void> {
  console.clear();

  if (!walletPublicKey) {
    console.log('You are not logged in!');
    preMenu();
    return;
  }

  const response = await axio.get(
    `${BLOCKCHAIN_SERVER}/wallet/${walletPublicKey}`
  );
  console.log('Wallet balance:', response.data.balance);

  preMenu();
}

async function sendTx(): Promise<void> {
  console.clear();

  if (!walletPublicKey) {
    console.log('You are not logged in!');
    preMenu();
    return;
  }

  console.log(`Your wallet is: ${walletPublicKey}`);
  rl.question('To Wallet: ', (toWallet) => {
    if (toWallet === walletPublicKey) {
      console.log('You cannot send money to yourself');
      preMenu();
    }
    if (toWallet.length < 66) {
      console.log('Invalid wallet');
      preMenu();
    }

    rl.question('Amount: ', async (amount) => {
      const amountNumber = Number(amount);
      if (isNaN(Number(amount))) {
        console.log('Invalid amount');
        preMenu();
        return;
      }
      if (amountNumber <= 0) {
        console.log('Invalid amount');
        preMenu();
        return;
      }
      const walletResponse = await axio.get(
        `${BLOCKCHAIN_SERVER}/wallet/${walletPublicKey}`
      );
      const balance = walletResponse.data.balance;
      const fee = walletResponse.data.fee;
      const utxo = walletResponse.data.utxo;

      if (balance < amountNumber + fee) {
        console.log('Insufficient balance');
        preMenu();
        return;
      }

      const txInputsArray: TransactionInput[] = utxo.map(
        (txo: TransactionOutput) => TransactionInput.fromTxo(txo)
      );
      txInputsArray.forEach((txInput) => {
        txInput.signTransaction(walletPrivateKey);
      });
      const txOutputsArray: TransactionOutput[] = [];

      const txOutput = new TransactionOutput();
      txOutput.amount = amountNumber;
      txOutput.toAddress = toWallet;
      txOutputsArray.push(txOutput);

      const remaninBlance = balance - amountNumber - fee;

      if (remaninBlance > 0) {
        const txOutputRemain = new TransactionOutput();
        txOutputRemain.amount = remaninBlance;
        txOutputRemain.toAddress = walletPublicKey;
        txOutputsArray.push(txOutputRemain);
      }

      const txInput = new TransactionInput();
      txInput.fromAddress = walletPublicKey;
      txInput.amount = amountNumber;
      txInput.previousTxHash = utxo[0].txHash;
      txInput.signTransaction(walletPrivateKey);

      const tx = new Transaction();
      tx.type = TransactionType.REGULAR;
      tx.txOutputs = txOutputsArray;
      tx.txInputs = txInputsArray;
      tx.hash = tx.getHash();
      tx.txOutputs.forEach((txOutput) => {
        txOutput.txHash = tx.hash;
      });

      try {
        const result = await axio.post(`${BLOCKCHAIN_SERVER}/transactions`, tx);
        console.log('Transaction sent!', result.data);
        console.log('Remaining balance: ', remaninBlance);
        console.log("Waiting for the miner's confirmation...");
      } catch (error) {
        console.log('Error sending transaction', error);
      }
      preMenu();
    });
  });
}

function searchTx(): void {
  console.clear();

  if (!walletPublicKey) {
    console.log('You are not logged in!');
    preMenu();
    return;
  }

  rl.question('Enter the transaction hash: ', async (hash) => {
    try {
      const result = await axio.get(
        `${BLOCKCHAIN_SERVER}/transactions/${hash || 'invalid'}`
      );
      console.log('Transaction found!', result.data);
    } catch (error) {
      console.log('Transaction not found', error);
    }
    preMenu();
  });
}

menu();
