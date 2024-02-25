import Block from '../lib/block';
import Transaction from '../lib/transaction';
import TransactionInput from '../lib/transactionInput';
import TransactionOutput from '../lib/transactionOutput';
import { type BlockInfo } from '../lib/types/blockInfo';
import { TransactionType } from '../lib/types/transactionTypes';
import Wallet from '../lib/wallet';

jest.mock('../lib/transaction');
jest.mock('../lib/wallet');
jest.mock('../lib/transactionInput');
jest.mock('../lib/transactionOutput');

describe('Block tests', () => {
  const exampleDifficulty = 2;
  const wallet = new Wallet();
  const wallet2 = new Wallet();
  // valid transaction input
  const validTxInput = new TransactionInput();
  validTxInput.fromAddress = wallet.publicKey;
  validTxInput.amount = 10;
  validTxInput.previousTxHash = 'some hash';
  validTxInput.signTransaction(wallet.privateKey);
  // invalid transaction input
  const invalidTxInput = new TransactionInput();
  invalidTxInput.fromAddress = wallet.publicKey;
  invalidTxInput.amount = 0;
  invalidTxInput.previousTxHash = 'some hash';
  invalidTxInput.signTransaction(wallet.privateKey);

  const validTxOutput = new TransactionOutput();
  validTxOutput.toAddress = wallet2.publicKey;
  validTxOutput.amount = 10;

  // valid transaction
  const validTransaction = new Transaction();
  validTransaction.type = TransactionType.REGULAR;
  validTransaction.txInputs = [new TransactionInput(validTxInput)];
  validTransaction.txOutputs = [new TransactionOutput(validTxOutput)];
  validTransaction.hash = validTransaction.getHash();
  validTransaction.txOutputs.forEach((txOutput) => {
    txOutput.txHash = validTransaction.hash;
  });
  // invalid transaction
  const invalidTransaction = new Transaction();
  invalidTransaction.type = TransactionType.REGULAR;
  invalidTransaction.txInputs = [new TransactionInput(invalidTxInput)];
  invalidTransaction.txOutputs = [new TransactionOutput(validTxOutput)];
  invalidTransaction.txOutputs.forEach((txOutput) => {
    txOutput.txHash = invalidTransaction.hash;
  });
  invalidTransaction.hash = 'invalid hash';
  // genesis transaction
  const genesisTransaction = new Transaction();
  genesisTransaction.type = TransactionType.FEE;
  genesisTransaction.txOutputs = [new TransactionOutput(validTxOutput)];
  genesisTransaction.hash = genesisTransaction.getHash();
  genesisTransaction.txOutputs.forEach((txOutput) => {
    txOutput.txHash = genesisTransaction.hash;
  });
  // genesis block
  const genesisBlock = new Block();
  genesisBlock.transactions = [genesisTransaction];
  genesisBlock.mine(exampleDifficulty, 'miner');

  test('Should create block', () => {
    const block = new Block();
    expect(block).toBeInstanceOf(Block);
  });

  test('Should validate block', () => {
    const block2 = new Block();
    block2.previousHash = genesisBlock.currentHash;
    block2.index = 1;
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, wallet2.publicKey);

    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeTruthy();
  });

  test('Should NOT validate block by previus hash', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = 'invalid';
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, 'miner');

    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by index', () => {
    const block2 = new Block();
    block2.previousHash = genesisBlock.currentHash;
    block2.index = 0;
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, 'miner');

    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by change the hash', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = genesisBlock.currentHash;
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, 'miner');
    block2.currentHash = 'invalid';

    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by invalid nonce', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = genesisBlock.currentHash;
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, 'miner');
    block2.nonce = -1;
    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by invalid miner', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = genesisBlock.currentHash;
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, 'miner');
    block2.miner = '';
    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by invalid Difficulty', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = genesisBlock.currentHash;
    block2.transactions = [validTransaction];
    block2.mine(exampleDifficulty, 'miner');

    expect(block2.isValid(genesisBlock, 100, 1).getStatus()).toBeFalsy();
  });

  test('Should NOT validate block by invalid fee transaction numbers', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = genesisBlock.currentHash;
    block2.transactions = [genesisTransaction, genesisTransaction];
    block2.mine(exampleDifficulty, 'miner');

    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by invalid transactions', () => {
    const block2 = new Block();
    block2.index = 1;
    block2.previousHash = genesisBlock.currentHash;
    block2.transactions = [validTransaction, invalidTransaction];
    block2.mine(exampleDifficulty, 'miner');

    expect(
      block2.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should NOT validate block by FEE and miner ', () => {
    const block = new Block();
    block.transactions = [genesisTransaction];
    block.mine(exampleDifficulty, 'miner');

    expect(
      block.isValid(genesisBlock, exampleDifficulty, 1).getStatus()
    ).toBeFalsy();
  });

  test('Should create block from BlockInfo', () => {
    const genesisTransaction = new Transaction();
    genesisTransaction.type = TransactionType.FEE;
    genesisTransaction.txInputs = [new TransactionInput(validTxInput)];
    genesisTransaction.txOutputs = [new TransactionOutput(validTxOutput)];
    genesisTransaction.hash = genesisTransaction.getHash();

    const BlockInfo: BlockInfo = {
      transactions: [genesisTransaction],
      index: 0,
      previousHash: 'preiousHash',
      difficulty: 2,
      feePerTx: 1,
      maxDifficulty: 10,
    };
    const block = Block.fromBlockInfo(BlockInfo);
    expect(block.previousHash).toBe(BlockInfo.previousHash);
  });

  test('Should create a block from another block', () => {
    const block = new Block();
    block.transactions = [validTransaction];
    block.mine(exampleDifficulty, 'miner');
    const newBlock = new Block(block);
    expect(newBlock.currentHash).toBe(block.currentHash);
  });
});
