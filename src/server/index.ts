import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import Blockchain from '../lib/blockchain';
import BlockRoutes from './routes/block.routes';
import BlockChainRoutes from './routes/blockchain.routes';
import Wallet from '../lib/wallet';
dotenv.config();

const PORT: number = parseInt(`${process.env.PORT}`);

const wallet = new Wallet(process.env.BLOCKCHAIN_WALLET);

export const BlockchainConnection = new Blockchain(wallet.publicKey);

const app = express();
app.use(express.json());
if (process.argv.includes('--run')) {
  app.use(morgan('tiny'));
}
app.use('/blocks', BlockRoutes);
app.use('/', BlockChainRoutes);

if (process.argv.includes('--run')) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${PORT}`);
  });
}

export default BlockchainConnection;
export { app };
