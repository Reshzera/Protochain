import { Router } from 'express';
import BlockchainConnection from '..';
import Block from '../../lib/block';

const BlockRoutes = Router();

BlockRoutes.get('/next', (req, res) => {
  return res.json(BlockchainConnection.getNewBlock());
});

BlockRoutes.get('/:indexOrHash', (req, res) => {
  const { indexOrHash } = req.params;
  let chosenBlock;
  const isParamsNumber = indexOrHash.match(/^\d+$/);
  const blocks = BlockchainConnection.getBlocks();

  if (isParamsNumber) {
    chosenBlock = blocks.find((block) => block.index === parseInt(indexOrHash));
  }
  if (!isParamsNumber) {
    chosenBlock = blocks.find((block) => block.currentHash === indexOrHash);
  }
  if (!chosenBlock) {
    return res.status(404).json({ error: 'Block not found' });
  }
  return res.json(chosenBlock);
});

BlockRoutes.post('/', (req, res) => {
  const newBlock = new Block(req.body as Block);

  const validation = BlockchainConnection.addBlock(newBlock);

  if (!validation.getStatus()) {
    return res.status(400).json({ error: validation.getMessage() });
  }
  return res.json(newBlock);
});

export default BlockRoutes;
