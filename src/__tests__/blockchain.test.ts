/* eslint-disable @typescript-eslint/consistent-type-assertions */
import Block from '../lib/block';
import Blockchain from '../lib/blockchain';
import Transaction from '../lib/transaction';
import TransactionInput from '../lib/transactionInput';
import TransactionOutput from '../lib/transactionOutput';
import { TransactionType } from '../lib/types/transactionTypes';
import Wallet from '../lib/wallet';

jest.mock('../lib/block');
jest.mock('../lib/transaction');
jest.mock('../lib/transactionInput');
jest.mock('../lib/transactionOutput');

describe('Blockchain tests', () => {
  const wallet = new Wallet();
  const wallet2 = new Wallet();

  const validTxInput = new TransactionInput();
  validTxInput.fromAddress = wallet.publicKey;
  validTxInput.amount = 10;
  validTxInput.previousTxHash = 'some hash';
  validTxInput.signTransaction(wallet.privateKey);

  const validTxOutput = new TransactionOutput();
  validTxOutput.toAddress = wallet2.publicKey;
  validTxOutput.amount = 10;

  const invalidTxInput = new TransactionInput();
  invalidTxInput.fromAddress = wallet.publicKey;
  invalidTxInput.amount = 0;
  invalidTxInput.signTransaction(wallet2.privateKey);

  const createNewBlockChain = (): Blockchain => {
    const blockchain = new Blockchain(wallet.publicKey);
    blockchain.mempool = Array.from({ length: 10 }).map((_, index) => {
      const wallet = new Wallet();

      const validTxInput = new TransactionInput();
      validTxInput.fromAddress = wallet.publicKey;
      validTxInput.amount = 10;
      validTxInput.previousTxHash = 'some hash';
      validTxInput.signTransaction(wallet.privateKey);

      const tx = new Transaction();
      tx.type = TransactionType.REGULAR;
      tx.txInputs = [new TransactionInput(validTxInput)];
      tx.txOutputs = [new TransactionOutput(validTxOutput)];
      tx.hash = tx.getHash();
      tx.txOutputs.forEach((txOutput) => {
        txOutput.txHash = tx.hash;
      });
      return tx;
    });

    return blockchain;
  };

  test('Should create genesis block', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const block = blockchain.getLastBlock();
    expect(block.index).toBe(0);
  });

  test('Should get blocks', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const blocks = blockchain.getBlocks();
    expect(blocks).toHaveLength(1);
  });

  test('Should get next index', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const nextIndex = blockchain.getNextIndex();
    expect(nextIndex).toBe(1);
  });

  test('Should be valid (genesis)', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    expect(blockchain.isBlockchainValid().getStatus()).toBeTruthy();
  });

  test('Should be valid (two blocks)', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.mine(newBlockInfo.difficulty, wallet.publicKey);
      blockchain.addBlock(block);
      expect(blockchain.getLastBlock().currentHash).toStrictEqual(
        block.currentHash
      );
      expect(blockchain.isBlockchainValid().getStatus()).toBeTruthy();
    }
  });

  test('Should add block', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.mine(newBlockInfo.difficulty, 'miner');
      blockchain.addBlock(block);
      expect(blockchain.getLastBlock().currentHash).toBe(block.currentHash);
    }
  });

  test('Should NOT add block not transaction avaliable', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const block = new Block();
    const res = blockchain.addBlock(block);
    expect(res.getMessage()).toBe(
      'There are not enough transactions to create a new block'
    );
  });

  test('Should NOT add block (previus hash)', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.previousHash = 'invalid';
      block.mine(newBlockInfo.difficulty, 'miner');
      blockchain.addBlock(block);
      expect(blockchain.getLastBlock()).not.toBe(block);
    }
  });

  test('Should increase the difficulty of the blockchain', () => {
    const blockchain = createNewBlockChain();
    const difficulty = blockchain.getDifficulty();

    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.mine(newBlockInfo.difficulty, 'miner');
      blockchain.addBlock(block);
    }
    const newBlockInfo2 = blockchain.getNewBlock();
    if (newBlockInfo2) {
      const block = Block.fromBlockInfo(newBlockInfo2);
      block.mine(newBlockInfo2.difficulty, 'miner');
      blockchain.addBlock(block);
    }
    const newBlockInfo3 = blockchain.getNewBlock();
    if (newBlockInfo3) {
      const block = Block.fromBlockInfo(newBlockInfo3);
      block.mine(newBlockInfo3.difficulty, 'miner');
      blockchain.addBlock(block);
    }
    const newBlockInfo4 = blockchain.getNewBlock();
    if (newBlockInfo4) {
      const block = Block.fromBlockInfo(newBlockInfo4);
      block.mine(newBlockInfo4.difficulty, 'miner');
      blockchain.addBlock(block);
    }
    const newBlockInfo5 = blockchain.getNewBlock();
    if (newBlockInfo5) {
      const block = Block.fromBlockInfo(newBlockInfo5);
      block.mine(newBlockInfo5.difficulty, 'miner');
      blockchain.addBlock(block);
    }
    expect(blockchain.getDifficulty()).toBe(difficulty + 1);
  });

  test('Should NOT add block (invalid nonce)', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.mine(newBlockInfo.difficulty, 'miner');
      block.nonce = -1;
      blockchain.addBlock(block);
      expect(blockchain.getLastBlock()).not.toBe(block);
    }
  });

  test('Should NOT add block (transaction not in mempool)', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      const newTransaction = new Transaction();
      newTransaction.type = TransactionType.REGULAR;
      newTransaction.txInputs = [new TransactionInput(validTxInput)];
      newTransaction.txOutputs = [new TransactionOutput(validTxOutput)];
      newTransaction.hash = newTransaction.getHash();
      newTransaction.txOutputs.forEach((txOutput) => {
        txOutput.txHash = newTransaction.hash;
      });
      block.transactions = [...block.transactions, newTransaction];
      block.mine(newBlockInfo.difficulty, 'miner');
      blockchain.addBlock(block);
      expect(blockchain.getLastBlock()).not.toBe(block);
    }
  });
  test('Should be invalid chain', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.mine(newBlockInfo.difficulty, 'miner');
      blockchain.addBlock(block);
      blockchain.blocks[1].currentHash = 'invalid';
      expect(blockchain.isBlockchainValid().getStatus()).toBeFalsy();
    }
  });

  test('Should get next block info', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      expect(newBlockInfo.index).toBe(1);
    }
  });

  test('Should NOT get next block (no transactions)', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const newBlockInfo = blockchain.getNewBlock();
    expect(newBlockInfo).toBeNull();
  });

  test('Should get transaction by hash (mempool)', () => {
    const blockchain = createNewBlockChain();
    const transaction = blockchain.getTransactionByHash(
      blockchain.mempool[0].hash
    );
    expect(transaction?.transaction).toBe(blockchain.mempool[0]);
  });
  test('Should get transaction by hash (block)', () => {
    const blockchain = createNewBlockChain();
    const newBlockInfo = blockchain.getNewBlock();
    if (newBlockInfo) {
      const block = Block.fromBlockInfo(newBlockInfo);
      block.mine(newBlockInfo.difficulty, 'miner');
      blockchain.addBlock(block);
      const transaction = blockchain.getTransactionByHash(
        blockchain.blocks[1].transactions[0].hash
      );
      expect(transaction?.transaction).toBe(
        blockchain.blocks[1].transactions[0]
      );
    }
  });

  test('Should NOT get Transaction', () => {
    const blockchain = createNewBlockChain();
    const transaction = blockchain.getTransactionByHash('invalid');
    expect(transaction).toBeUndefined();
  });
  test('Should add transaction', () => {
    const blockchain = new Blockchain(wallet.publicKey);

    const txInput = new TransactionInput();
    txInput.fromAddress = wallet.publicKey;
    txInput.amount = 10;
    txInput.previousTxHash = blockchain.blocks[0].transactions[0].hash;
    txInput.signTransaction(wallet.privateKey);

    const txOutput = new TransactionOutput();
    txOutput.toAddress = wallet2.publicKey;
    txOutput.amount = 10;

    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInput)];
    transaction.txOutputs = [new TransactionOutput(txOutput)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });

    const result = blockchain.addTransaction(transaction);

    const lastItem = blockchain.mempool[blockchain.mempool.length - 1];
    expect(result.getStatus()).toBeTruthy();
    expect(result.getMessage()).toBe(lastItem.getHash());
  });
  test('Should NOT add transaction (invalid)', () => {
    const blockchain = new Blockchain(wallet.publicKey);

    const txInput = new TransactionInput();
    txInput.fromAddress = wallet.publicKey;
    txInput.amount = 10;
    txInput.previousTxHash = blockchain.blocks[0].transactions[0].hash;
    txInput.signTransaction(wallet.privateKey);

    const txOutput = new TransactionOutput();
    txOutput.toAddress = wallet2.publicKey;
    txOutput.amount = 10;

    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInput)];
    transaction.txOutputs = [new TransactionOutput(txOutput)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });

    transaction.hash = 'invalid hash';

    const result = blockchain.addTransaction(transaction);

    expect(result.getStatus()).toBeFalsy();
  });
  test('Should NOT add transaction (exists in a mined block)', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const transaction = blockchain.blocks[0].transactions[0];
    const result = blockchain.addTransaction(transaction);
    expect(result.getStatus()).toBeFalsy();
  });

  test('Should NOT add transaction (pending transaction)', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const txInput = new TransactionInput();
    txInput.fromAddress = wallet.publicKey;
    txInput.amount = 10;
    txInput.previousTxHash = blockchain.blocks[0].transactions[0].hash;
    txInput.signTransaction(wallet.privateKey);

    const txOutput = new TransactionOutput();
    txOutput.toAddress = wallet2.publicKey;
    txOutput.amount = 10;

    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInput)];
    transaction.txOutputs = [new TransactionOutput(txOutput)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    blockchain.addTransaction(transaction);

    const result = blockchain.addTransaction(transaction);
    expect(result.getStatus()).toBeFalsy();
  });

  test('Should NOT add transaction (transaction input is not in the UTXO list)', () => {
    const blockchain = createNewBlockChain();
    const transaction = new Transaction();
    const validInputTx = new TransactionInput(invalidTxInput);
    validInputTx.amount = 1000000;
    validInputTx.signTransaction(wallet.privateKey);

    const validTxOutput = new TransactionOutput();
    validTxOutput.toAddress = wallet2.publicKey;
    validTxOutput.amount = 1000000;

    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [validInputTx];
    transaction.txOutputs = [validTxOutput];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    const result = blockchain.addTransaction(transaction);
    expect(result.getStatus()).toBeFalsy();
  });

  test('Should get UTXO', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const utxo = blockchain.getUTXO(wallet.publicKey);
    expect(utxo).toHaveLength(1);
  });
  test('Should get balance', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const txo = blockchain.blocks[0].transactions[0];
    const initalBalance = blockchain.getBalance(wallet.publicKey);

    const tx = new Transaction();
    tx.hash = 'tx';
    tx.txInputs = [
      new TransactionInput({
        amount: initalBalance,
        previousTxHash: txo.hash,
        fromAddress: wallet.publicKey,
        signature: 'signature',
      } as TransactionInput),
    ];
    tx.txOutputs = [
      new TransactionOutput({
        amount: 5,
        toAddress: wallet2.publicKey,
      } as TransactionOutput),
      new TransactionOutput({
        amount: initalBalance - 6,
        toAddress: wallet.publicKey,
      } as TransactionOutput),
    ];

    blockchain.blocks.push(
      new Block({
        transactions: [tx],
        index: 1,
      } as Block)
    );

    expect(blockchain.getBalance(wallet.publicKey)).toBe(initalBalance - 6);
  });

  test('Should get UTXO with TXI', () => {
    const blockchain = createNewBlockChain();
    const transaction = new Transaction();
    const validInputTx = new TransactionInput(invalidTxInput);
    validInputTx.amount = 1000000;
    validInputTx.signTransaction(wallet.privateKey);

    const validTxOutput = new TransactionOutput();
    validTxOutput.toAddress = wallet2.publicKey;
    validTxOutput.amount = 1000000;

    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [validInputTx];
    transaction.txOutputs = [validTxOutput];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    const result = blockchain.addTransaction(transaction);
    expect(result.getStatus()).toBeFalsy();
  });

  test('Should get UTXO', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const utxo = blockchain.getUTXO(wallet.publicKey);
    expect(utxo).toHaveLength(1);
  });

  test('Should get 0 blance', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const utxo = blockchain.getBalance(wallet2.publicKey);
    expect(utxo).toBe(0);
  });
  test('Should get balance', () => {
    const blockchain = new Blockchain(wallet.publicKey);
    const txo = blockchain.blocks[0].transactions[0];
    const initalBalance = blockchain.getBalance(wallet.publicKey);

    const tx = new Transaction();
    tx.hash = 'tx';
    tx.txInputs = [
      new TransactionInput({
        amount: initalBalance,
        previousTxHash: txo.hash,
        fromAddress: wallet.publicKey,
        signature: 'signature',
      } as TransactionInput),
    ];
    tx.txOutputs = [
      new TransactionOutput({
        amount: 5,
        toAddress: wallet2.publicKey,
      } as TransactionOutput),
      new TransactionOutput({
        amount: initalBalance - 6,
        toAddress: wallet.publicKey,
      } as TransactionOutput),
    ];

    blockchain.blocks.push(
      new Block({
        transactions: [tx],
        index: 1,
      } as Block)
    );

    expect(blockchain.getBalance(wallet.publicKey)).toBe(initalBalance - 6);
  });
});
