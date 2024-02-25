/**
 * Information about a block to be generated
 */

import type Transaction from '../transaction';

export interface BlockInfo {
  index: number;
  previousHash: string;
  difficulty: number;
  maxDifficulty: number;
  feePerTx: number;
  transactions: Transaction[];
}
