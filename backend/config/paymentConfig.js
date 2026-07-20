module.exports = {
  provider: process.env.PAYMENT_PROVIDER || 'dummy',
  apiKey: process.env.PAYMENT_API_KEY || 'dummy_key_123',
  apiSecret: process.env.PAYMENT_API_SECRET || 'dummy_secret_456',
  dummyAmount: Number(process.env.PAYMENT_DUMMY_AMOUNT) || 1
};
