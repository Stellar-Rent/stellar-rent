import { StellarSocialSDK } from './dist/index.esm.js';

async function testSDK() {
  console.log('🚀 Testing Stellar Social SDK...');
  
  const sdk = new StellarSocialSDK({
    contractId: 'CALZGCSB3P3WEBLW3QTF5Y4WEALEVTYUYBC7KBGQ266GDINT7U4E74KW',
    network: 'testnet'
  });

  await sdk.initialize();

  try {
    console.log('\n📧 Testing Google authentication...');
    const googleResult = await sdk.authenticateWithGoogle();
    
    if (googleResult.success && googleResult.account) {
      console.log('✅ Google auth successful!');
      console.log('Address:', googleResult.account.publicKey);
      
      // Test balance
      const balances = await googleResult.account.getBalance();
      console.log('💰 Balances:', balances);
      
      console.log('\n📱 Testing add auth method...');
      await googleResult.account.addAuthMethod({
        type: 'phone',
        identifier: '+1234567890',
        metadata: { verified: true }
      });
      
      console.log('Auth methods:', googleResult.account.authMethods.length);
    }

    console.log('\n🔵 Testing Facebook authentication...');
    const fbResult = await sdk.authenticateWithFacebook();
    console.log('Facebook result:', fbResult.success ? 'SUCCESS' : 'FAILED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSDK().catch(console.error);
