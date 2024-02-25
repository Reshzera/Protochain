/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import sha256 from 'crypto-js/sha256';
import Validation from './validation';
import { type BlockInfo } from './types/blockInfo';
import Transaction from './transaction';
import { TransactionType } from './types/transactionTypes';
/**
 * Block class
 * @class Block
 */

export default class Block {
  index: number;
  timestamp: number;
  transactions: Transaction[] = [];
  currentHash: string;
  previousHash: string | undefined;
  nonce: number;
  miner: string;
  /**
   * @constructor
   * @param {number} index - The index of the block
   * @param {number} timestamp - The timestamp of the block
   * @param {string} data - The data of the blockthe block
   * @param {string} hash - The hash of the block
   * @param {number} nonce - The nonce of the block
   * @param {string} miner - The miner of the block
   * @param {string} previousHash - The previous hash of the block
   */
  constructor(block?: Block) {
    this.index = block?.index ?? 0;
    this.timestamp = block?.timestamp ?? Date.now();
    this.transactions =
      block?.transactions?.map((tx) => new Transaction(tx)) ?? [];
    this.previousHash = block?.previousHash;
    this.nonce = block?.nonce ?? 0;
    this.miner = block?.miner ?? '';
    this.currentHash = block?.currentHash ?? this.calculateHash();
  }

  calculateHash(): string {
    const transactionsHash = this.transactions.length
      ? this.transactions.reduce((acc, tx) => acc + tx.hash, '')
      : '';
    const hash = sha256(
      this.index +
        this.timestamp +
        transactionsHash +
        this.previousHash +
        this.nonce +
        this.miner
    ).toString();
    return hash;
  }
  /**
   * Generates a hash for the block
   * @param difficulty - The difficulty of the block
   * @param mine - The miner of the block
   */

  mine(difficulty: number, mine: string): void {
    const prefix = '0'.repeat(difficulty);
    this.miner = mine;
    while (!this.currentHash.startsWith(prefix)) {
      this.nonce++;

      this.currentHash = this.calculateHash();
    }
  }

  isValid(
    previousBlock: Block,
    difficulty: number,
    feePerTx: number
  ): Validation {
    if (this.transactions && this.transactions.length > 0) {
      const feeTransactions = this.transactions.filter(
        (tx) => tx.type === TransactionType.FEE
      );

      if (feeTransactions.length > 1) {
        return new Validation('Invalid number of fee transactions', false);
      }

      if (
        feeTransactions.length > 0 &&
        !feeTransactions[0].txOutputs.some(
          (txo) => txo.toAddress === this.miner
        )
      ) {
        return new Validation('Invalid miner wallet', false);
      }

      const totalFees = feePerTx * this.transactions.length;

      if (this.transactions.some((tx) => !tx.isValid(totalFees).getStatus())) {
        const invalidTransactions = this.transactions.filter(
          (tx) => !tx.isValid(totalFees).getStatus()
        );
        const message = invalidTransactions
          .map((tx) => tx.isValid(totalFees).getMessage())
          .join(', ');
        return new Validation(`Invalid transaction: ${message}`, false);
      }
    }

    if (previousBlock.index + 1 !== this.index) {
      return new Validation('Invalid index', false);
    }
    if (this.previousHash !== previousBlock.currentHash) {
      return new Validation('Invalid previous hash', false);
    }
    if (this.nonce < 1) {
      return new Validation('Invalid nonce', false);
    }
    if (!this.miner) {
      return new Validation('Invalid miner', false);
    }
    const prefix = '0'.repeat(difficulty);

    if (
      this.calculateHash() !== this.currentHash ||
      !this.currentHash.startsWith(prefix)
    ) {
      return new Validation('Invalid hash', false);
    }

    return new Validation();
  }

  static fromBlockInfo(blockInfo: BlockInfo): Block {
    const block = new Block();
    block.index = blockInfo.index;
    block.previousHash = blockInfo.previousHash;
    if (blockInfo.transactions.length) {
      block.transactions = blockInfo.transactions.map(
        (tx) => new Transaction(tx)
      );
    }

    return block;
  }
}
