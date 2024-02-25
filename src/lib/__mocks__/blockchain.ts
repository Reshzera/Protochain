import { type BlockInfo } from '../types/blockInfo';
import { type TransactionSearch } from '../types/transactionSearch';
import { TransactionType } from '../types/transactionTypes';
import Validation from '../validation';
import Block from './block';
import Transaction from './transaction';
import type TransactionInput from './transactionInput';
import TransactionOutput from './transactionOutput';

export default class Blockchain {
  blocks: Block[];
  mempool: Transaction[];
  private nextIndex: number;
  private static difficulty: number = 2;
  static readonly TX_PER_BLOCK: number = 2;
  private static readonly MAX_DIFFICULTY: number = 5;

  constructor(miner: string) {
    this.blocks = [this.createGenesisBlock(miner)];
    this.mempool = [];
    this.nextIndex = 1;
  }

  private createGenesisBlock(miner: string): Block {
    const amout = Blockchain.getRewardAmount();

    const txOutput = new TransactionOutput();
    txOutput.toAddress = miner;
    txOutput.amount = amout;

    const tx = new Transaction();
    tx.type = TransactionType.FEE;
    tx.txOutputs = [txOutput];
    tx.hash = tx.getHash();
    tx.txOutputs.forEach((txOutput) => {
      txOutput.txHash = tx.hash;
    });

    const genesisBlock = new Block();
    genesisBlock.transactions = [tx];
    genesisBlock.mine(Blockchain.difficulty, miner);

    return genesisBlock;
  }

  public getLastBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  public getTransactionByHash(hash: string): TransactionSearch | undefined {
    const mempoolTx = this.mempool.find((tx) => tx.hash === hash);
    if (mempoolTx) {
      return {
        blockIndex: undefined,
        transaction: mempoolTx,
        mempoolIndex: this.mempool.indexOf(mempoolTx),
      };
    }

    const blockTx = this.blocks.find((block) =>
      block.transactions.some((tx) => tx.hash === hash)
    );
    if (blockTx) {
      const transaction = blockTx.transactions.find((tx) => tx.hash === hash);
      if (transaction) {
        return {
          blockIndex: this.blocks.indexOf(blockTx),
          transaction,
          mempoolIndex: undefined,
        };
      }
    }

    return undefined;
  }

  public addTransaction(transaction: Transaction): Validation {
    if (transaction.txInputs && transaction.txInputs.length > 0) {
      const from = transaction.txInputs[0].fromAddress;
      const pendingTx = this.mempool.filter(
        (tx) =>
          tx.txInputs &&
          tx.txInputs.some((txInput) => txInput.fromAddress === from)
      );

      if (pendingTx && pendingTx.length > 0) {
        return new Validation(
          'There is a pending transaction from this address',
          false
        );
      }
    }

    const validation = transaction.isValid(this.getFeePerTx());
    if (!validation.getStatus()) {
      return validation;
    }
    if (
      this.blocks.some((block) =>
        block.transactions.some((tx) => tx.hash === transaction.hash)
      )
    ) {
      return new Validation(
        'Transaction already exists in the blockchain',
        false
      );
    }

    this.mempool.push(transaction);
    return new Validation(transaction.hash, true);
  }

  public addBlock(block: Block): Validation {
    const nextBlock = this.getNewBlock();

    if (!nextBlock) {
      return new Validation(
        'There are not enough transactions to create a new block',
        false
      );
    }

    const previousBlock = this.getLastBlock();
    if (
      !block
        .isValid(previousBlock, Blockchain.difficulty, this.getFeePerTx())
        .getStatus()
    ) {
      return new Validation(
        `Invalid block: ${block.isValid(previousBlock, Blockchain.difficulty, this.getFeePerTx()).getMessage()}`,
        false
      );
    }
    const txsHash = block.transactions
      .filter((tx) => tx.type === TransactionType.REGULAR)
      .map((tx) => tx.hash);
    const newMemPool = this.mempool.filter((tx) => !txsHash.includes(tx.hash));

    if (txsHash.length + newMemPool.length !== this.mempool.length) {
      return new Validation(
        'Invalid block: mempool length is not consistent with transactions in the block.',
        false
      );
    }

    this.mempool = newMemPool;
    this.nextIndex++;
    this.blocks.push(new Block(block));

    this.calculateDifficulty();
    return new Validation(block.currentHash, true);
  }

