import type Transaction from '../transaction';

export interface TransactionSearch {
  transaction: Transaction;
  mempoolIndex: number | undefined;
  blockIndex: number | undefined;
}
