import sha256 from 'crypto-js/sha256';
import { TransactionType } from './types/transactionTypes';
import Validation from './validation';
import TransactionInput from './transactionInput';
import TransactionOutput from './transactionOutput';
import Blockchain from './blockchain';

/**
 * Transaction class
 */
export default class Transaction {
  type: TransactionType;
  timestamp: number;
  hash: string;
  txOutputs: TransactionOutput[];
  txInputs: TransactionInput[] | undefined;

  constructor(tx?: Transaction) {
    this.type = tx?.type ?? TransactionType.REGULAR;
    this.timestamp = tx?.timestamp ?? Date.now();
    this.txInputs = tx?.txInputs
      ? tx.txInputs.map((txinput) => new TransactionInput(txinput))
      : undefined;
    this.txOutputs = tx?.txOutputs
      ? tx.txOutputs.map((txoutput) => new TransactionOutput(txoutput))
      : [];
    this.hash = tx?.hash ?? this.getHash();

    this.txOutputs.forEach((txOutput) => {
      txOutput.txHash = this.hash;
    });
  }

  getHash(): string {
    const from = this.txInputs
      ? this.txInputs.map((txInput) => txInput.signature).join('')
      : '';
    const to = this.txOutputs.map((txOutput) => txOutput.getHash()).join('');

    return sha256(this.type + this.timestamp + from + to).toString();
  }

  getFee(): number {
    let inputAmount = 0;
    let outputAmount = 0;

    if (this.txInputs?.length) {
      inputAmount = this.txInputs.reduce(
        (acc, txInput) => acc + txInput.amount,
        0
      );
      if (this.txOutputs.length) {
        outputAmount = this.txOutputs.reduce(
          (acc, txOutput) => acc + txOutput.amount,
          0
        );
      }
      return inputAmount - outputAmount;
    }
    return 0;
  }

  isValid(totalFees: number): Validation {
    if (this.hash !== this.getHash()) {
      return new Validation('Invalid hash', false);
    }
    if (!this.txOutputs.length || !this.txOutputs) {
      return new Validation('Invalid TXO: No outputs', false);
    }

    if (this.txOutputs.some((txOutput) => !txOutput.isValid().getStatus())) {
      const invalidOutputs = this.txOutputs.filter(
        (txOutput) => !txOutput.isValid().getStatus()
      );
      const message = invalidOutputs
        .map((output) => output.isValid().getMessage())
        .join(', ');

      return new Validation(`Invalid TXO: ${message}`, false);
    }

    if (this.txInputs?.length) {
      if (this.txInputs.some((txInput) => !txInput.isValid().getStatus())) {
        const invalidInputs = this.txInputs.filter(
          (txInput) => !txInput.isValid().getStatus()
        );
        const message = invalidInputs
          .map((input) => input.isValid().getMessage())
          .join(', ');

        return new Validation(`Invalid TXI: ${message}`, false);
      }

      const inputAmount = this.txInputs.reduce(
        (acc, txInput) => acc + txInput.amount,
        0
      );
      const outputAmount = this.txOutputs.reduce(
        (acc, txOutput) => acc + txOutput.amount,
        0
      );

      if (inputAmount < outputAmount) {
        return new Validation(
          'Invalid transaction: input amount is less than output amount',
          false
        );
      }
    }

    if (this.txOutputs.some((txOutput) => txOutput.txHash !== this.hash)) {
      return new Validation('Invalid TXO reference hash', false);
    }

    if (this.type === TransactionType.FEE && this.txOutputs.length) {
      const txo = this.txOutputs[0];
      if (txo.amount > Blockchain.getRewardAmount() + totalFees) {
        return new Validation('Invalid fee amount', false);
      }
    }

    return new Validation();
  }

  static fromReward(txo: TransactionOutput): Transaction {
    const tx = new Transaction();
    tx.type = TransactionType.FEE;
    tx.txOutputs = [txo];

    tx.hash = tx.getHash();
    tx.txOutputs.forEach((txOutput) => {
      txOutput.txHash = tx.hash;
    });

    return tx;
  }
}
