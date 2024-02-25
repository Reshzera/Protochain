import Transaction from '../lib/transaction';
import TransactionInput from '../lib/transactionInput';
import TransactionOutput from '../lib/transactionOutput';
import { TransactionType } from '../lib/types/transactionTypes';
import Wallet from '../lib/wallet';

jest.mock('../lib/wallet');
jest.mock('../lib/transactionInput');
jest.mock('../lib/transactionOutput');

describe('Transaction tests', () => {
  const wallet = new Wallet();
  const wallet2 = new Wallet();

  const txInputValid = new TransactionInput();
  txInputValid.fromAddress = wallet.publicKey;
  txInputValid.amount = 10;
  txInputValid.previousTxHash = 'previousTxHash';
  txInputValid.signTransaction(wallet.privateKey);

  const txOutputValid = new TransactionOutput();
  txOutputValid.toAddress = wallet2.publicKey;
  txOutputValid.amount = 2;

  const txInputInvalid = new TransactionInput();
  txInputInvalid.fromAddress = wallet.publicKey;
  txInputInvalid.amount = 0;
  txInputInvalid.signTransaction(wallet2.privateKey);

  const txOutputInvalid = new TransactionOutput();
  txOutputInvalid.toAddress = wallet2.publicKey;
  txOutputInvalid.amount = 0;

  test('Should create transaction', () => {
    const transaction = new Transaction();
    expect(transaction).toBeInstanceOf(Transaction);
  });

  test('Should validate transaction', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.isValid(1).getStatus()).toBeTruthy();
  });

  test('Should NOT validate fee transaction (invalid amount)', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.FEE;
    const txOutput = new TransactionOutput(txOutputValid);
    txOutput.amount = 100000;
    transaction.txOutputs = [new TransactionOutput(txOutput)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.isValid(1).getMessage()).toBe('Invalid fee amount');
  });

  test('Should NOT validate transaction by hash', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.hash = 'invalid hash';
    expect(transaction.isValid(1).getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction none txOutputs', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.hash = transaction.getHash();
    expect(transaction.isValid(1).getStatus()).toBeFalsy();
  });

  test('Should NOT validate transaction TXO txhash different', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs[0].txHash = 'invalid hash';
    expect(transaction.isValid(1).getStatus()).toBeFalsy();
  });

  test('Should NOT validate (TXI)', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputInvalid)];
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.isValid(1).getStatus()).toBeFalsy();
  });

  test('Should NOT validate (TXO)', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txOutputs = [new TransactionOutput(txOutputInvalid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.isValid(1).getStatus()).toBeFalsy();
  });

  test('Should NOT validate input and output amount different ', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txInputs[0].amount = 5;
    transaction.txInputs[0].signTransaction(wallet.privateKey);
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.txOutputs[0].amount = 10;
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.isValid(1).getStatus()).toBeFalsy();
  });

  test('Should create transaction with data', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });

    const transaction2 = new Transaction(transaction);
    expect(transaction2).toStrictEqual(transaction);
  });

  test('Should create transaction with data no txInput', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });

    const transaction2 = new Transaction(transaction);
    expect(transaction2.txInputs).toBeUndefined();
    expect(transaction2.isValid(1)).toBeTruthy();
  });

  test('Should get transaction fee', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txInputs = [new TransactionInput(txInputValid)];
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.getFee()).toBe(
      txInputValid.amount - txOutputValid.amount
    );
  });

  test('Should get transaction fee no txInputs', () => {
    const transaction = new Transaction();
    transaction.type = TransactionType.REGULAR;
    transaction.txOutputs = [new TransactionOutput(txOutputValid)];
    transaction.hash = transaction.getHash();
    transaction.txOutputs.forEach((txOutput) => {
      txOutput.txHash = transaction.hash;
    });
    expect(transaction.getFee()).toBe(0);
  });

  test('Should get from reward ', () => {
    const transactionOutput = new TransactionOutput();
    transactionOutput.toAddress = wallet.publicKey;
    transactionOutput.amount = 10;
    transactionOutput.txHash = 'txHash';

    const transaction = Transaction.fromReward(transactionOutput);
    expect(transaction.txOutputs).toStrictEqual([transactionOutput]);
  });
});
