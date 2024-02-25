import { Router } from 'express';
import BlockchainConnection from '..';
import Transaction from '../../lib/transaction';
import Blockchain from '../../lib/blockchain';

const BlockChainRoutes = Router();

BlockChainRoutes.get('/status', (req, res) => {
  return res.json({
    mempool: BlockchainConnection.mempool.length,
    isBlockchainValid: BlockchainConnection.isBlockchainValid().getStatus(),
    blocks: BlockchainConnection.getBlocks().length,
    nextIndex: BlockchainConnection.getNextIndex(),
    lastBlock: BlockchainConnection.getLastBlock().currentHash,
  });
});

BlockChainRoutes.get('/transactions/:hash?', (req, res) => {
  if (req.params.hash) {
    const tx = BlockchainConnection.getTransactionByHash(req.params.hash);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    return res.json(tx);
  }

  return res.json({
    next: BlockchainConnection.mempool.slice(0, Blockchain.TX_PER_BLOCK),
    total: BlockchainConnection.mempool.length,
  });
});

BlockChainRoutes.post('/transactions', (req, res) => {
  const tx = new Transaction(req.body as Transaction);
  const validation = BlockchainConnection.addTransaction(tx);
  if (!validation.getStatus()) {
    return res.status(400).json({ error: validation.getMessage() });
  }
  return res.json(tx);
});

BlockChainRoutes.get('/wallet/:wallet', (req, res) => {
  const wallet = req.params.wallet;

  const utxo = BlockchainConnection.getUTXO(wallet);
  const balance = BlockchainConnection.getBalance(wallet);
  const fee = BlockchainConnection.getFeePerTx();

  return res.json({ utxo, balance, fee });
});

export default BlockChainRoutes;
