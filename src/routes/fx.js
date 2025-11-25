import express from 'express';
import { getExchangeRate } from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /fx/exchange-rate:
 *   get:
 *     summary: Get exchange rate between two currencies
 *     tags: [FX]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           example: GHS
 *         description: Base currency code
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           example: USD
 *         description: Quote currency code
 *       - in: query
 *         name: amount
 *         required: false
 *         schema:
 *           type: number
 *           example: 100
 *         description: Amount to convert (defaults to 1)
 *     responses:
 *       200:
 *         description: Exchange rate details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ExchangeRate'
 *       400:
 *         description: Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Rate not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/exchange-rate', (req, res) => {
  const { from, to, amount = '1' } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required query parameters: from, to',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount must be a positive number',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const rateData = getExchangeRate(from, to);

  if (!rateData) {
    return res.status(404).json({
      status: 'error',
      message: 'Exchange rate not available for the provided currencies',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const convertedAmount = parseFloat((amountNum * rateData.rate).toFixed(4));

  res.json({
    status: 'success',
    data: {
      from: rateData.base,
      to: rateData.quote,
      rate: rateData.rate,
      amount: amountNum,
      convertedAmount,
      source: rateData.source,
      retrievedAt: rateData.retrievedAt
    },
    message: 'Exchange rate retrieved',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

