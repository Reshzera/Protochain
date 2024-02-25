import Wallet from '../lib/wallet';

describe('Wallet tests', () => {
  const exampleWIF = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';
  test('Should create wallet', () => {
    const wallet = new Wallet();
    expect(wallet).toBeInstanceOf(Wallet);
  });

  test('Should create wallet with private key', () => {
    const wallet = new Wallet();
    const wallet2 = new Wallet(wallet.privateKey);
    expect(wallet2).toBeInstanceOf(Wallet);
  });

  test('Should create wallet with WIF', () => {
    const wallet = new Wallet(exampleWIF);
    expect(wallet.privateKey).toBeTruthy();
    expect(wallet.publicKey).toBeTruthy();
  });
});
