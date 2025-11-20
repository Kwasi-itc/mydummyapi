import express from 'express';
import {
  getPayments,
  getPaymentById,
  addPayment,
  updatePayment,
  getAccountById
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate a payment/payout
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - beneficiary
 *               - beneficiaryAccount
 *               - amount
 *               - currency
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: acc-001
 *               beneficiary:
 *                 type: string
 *                 example: John Doe
 *               beneficiaryAccount:
 *                 type: string
 *                 example: 9876543210
 *               amount:
 *                 type: number
 *                 example: 200.00
 *               currency:
 *                 type: string
 *                 example: GHS
 *               method:
 *                 type: string
 *                 example: bank_transfer
 *               reference:
 *                 type: string
 *                 example: PAY-REF-001
 *     responses:
 *       201:
 *         description: Payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Missing required fields or invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/initiate', (req, res) => {
  const { accountId, beneficiary, beneficiaryAccount, amount, currency, method, reference } = req.body;

  if (!accountId || !beneficiary || !beneficiaryAccount || !amount || !currency) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: accountId, beneficiary, beneficiaryAccount, amount, currency',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount must be greater than 0',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const account = getAccountById(accountId);
  if (!account) {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const payment = addPayment({
    accountId,
    beneficiary,
    beneficiaryAccount,
    amount,
    currency,
    method: method || 'bank_transfer',
    reference,
    kycComplete: true, // Simulated
    sufficientBalance: account.balance >= amount
  });

  res.status(201).json({
    status: 'success',
    data: payment,
    message: 'Payment initiated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /payments/{paymentId}:
 *   get:
 *     summary: Get payment details by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:paymentId', (req, res) => {
  const payment = getPaymentById(req.params.paymentId);
  
  if (!payment) {
    return res.status(404).json({
      status: 'error',
      message: 'Payment not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: payment,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /payments/{paymentId}/cancel:
 *   post:
 *     summary: Cancel a pending payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment cancelled
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Cannot cancel completed payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:paymentId/cancel', (req, res) => {
  const payment = getPaymentById(req.params.paymentId);

  if (!payment) {
    return res.status(404).json({
      status: 'error',
      message: 'Payment not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (payment.status === 'completed') {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot cancel a completed payment',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const updatedPayment = updatePayment(req.params.paymentId, { status: 'cancelled' });

  res.json({
    status: 'success',
    data: updatedPayment,
    message: 'Payment cancelled',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /payments/{paymentId}/check-ready:
 *   get:
 *     summary: Checker endpoint - Verify if payment is ready to process
 *     description: Returns true/false indicating if the payment is ready to process (KYC complete, sufficient balance, pending status). Used for workflow conditional logic.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/:paymentId/check-ready', (req, res) => {
  const payment = getPaymentById(req.params.paymentId);

  if (!payment) {
    return res.json({
      result: false,
      reason: 'Payment not found',
      metadata: { paymentId: req.params.paymentId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isReady = payment.kycComplete && payment.sufficientBalance && payment.status === 'pending';
  const reasons = [];
  
  if (!payment.kycComplete) reasons.push('KYC not complete');
  if (!payment.sufficientBalance) reasons.push('Insufficient balance');
  if (payment.status !== 'pending') reasons.push(`Payment status is ${payment.status}`);

  res.json({
    result: isReady,
    reason: isReady ? 'Payment is ready to process' : reasons.join(', '),
    metadata: {
      paymentId: payment.id,
      status: payment.status,
      kycComplete: payment.kycComplete,
      sufficientBalance: payment.sufficientBalance,
      amount: payment.amount,
      currency: payment.currency
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
