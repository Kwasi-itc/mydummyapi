import express from 'express';
import {
  getAirtimePurchases,
  getAirtimePurchaseById,
  addAirtimePurchase,
  updateAirtimePurchase
} from '../data/mockData.js';

const router = express.Router();

// Available providers
const PROVIDERS = [
  { id: 'MTN', name: 'MTN', countries: ['GH', 'NG', 'ZA'] },
  { id: 'Vodafone', name: 'Vodafone', countries: ['GH', 'NG'] },
  { id: 'Airtel', name: 'Airtel', countries: ['GH', 'NG', 'KE'] },
  { id: 'Tigo', name: 'Tigo', countries: ['GH'] },
  { id: 'Orange', name: 'Orange', countries: ['GH', 'CI'] }
];

/**
 * @swagger
 * /airtime/providers:
 *   get:
 *     summary: List available airtime providers/networks
 *     tags: [Airtime]
 *     responses:
 *       200:
 *         description: List of available providers
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: MTN
 *                           name:
 *                             type: string
 *                             example: MTN
 *                           countries:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: [GH, NG, ZA]
 */
router.get('/providers', (req, res) => {
  res.json({
    status: 'success',
    data: PROVIDERS,
    count: PROVIDERS.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /airtime/purchase:
 *   post:
 *     summary: Purchase airtime
 *     tags: [Airtime]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - amount
 *               - provider
 *               - accountId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: +233241234567
 *               amount:
 *                 type: number
 *                 example: 10.00
 *               provider:
 *                 type: string
 *                 example: MTN
 *               currency:
 *                 type: string
 *                 example: GHS
 *               accountId:
 *                 type: string
 *                 example: acc-001
 *     responses:
 *       201:
 *         description: Airtime purchase initiated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AirtimePurchase'
 *       400:
 *         description: Missing required fields, invalid amount, or invalid provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/purchase', (req, res) => {
  const { phoneNumber, amount, provider, currency, accountId } = req.body;

  if (!phoneNumber || !amount || !provider || !accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: phoneNumber, amount, provider, accountId',
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

  const providerExists = PROVIDERS.find(p => p.id === provider || p.name === provider);
  if (!providerExists) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid provider. Available: ${PROVIDERS.map(p => p.id).join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const purchase = addAirtimePurchase({
    accountId,
    phoneNumber,
    amount,
    currency: currency || 'GHS',
    provider: providerExists.id
  });

  // Simulate completion after a delay (in real app, this would be async)
  setTimeout(() => {
    updateAirtimePurchase(purchase.id, { status: 'completed' });
  }, 2000);

  res.status(201).json({
    status: 'success',
    data: purchase,
    message: 'Airtime purchase initiated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /airtime/purchases/{purchaseId}:
 *   get:
 *     summary: Get airtime purchase details by ID
 *     tags: [Airtime]
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Airtime purchase ID
 *     responses:
 *       200:
 *         description: Airtime purchase details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AirtimePurchase'
 *       404:
 *         description: Airtime purchase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/purchases/:purchaseId', (req, res) => {
  const purchase = getAirtimePurchaseById(req.params.purchaseId);
  
  if (!purchase) {
    return res.status(404).json({
      status: 'error',
      message: 'Airtime purchase not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: purchase,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /airtime/purchases:
 *   get:
 *     summary: List airtime purchases with optional filters
 *     tags: [Airtime]
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         description: Filter by phone number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed]
 *         description: Filter by status
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO format)
 *     responses:
 *       200:
 *         description: List of airtime purchases
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AirtimePurchase'
 */
router.get('/purchases', (req, res) => {
  const { accountId, phoneNumber, status, dateFrom } = req.query;
  let purchases = getAirtimePurchases();

  if (accountId) {
    purchases = purchases.filter(p => p.accountId === accountId);
  }
  if (phoneNumber) {
    purchases = purchases.filter(p => p.phoneNumber === phoneNumber);
  }
  if (status) {
    purchases = purchases.filter(p => p.status === status);
  }
  if (dateFrom) {
    purchases = purchases.filter(p => p.purchasedAt >= dateFrom);
  }

  res.json({
    status: 'success',
    data: purchases,
    count: purchases.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /airtime/purchases/{purchaseId}/check-completed:
 *   get:
 *     summary: Checker endpoint - Verify if airtime purchase is completed
 *     description: Returns true/false indicating if the airtime purchase has been completed. Used for workflow conditional logic.
 *     tags: [Airtime]
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Airtime purchase ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/purchases/:purchaseId/check-completed', (req, res) => {
  const purchase = getAirtimePurchaseById(req.params.purchaseId);

  if (!purchase) {
    return res.json({
      result: false,
      reason: 'Airtime purchase not found',
      metadata: { purchaseId: req.params.purchaseId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isCompleted = purchase.status === 'completed';
  
  res.json({
    result: isCompleted,
    reason: isCompleted 
      ? 'Airtime purchase has been completed' 
      : `Purchase status is: ${purchase.status}`,
    metadata: {
      purchaseId: purchase.id,
      status: purchase.status,
      deliveryStatus: purchase.deliveryStatus,
      phoneNumber: purchase.phoneNumber,
      amount: purchase.amount,
      provider: purchase.provider,
      completedAt: purchase.completedAt
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
