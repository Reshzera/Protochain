import Validation from './validation';
import sha256 from 'crypto-js/sha256';

export default class TransactionOutput {
  public toAddress: string;
  public amount: number;
  public txHash: string;

  constructor(txOutput?: TransactionOutput) {
    this.toAddress = txOutput?.toAddress ?? '';
    this.amount = txOutput?.amount ?? 0;
    this.txHash = txOutput?.txHash ?? '';
  }

  isValid(): Validation {
    if (this.toAddress === '') {
      return new Validation(
        'Invalid transaction output: toAddress must be a valid public key',
        false
      );
    }
    if (this.txHash === '') {
      return new Validation(
        'Invalid transaction output: txHash must be a valid hash',
        false
      );
    }

    if (this.amount <= 0) {
      return new Validation(
        'Invalid transaction output: amount must be greater than 0',
        false
      );
    }
    return new Validation();
  }

  getHash(): string {
    return sha256(this.toAddress + this.amount).toString();
  }
}