  private calculateDifficulty(): void {
    if (this.blocks.length % 5 === 0) {
      Blockchain.difficulty = Blockchain.difficulty + 1;
    }
  }

  public getDifficulty(): number {
    return Blockchain.difficulty;
  }

  public isBlockchainValid(): Validation {
    for (let i = 1; i < this.blocks.length; i++) {
      const previousBlock = this.blocks[i - 1];
      const currentBlock = this.blocks[i];
      if (
        !currentBlock
          .isValid(previousBlock, Blockchain.difficulty, this.getFeePerTx())
          .getStatus()
      ) {
        return new Validation(
          `Invalid block of index ${currentBlock.index}: ${currentBlock.isValid(previousBlock, Blockchain.difficulty, this.getFeePerTx()).getMessage()}`,
          false
        );
      }
    }
    return new Validation();
  }

  getFeePerTx(): number {
    return 1;
  }

  getNewBlock(): BlockInfo | null {
    if (this.mempool.length < Blockchain.TX_PER_BLOCK) {
      return null;
    }

    const totalTransactions = [...this.mempool];
    const transaction = totalTransactions.splice(0, Blockchain.TX_PER_BLOCK);
    const difficulty = this.getDifficulty();
    const previousBlockHash = this.getLastBlock().currentHash;
    const feePerTx = this.getFeePerTx();
    const maxDifficulty = Blockchain.MAX_DIFFICULTY;
    const index = this.getNextIndex();

    return {
      index,
      transactions: transaction,
      previousHash: previousBlockHash,
      difficulty,
      feePerTx,
      maxDifficulty,
    };
  }

  public getTxInputs(wallet: string): Array<TransactionInput | undefined> {
    const txs = this.blocks
      .map((block) => block.transactions)
      .flat()
      .filter((tx) => tx.txInputs && tx.txInputs.length > 0)
      .map((tx) => tx.txInputs)
      .flat()
      .filter((txInput) => txInput?.fromAddress === wallet);

    return txs;
  }

  public getTxOutputs(wallet: string): TransactionOutput[] {
    const txs = this.blocks
      .map((block) => block.transactions)
      .flat()
      .filter((tx) => tx.txOutputs && tx.txOutputs.length > 0)
      .map((tx) => tx.txOutputs)
      .flat()
      .filter((txOutput) => txOutput.toAddress === wallet);

    return txs;
  }

  public getUTXO(wallet: string): TransactionOutput[] {
    const txINs = this.getTxInputs(wallet);
    const txOUTs = this.getTxOutputs(wallet);

    if (txINs.length === 0 || !txINs) {
      return txOUTs;
    }

    txINs.forEach((txIN) => {
      const txOUT = txOUTs.find(
        (txOUT) => txOUT.txHash === txIN?.previousTxHash
      );
      if (txOUT) {
        txOUTs.splice(txOUTs.indexOf(txOUT), 1);
      }
    });

    return txOUTs;
  }

  getBalance(wallet: string): number {
    const utxo = this.getUTXO(wallet);
    if (utxo.length === 0) {
      return 0;
    }
    return utxo.reduce((acc, tx) => acc + tx.amount, 0);
  }

  public getBlocks(): Block[] {
    return this.blocks;
  }

  public getNextIndex(): number {
    return this.nextIndex;
  }

  static getRewardAmount(): number {
    return 64 - Blockchain.difficulty * 10;
  }
}
