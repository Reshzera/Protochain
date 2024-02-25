/* eslint-disable no-console */
import axios from 'axios';
import dotenv from 'dotenv';
import Block from '../lib/block';
import Blockchain from '../lib/blockchain';
import Transaction from '../lib/transaction';
import TransactionOutput from '../lib/transactionOutput';
import { type BlockInfo } from '../lib/types/blockInfo';
import Wallet from '../lib/wallet';
dotenv.config();

const MINER_BASE_URL = process.env.BLOCKCHAIN_SERVER;
const MINER_WALLET = new Wallet(process.env.MINER_WALLET_PRIVATE_KEY);
console.log('logging MINER_WALLET:', MINER_WALLET);
let minedBlocks = 0;

async function getMinerInfo(): Promise<BlockInfo> {
  let blockInfo: BlockInfo | undefined | null;
  while (blockInfo === undefined || blockInfo === null) {
    console.log('Getting next block to mine...');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await axios.get<BlockInfo>(
      `${MINER_BASE_URL}/blocks/next`
    );
    blockInfo = response.data;
  }
  return blockInfo;
}

async function addBlockToBlockchain(newBlock: Block): Promise<void> {
  try {
    await axios.post(`${MINER_BASE_URL}/blocks`, newBlock);
    console.log('Block added to blockchain');
  } catch (error: any) {
    if (error.response) {
      console.error(
        'Error adding block to blockchain:',
        error.response.data.error
      );
      return;
    }
    console.error('Error on request');
  }
}

async function mine(): Promise<void> {
  const blockInfo = await getMinerInfo();
  console.log('Block to be mined:', blockInfo.index);
  const newBlock = Block.fromBlockInfo(blockInfo);
  let amount = 0;

  if (blockInfo.difficulty <= blockInfo.maxDifficulty) {
    amount += Blockchain.getRewardAmount();
  }

  const fees = newBlock.transactions.reduce((acc, tx) => acc + tx.getFee(), 0);

  const feeCheck = newBlock.transactions.length * blockInfo.feePerTx;

  if (fees < feeCheck) {
    console.log('Low fees. Await for more transactions...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await mine();
    return;
  }

  amount += fees;

  const txOutput = new TransactionOutput();
  txOutput.amount = amount;
  txOutput.toAddress = MINER_WALLET.publicKey;

  const feeTransactions = Transaction.fromReward(txOutput);
  newBlock.transactions.push(feeTransactions);

  newBlock.currentHash = newBlock.calculateHash();

  console.log('Mining...');
  newBlock.mine(blockInfo.difficulty, MINER_WALLET.publicKey);
  console.log('Block mined:', newBlock);
  console.log('Adding block to blockchain...');
  await addBlockToBlockchain(newBlock);
  minedBlocks++;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await mine();

  console.log('\n');
  console.log('========================');
  console.log('Mined blocks:', minedBlocks);
  console.log('========================');
  console.log('\n');
}

async function main(): Promise<void> {
  console.log('Miner started');
  try {
    await mine();
  } catch (error: any) {
    console.error('Error in miner:', error);
  }
}

main().catch((error) => {
  console.error('Error in miner:', error);
});
