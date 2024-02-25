import request from 'supertest';
import { app } from '../server';
import { TransactionType } from '../lib/types/transactionTypes';
import TransactionInput from '../lib/transactionInput';
import Transaction from '../lib/transaction';
import Wallet from '../lib/wallet';
import TransactionOutput from '../lib/transactionOutput';

jest.mock('../lib/block');
jest.mock('../lib/transaction');
jest.mock('../lib/blockchain');
jest.mock('../lib/transactionInput');
jest.mock('../lib/wallet');
jest.mock('../lib/transactionOutput');

describe('Blockchain routes tests', () => {
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

  test('Should get blockchain status', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
  });

  test('Should add transactions', async () => {
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

    const response = await request(app).post('/transactions').send(tx);
    expect(response.status).toBe(200);
  });
  test('Should not add transactions', async () => {
    const response = await request(app).post('/transactions').send({
      type: TransactionType.REGULAR,
    });
    expect(response.status).toBe(400);
  });

  test('Should get transactions by hash', async () => {
    const response = await request(app).get('/blocks/next');
    const transaction = response.body.transactions[0];
    const response2 = await request(app).get(
      `/transactions/${transaction.hash}`
    );
    expect(response2.status).toBe(200);
  });

  test('Should not get transactions by hash', async () => {
    const response = await request(app).get('/transactions/invalid');
    expect(response.status).toBe(404);
  });

  test('Should get transactions list', async () => {
    const response = await request(app).get('/transactions');
    expect(response.status).toBe(200);
  });

  test('Should get wallet balance', async () => {
    const wallet = new Wallet();
    const response = await request(app).get(`/wallet/${wallet.publicKey}`);
    expect(response.status).toBe(200);
  });
});
