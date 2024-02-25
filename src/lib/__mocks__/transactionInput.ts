import sha256 from 'crypto-js/sha256';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import Validation from '../validation';
import type TransactionOutput from './transactionOutput';

const ECPair = ECPairFactory(ecc);

/**
 * Class transactionInput
 */

export default class TransactionInput {
  fromAddress: string;
  amount: number;
  signature: string;
  previousTxHash: string;

  constructor(txInput?: TransactionInput) {
    this.fromAddress = txInput?.fromAddress ?? '';
    this.amount = txInput?.amount ?? 0;
    this.previousTxHash = txInput?.previousTxHash ?? '';
    this.signature = txInput?.signature ?? '';
  }

  signTransaction(privateKey: string): void {
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const hash = Buffer.from(this.getHash(), 'hex');
    this.signature = keyPair.sign(hash).toString('hex');
  }

  getHash(): string {
    return sha256(
      this.fromAddress + this.amount + this.previousTxHash
    ).toString();
  }

  isValid(): Validation {
    if (this.previousTxHash === '') {
      return new Validation('Invalid previousTxHash', false);
    }
    if (!this.signature || this.signature.length === 0) {
      return new Validation('Invalid signature', false);
    }
    if (this.amount <= 0) {
      return new Validation('Invalid amount', false);
    }

    const hash = Buffer.from(this.getHash(), 'hex');
    const fromAddress = Buffer.from(this.fromAddress, 'hex');
    const signature = Buffer.from(this.signature, 'hex');

    const isValid = ECPair.fromPublicKey(fromAddress).verify(hash, signature);

    if (!isValid) {
      return new Validation('Invalid signature', false);
    }

    return new Validation();
  }

  static fromTxo(txo: TransactionOutput): TransactionInput {
    const transaction = new TransactionInput();
    transaction.fromAddress = txo.toAddress;
    transaction.amount = txo.amount;
    transaction.previousTxHash = txo.txHash;
    return transaction;
  }
}
