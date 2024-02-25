import request from 'supertest';
import { app } from '../server';
import { type BlockInfo } from '../lib/types/blockInfo';
import Block from '../lib/block';
import { TransactionType } from '../lib/types/transactionTypes';
import TransactionInput from '../lib/transactionInput';
import Wallet from '../lib/wallet';
import Transaction from '../lib/transaction';
import TransactionOutput from '../lib/transactionOutput';

jest.mock('../lib/block');
jest.mock('../lib/transaction');
jest.mock('../lib/blockchain');
jest.mock('../lib/transactionInput');
jest.mock('../lib/wallet');
jest.mock('../lib/transactionOutput');

describe('Block routes tests', () => {
  beforeAll(async () => {
    for (let i = 0; i < 10; i++) {
      const wallet = new Wallet();
      const txInput = new TransactionInput();
      txInput.fromAddress = wallet.publicKey;
      txInput.amount = 10;
      txInput.previousTxHash = 'some hash';
      txInput.signTransaction(wallet.privateKey);

      const txOutput = new TransactionOutput();
      txOutput.toAddress = wallet.publicKey;
      txOutput.amount = 10;
      txOutput.txHash = 'some hash';

      const tx = new Transaction();
      tx.type = TransactionType.REGULAR;
      tx.txInputs = [new TransactionInput(txInput)];
      tx.txOutputs = [new TransactionOutput(txOutput)];
      tx.hash = tx.getHash();
      tx.txOutputs.forEach((txOutput) => {
        txOutput.txHash = tx.hash;
      });

      await request(app).post('/transactions').send(tx);
    }
  });

  test('Should find block by hash', async () => {
    const blockchainStatusResponse = await request(app).get('/status');
    const lastBlockHash = blockchainStatusResponse.body.lastBlock;
    const response = await request(app).get(`/blocks/${lastBlockHash}`);
    expect(response.status).toBe(200);
    expect(response.body.currentHash).toBe(lastBlockHash);
  });

  test('Should NOT find block by hash', async () => {
    const response = await request(app).get('/blocks/invalid');
    expect(response.status).toBe(404);
  });

  test('Should find block by index', async () => {
    const blockchainStatusResponse = await request(app).get('/status');
    const currentBlockIndex = blockchainStatusResponse.body.nextIndex - 1;
    const response = await request(app).get(`/blocks/${currentBlockIndex}`);
    expect(response.status).toBe(200);
    expect(response.body.index).toBe(currentBlockIndex);
  });

  test('Should NOT find block by index', async () => {
    const response = await request(app).get('/blocks/999999');
    expect(response.status).toBe(404);
  });
  test('Should get next block', async () => {
    const response = await request(app).get('/blocks/next');
    expect(response.status).toBe(200);
    expect(response.body.index).toBeGreaterThanOrEqual(1);
  });
  test('Should add block', async () => {
    const responseNextBlock = await request(app).get('/blocks/next');
    const BlockInfos = responseNextBlock.body as BlockInfo;
    const newBlock = Block.fromBlockInfo(BlockInfos);
    newBlock.mine(BlockInfos.difficulty, 'minerAddress');

    const response = await request(app).post('/blocks').send(newBlock);
    expect(response.status).toBe(200);
  });

  test('Should NOT add block', async () => {
    const responseNextBlock = await request(app).get('/blocks/next');
    const BlockInfos = responseNextBlock.body as BlockInfo;
    const newBlock = Block.fromBlockInfo(BlockInfos);
    newBlock.mine(BlockInfos.difficulty, 'minerAddress');
    newBlock.currentHash = 'invalid hash';

    const response = await request(app).post('/blocks').send(newBlock);
    expect(response.status).toBe(400);
  });
});
