import express from 'express';
import {
  getPayments,
  getPaymentById,
  addPayment,
  updatePayment,
  getAccountById
} from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

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
 *               - customerId
 *               - beneficiary
 *               - beneficiaryAccount
 *               - amount
 *               - currency
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: The unique identifier of the source account
 *                 example: acc-001
 *               customerId:
 *                 type: string
 *                 description: The unique identifier of the customer
 *                 example: cust-001
 *               beneficiary:
 *                 type: string
 *                 description: Name of the payment beneficiary
 *                 example: John Doe
 *               beneficiaryAccount:
 *                 type: string
 *                 description: Account number or identifier of the beneficiary
 *                 example: 9876543210
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount (must be greater than 0.01)
 *                 example: 200.00
 *               currency:
 *                 type: string
 *                 enum: [GHS, USD, EUR, NGN]
 *                 description: Currency code for the payment
 *                 example: GHS
 *               method:
 *                 type: string
 *                 enum: [bank_transfer, mobile_money, card]
 *                 description: Payment method - defaults to bank_transfer
 *                 example: bank_transfer
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
 *         description: Missing required fields or invalid amount/currency
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
  const { accountId, customerId, beneficiary, beneficiaryAccount, amount, currency, method } = req.body;

  // Validate required fields
  const requiredFields = {
    accountId,
    customerId,
    beneficiary,
    beneficiaryAccount,
    amount,
    currency
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0.01) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount must be a number greater than or equal to 0.01',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate currency enum
  const validCurrencies = ['GHS', 'USD', 'EUR', 'NGN'];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate method if provided
  if (method) {
    const validMethods = ['bank_transfer', 'mobile_money', 'card'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid method. Must be one of: ${validMethods.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
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
    customerId,
    beneficiary,
    beneficiaryAccount,
    amount,
    currency,
    method: method || 'bank_transfer',
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
 * /payments/get:
 *   post:
 *     summary: Get payment details by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: result
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Simulation value to return (true/false as string).
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
router.post('/get', (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: paymentId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const payment = getPaymentById(paymentId);
  
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
 * /payments/cancel:
 *   post:
 *     summary: Cancel a pending payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: pay-001
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
router.post('/cancel', (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: paymentId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const payment = getPaymentById(paymentId);

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

  const updatedPayment = updatePayment(paymentId, { status: 'cancelled' });

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
 * /payments/check-ready:
 *   get:
 *     summary: Checker endpoint - Verify if payment is ready to process
 *     description: Returns true/false indicating if the payment is ready to process (KYC complete, sufficient balance, pending status). Used for workflow conditional logic.
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: result
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Optional. Set to true/false (as string) to force the checker response. Defaults to false if not provided.
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/check-ready', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    value: finalResult,
    message: finalResult
      ? 'Payment is ready to process'
      : 'Payment is NOT ready to process',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /payments/bills:
 *   post:
 *     summary: Pay utility bills (electricity, water, internet)
 *     description: Process bill payments for utilities like electricity, water, and internet services
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - customerId
 *               - biller
 *               - accountNumber
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: The unique identifier of the source account
 *                 example: acc-001
 *               customerId:
 *                 type: string
 *                 description: The unique identifier of the customer
 *                 example: cust-001
 *               biller:
 *                 type: string
 *                 enum: [ECG, NEDCo, GWCL, MTN, Vodafone, AirtelTigo]
 *                 description: Ghana utility biller (ECG/NEDCo for electricity, GWCL for water, MTN/Vodafone/AirtelTigo for internet)
 *                 example: ECG
 *               accountNumber:
 *                 type: string
 *                 description: Customer's account number with the biller
 *                 example: ECG-123456789
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount (must be greater than 0.01)
 *                 example: 150.00
 *               currency:
 *                 type: string
 *                 enum: [GHS, USD, EUR, NGN]
 *                 default: GHS
 *                 description: Currency code for the payment
 *                 example: GHS
 *     responses:
 *       201:
 *         description: Bill payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         paymentId:
 *                           type: string
 *                         biller:
 *                           type: string
 *                         accountNumber:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         status:
 *                           type: string
 *       400:
 *         description: Missing required fields or invalid values
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
router.post('/bills', (req, res) => {
  const { accountId, customerId, biller, accountNumber, amount, currency = 'GHS' } = req.body;

  // Validate required fields
  const requiredFields = {
    accountId,
    customerId,
    biller,
    accountNumber,
    amount
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0.01) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount must be a number greater than or equal to 0.01',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate biller enum (Ghana-specific utility companies)
  const validBillers = ['ECG', 'NEDCo', 'GWCL', 'MTN', 'Vodafone', 'AirtelTigo'];
  if (!validBillers.includes(biller)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid biller. Must be one of: ${validBillers.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate currency enum
  const validCurrencies = ['GHS', 'USD', 'EUR', 'NGN'];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Verify account exists
  const account = getAccountById(accountId);
  if (!account) {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Check sufficient balance
  if (account.balance < amount) {
    return res.status(400).json({
      status: 'error',
      message: 'Insufficient account balance',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Create bill payment
  const payment = addPayment({
    accountId,
    customerId,
    beneficiary: biller,
    beneficiaryAccount: accountNumber,
    amount,
    currency,
    method: 'bill_payment',
    status: 'completed',
    kycComplete: true,
    sufficientBalance: account.balance >= amount
  });

  res.status(201).json({
    status: 'success',
    data: {
      paymentId: payment.id,
      biller,
      accountNumber,
      amount: payment.amount,
      currency: payment.currency,
      status: 'success',
      reference: payment.reference
    },
    message: 'Bill payment processed successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
