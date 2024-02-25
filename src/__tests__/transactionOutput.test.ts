import TransactionOutput from '../lib/transactionOutput';
import Wallet from '../lib/wallet';

describe('TransactionOutput tests', () => {
  const wallet = new Wallet();

  test('Should create transaction output', () => {
    const transactionOutput = new TransactionOutput();
    expect(transactionOutput).toBeInstanceOf(TransactionOutput);
  });

  test('Should create transaction output with prev data', () => {
    const transactionOutput = new TransactionOutput();

    const transactionOutput2 = new TransactionOutput(transactionOutput);
    expect(transactionOutput2.getHash()).toBe(transactionOutput.getHash());
  });
  test('Should validate transaction output', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = wallet.publicKey;
    transactionOutput.amount = 10;
    transactionOutput.txHash = 'some hash';
    expect(transactionOutput.isValid().getStatus()).toBeTruthy();
  });

  test('Should NOT validate transaction output by amount', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = wallet.publicKey;
    transactionOutput.amount = 0;
    transactionOutput.txHash = 'some hash';
    expect(transactionOutput.isValid().getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction output by toAddress', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = '';
    transactionOutput.amount = 10;
    transactionOutput.txHash = 'some hash';
    expect(transactionOutput.isValid().getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction output by txHash', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = wallet.publicKey;
    transactionOutput.amount = 10;
    transactionOutput.txHash = '';
    expect(transactionOutput.isValid().getStatus()).toBeFalsy();
  });

  test('Should get transaction output hash', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = wallet.publicKey;
    transactionOutput.amount = 10;
    transactionOutput.txHash = 'some hash';
    expect(transactionOutput.getHash()).toBeTruthy();
  });
});
