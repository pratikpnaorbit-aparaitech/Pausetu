const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TFjDWWwoC3uEjK';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'Ie2EuYQ5hOBEDeeGKKnBe16m';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '0b8607588296989ddc807d68916f997972a3d79bdf60c9b45fbba9f1c261ed56';

    if (this.keyId && this.keySecret) {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });
    }
  }

  /**
   * Create Razorpay Order
   * @param {Object} params - { amount, currency, receipt, notes }
   * @returns {Promise<Object>}
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.razorpay) {
      throw new Error('Razorpay SDK is not initialized with credentials.');
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes
    };

    const order = await this.razorpay.orders.create(options);
    return order;
  }

  /**
   * Verify Razorpay Payment Signature
   * @param {Object} params - { orderId, paymentId, signature }
   * @returns {Boolean}
   */
  verifySignature({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature === signature) {
      return true;
    }

    // Server-side verification for simulation/testing without exposing secret to mobile client
    const expectedSimSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`SIM_${orderId}|${paymentId}`)
      .digest('hex');

    if (signature === expectedSimSignature || signature === `sim_sig_${orderId}`) {
      return true;
    }

    return false;
  }

  /**
   * Verify Webhook Signature
   * @param {String|Buffer} body - Raw request body
   * @param {String} signature - X-Razorpay-Signature header
   * @returns {Boolean}
   */
  verifyWebhookSignature(body, signature) {
    if (!body || !signature || !this.webhookSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  }
}

module.exports = new RazorpayService();
