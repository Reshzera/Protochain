import TransactionInput from '../lib/transactionInput';
import TransactionOutput from '../lib/transactionOutput';
import Wallet from '../lib/wallet';

jest.mock('../lib/wallet');
jest.mock('../lib/transactionOutput');

describe('TransactionInput tests', () => {
  let wallet: Wallet;
  let wallet2: Wallet;
  beforeAll(() => {
    wallet = new Wallet();
    wallet2 = new Wallet();
  });

  test('Should create transaction input', () => {
    const transactionInput = new TransactionInput();
    expect(transactionInput).toBeInstanceOf(TransactionInput);
  });

  test('Should validate transaction input', () => {
    const transactionInput = new TransactionInput();
    transactionInput.fromAddress = wallet.publicKey;
    transactionInput.amount = 10;
    transactionInput.previousTxHash = 'some hash';
    transactionInput.signTransaction(wallet.privateKey);
    expect(transactionInput.isValid().getStatus()).toBeTruthy();
  });

  test('Should NOT validate transaction input by hash', () => {
    const transactionInput = new TransactionInput();
    transactionInput.fromAddress = wallet.publicKey;
    transactionInput.amount = 10;
    transactionInput.previousTxHash = 'some hash';
    transactionInput.signTransaction(wallet2.privateKey);
    expect(transactionInput.isValid().getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction input by amount', () => {
    const transactionInput = new TransactionInput();
    transactionInput.fromAddress = wallet.publicKey;
    transactionInput.amount = 0;
    transactionInput.previousTxHash = 'some hash';
    transactionInput.signTransaction(wallet.privateKey);
    expect(transactionInput.isValid().getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction by previousTxHas', () => {
    const transactionInput = new TransactionInput();
    transactionInput.fromAddress = wallet.publicKey;
    transactionInput.amount = 10;
    transactionInput.previousTxHash = '';
    transactionInput.signTransaction(wallet.privateKey);
    expect(transactionInput.isValid().getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction by not sign', () => {
    const transactionInput = new TransactionInput();
    transactionInput.fromAddress = wallet.publicKey;
    transactionInput.amount = 10;
    transactionInput.previousTxHash = 'some hash';
    expect(transactionInput.isValid().getStatus()).toBeFalsy();
  });

  test('Should create transaction input with data', () => {
    const transactionInput = new TransactionInput();
    transactionInput.fromAddress = wallet.publicKey;
    transactionInput.amount = 10;
    transactionInput.previousTxHash = 'some hash';
    transactionInput.signTransaction(wallet.privateKey);

    const transactionInput2 = new TransactionInput(transactionInput);
    expect(transactionInput2.fromAddress).toBe(wallet.publicKey);
  });

  test('Should create transaction input from txo', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = wallet.publicKey;
    transactionOutput.amount = 10;
    const transactionInput = TransactionInput.fromTxo(transactionOutput);

    expect(transactionInput.fromAddress).toBe(transactionOutput.toAddress);
  });
});
