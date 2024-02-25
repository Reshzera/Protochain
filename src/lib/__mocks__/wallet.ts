import * as ecc from 'tiny-secp256k1';
import ECPairFactory, { type ECPairInterface } from 'ecpair';

const ECPair = ECPairFactory(ecc);

/**
 * Wallet class
 */

export default class Wallet {
  privateKey: string;
  publicKey: string;

  constructor(wifOrPrivateKey?: string) {
    if (wifOrPrivateKey) {
      if (wifOrPrivateKey.length === 64) {
        const keyPair: ECPairInterface = ECPair.fromPrivateKey(
          Buffer.from(wifOrPrivateKey, 'hex')
        );
        this.privateKey = wifOrPrivateKey;
        this.publicKey = keyPair.publicKey.toString('hex');
        return;
      }

      const keyPair: ECPairInterface = ECPair.fromWIF(wifOrPrivateKey);
      this.privateKey = keyPair.privateKey?.toString('hex') ?? '';
      this.publicKey = keyPair.publicKey.toString('hex');
      return;
    }

    const keyPair: ECPairInterface = ECPair.makeRandom();
    this.privateKey = keyPair.privateKey?.toString('hex') ?? '';
    this.publicKey = keyPair.publicKey.toString('hex');
  }
}
