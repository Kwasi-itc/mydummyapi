import express from 'express';

const router = express.Router();

const VALID_TENORS = [91, 182, 364];

const calculateMaturityDate = (issueDate, tenorDays) => {
  const date = new Date(issueDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCDate(date.getUTCDate() + tenorDays);
  return date.toISOString();
};

const formatNumber = (value, decimals = 2) =>
  Number.parseFloat(value.toFixed(decimals));

/**
 * @swagger
 * /treasury/tbills/calculate:
 *   get:
 *     summary: Calculate Ghana T-bill returns using discount rates
 *     description: Computes maturity value, interest earned, and annualized yield for Bank of Ghana treasury bills.
 *     tags: [Treasury]
 *     parameters:
 *       - in: query
 *         name: investmentAmount
 *         required: true
 *         schema:
 *           type: number
 *           example: 10000
 *         description: Cash amount you plan to invest (purchase price) in GHS.
 *       - in: query
 *         name: tenor
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [91, 182, 364]
 *           example: 91
 *         description: Tenor in days (Bank of Ghana standard maturities).
 *       - in: query
 *         name: discountRate
 *         required: true
 *         schema:
 *           type: number
 *           example: 25.5
 *         description: Annual discount rate quoted by Bank of Ghana (percentage).
 *       - in: query
 *         name: issueDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-02-01
 *         description: Auction settlement date (defaults to today, UTC).
 *     responses:
 *       200:
 *         description: T-bill calculation result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TBillCalculation'
 *       400:
 *         description: Invalid inputs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/tbills/calculate', (req, res) => {
  const { investmentAmount, tenor, discountRate, issueDate } = req.query;

  if (!investmentAmount || !tenor || !discountRate) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required query parameters: investmentAmount, tenor, discountRate',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const amount = Number.parseFloat(investmentAmount);
  const tenorDays = Number.parseInt(tenor, 10);
  const discount = Number.parseFloat(discountRate);

  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'investmentAmount must be a positive number',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (!VALID_TENORS.includes(tenorDays)) {
    return res.status(400).json({
      status: 'error',
      message: `tenor must be one of ${VALID_TENORS.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (Number.isNaN(discount) || discount <= 0 || discount >= 100) {
    return res.status(400).json({
      status: 'error',
      message: 'discountRate must be between 0 and 100 (percentage)',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const settlementDate = issueDate ? new Date(issueDate) : new Date();
  if (Number.isNaN(settlementDate.getTime())) {
    return res.status(400).json({
      status: 'error',
      message: 'issueDate must be a valid date (YYYY-MM-DD)',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const issueDateIso = settlementDate.toISOString();

  const discountDecimal = discount / 100;
  const discountFactor = 1 - discountDecimal * (tenorDays / 365);

  if (discountFactor <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Discount rate too high for the selected tenor',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const faceValue = amount / discountFactor;
  const interestEarned = faceValue - amount;
  const annualizedYield = (interestEarned / amount) * (365 / tenorDays) * 100;
  const maturityDate = calculateMaturityDate(issueDateIso, tenorDays);

  const responseData = {
    investmentAmount: formatNumber(amount, 2),
    tenorDays,
    discountRate: formatNumber(discount, 4),
    discountFactor: formatNumber(discountFactor, 6),
    faceValue: formatNumber(faceValue, 2),
    interestEarned: formatNumber(interestEarned, 2),
    annualizedYield: formatNumber(annualizedYield, 4),
    maturityDate,
    issueDate: issueDateIso,
    summary: `Invest GHS ${formatNumber(amount, 2)} to receive GHS ${formatNumber(faceValue, 2)} at maturity.`
  };

  res.json({
    status: 'success',
    data: responseData,
    message: 'Treasury bill projection generated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /treasury/fixed-deposit-rates/gcb:
 *   get:
 *     summary: Get fixed deposit interest rates for GCB Bank
 *     description: Returns current fixed deposit interest rates organized by tenure (months) and investment amount ranges
 *     tags: [Treasury]
 *     responses:
 *       200:
 *         description: Fixed deposit rates retrieved successfully
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
 *                         bank:
 *                           type: string
 *                           example: GCB
 *                         lastUpdated:
 *                           type: string
 *                           format: date
 *                           example: 2025-11-24
 *                         tenures:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               tenure:
 *                                 type: integer
 *                                 description: Tenure in months
 *                                 example: 1
 *                               amountRanges:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     minAmount:
 *                                       type: number
 *                                     maxAmount:
 *                                       type: number
 *                                       nullable: true
 *                                     rate:
 *                                       type: number
 *                                       description: Interest rate percentage
 */
router.get('/fixed-deposit-rates/gcb', (req, res) => {
  // GCB Bank Fixed Deposit Rates (as at 24th Nov. 2025)
  // Organized by tenure (months), then amount ranges
  const gcbRates = {
    bank: 'GCB',
    lastUpdated: '2025-11-24',
    tenures: [
      {
        tenure: 1,
        amountRanges: [
          { minAmount: 1000, maxAmount: 10000, rate: 1.25 },
          { minAmount: 10001, maxAmount: 50000, rate: 2.25 },
          { minAmount: 50001, maxAmount: 100000, rate: 3.25 },
          { minAmount: 100001, maxAmount: 500000, rate: 3.00 },
          { minAmount: 500001, maxAmount: 1000000, rate: 4.00 },
          { minAmount: 1000001, maxAmount: null, rate: 5.75 }
        ]
      },
      {
        tenure: 2,
        amountRanges: [
          { minAmount: 1000, maxAmount: 10000, rate: 2.25 },
          { minAmount: 10001, maxAmount: 50000, rate: 3.25 },
          { minAmount: 50001, maxAmount: 100000, rate: 3.75 },
          { minAmount: 100001, maxAmount: 500000, rate: 4.00 },
          { minAmount: 500001, maxAmount: 1000000, rate: 5.50 },
          { minAmount: 1000001, maxAmount: null, rate: 6.25 }
        ]
      },
      {
        tenure: 3,
        amountRanges: [
          { minAmount: 1000, maxAmount: 10000, rate: 3.00 },
          { minAmount: 10001, maxAmount: 50000, rate: 4.50 },
          { minAmount: 50001, maxAmount: 100000, rate: 6.00 },
          { minAmount: 100001, maxAmount: 500000, rate: 6.25 },
          { minAmount: 500001, maxAmount: 1000000, rate: 7.00 },
          { minAmount: 1000001, maxAmount: null, rate: 7.50 }
        ]
      },
      {
        tenure: 6,
        amountRanges: [
          { minAmount: 1000, maxAmount: 10000, rate: 4.00 },
          { minAmount: 10001, maxAmount: 50000, rate: 5.25 },
          { minAmount: 50001, maxAmount: 100000, rate: 6.25 },
          { minAmount: 100001, maxAmount: 500000, rate: 6.50 },
          { minAmount: 500001, maxAmount: 1000000, rate: 7.25 },
          { minAmount: 1000001, maxAmount: null, rate: 7.75 }
        ]
      },
      {
        tenure: 12,
        amountRanges: [
          { minAmount: 1000, maxAmount: 10000, rate: 5.00 },
          { minAmount: 10001, maxAmount: 50000, rate: 6.00 },
          { minAmount: 50001, maxAmount: 100000, rate: 6.50 },
          { minAmount: 100001, maxAmount: 500000, rate: 6.70 },
          { minAmount: 500001, maxAmount: 1000000, rate: 8.00 },
          { minAmount: 1000001, maxAmount: null, rate: 9.00 }
        ]
      }
    ]
  };

  res.json({
    status: 'success',
    data: gcbRates,
    message: 'Fixed deposit rates retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /treasury/fixed-deposit-rates/fnb:
 *   get:
 *     summary: Get fixed deposit interest rates for First National Bank
 *     description: Returns current fixed deposit interest rates organized by tenure (months) and investment amount ranges
 *     tags: [Treasury]
 *     responses:
 *       200:
 *         description: Fixed deposit rates retrieved successfully
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
 *                         bank:
 *                           type: string
 *                           example: FNB
 *                         lastUpdated:
 *                           type: string
 *                           format: date
 *                           example: 2025-08-11
 *                         tenures:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               tenure:
 *                                 type: integer
 *                                 description: Tenure in months
 *                                 example: 1
 *                               amountRanges:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     minAmount:
 *                                       type: number
 *                                     maxAmount:
 *                                       type: number
 *                                       nullable: true
 *                                     rate:
 *                                       type: number
 *                                       description: Interest rate percentage
 */
router.get('/fixed-deposit-rates/fnb', (req, res) => {
  // First National Bank Fixed Deposit Rates (Published at 2025-08-11)
  // Organized by tenure (months), then amount ranges
  const fnbRates = {
    bank: 'FNB',
    lastUpdated: '2025-08-11',
    tenures: [
      {
        tenure: 1,
        amountRanges: [
          { minAmount: 0, maxAmount: 999, rate: 0.00 },
          { minAmount: 1000, maxAmount: 4999, rate: 1.00 },
          { minAmount: 5000, maxAmount: 9999, rate: 1.50 },
          { minAmount: 10000, maxAmount: 24999, rate: 2.00 },
          { minAmount: 25000, maxAmount: 49999, rate: 2.50 },
          { minAmount: 50000, maxAmount: 200000, rate: 3.00 }
        ]
      },
      {
        tenure: 3,
        amountRanges: [
          { minAmount: 0, maxAmount: 999, rate: 0.00 },
          { minAmount: 1000, maxAmount: 4999, rate: 3.50 },
          { minAmount: 5000, maxAmount: 9999, rate: 4.00 },
          { minAmount: 10000, maxAmount: 24999, rate: 4.50 },
          { minAmount: 25000, maxAmount: 49999, rate: 5.00 },
          { minAmount: 50000, maxAmount: 200000, rate: 5.50 }
        ]
      },
      {
        tenure: 6,
        amountRanges: [
          { minAmount: 0, maxAmount: 999, rate: 0.00 },
          { minAmount: 1000, maxAmount: 4999, rate: 4.50 },
          { minAmount: 5000, maxAmount: 9999, rate: 5.00 },
          { minAmount: 10000, maxAmount: 24999, rate: 5.50 },
          { minAmount: 25000, maxAmount: 49999, rate: 6.00 },
          { minAmount: 50000, maxAmount: 200000, rate: 6.50 }
        ]
      },
      {
        tenure: 12,
        amountRanges: [
          { minAmount: 0, maxAmount: 999, rate: 0.00 },
          { minAmount: 1000, maxAmount: 4999, rate: 5.00 },
          { minAmount: 5000, maxAmount: 9999, rate: 5.50 },
          { minAmount: 10000, maxAmount: 24999, rate: 6.00 },
          { minAmount: 25000, maxAmount: 49999, rate: 6.50 },
          { minAmount: 50000, maxAmount: 200000, rate: 7.00 }
        ]
      },
      {
        tenure: 18,
        amountRanges: [
          { minAmount: 0, maxAmount: 999, rate: 0.00 },
          { minAmount: 1000, maxAmount: 4999, rate: 5.20 },
          { minAmount: 5000, maxAmount: 9999, rate: 5.70 },
          { minAmount: 10000, maxAmount: 24999, rate: 6.20 },
          { minAmount: 25000, maxAmount: 49999, rate: 6.70 },
          { minAmount: 50000, maxAmount: 200000, rate: 7.20 }
        ]
      },
      {
        tenure: 24,
        amountRanges: [
          { minAmount: 0, maxAmount: 999, rate: 0.00 },
          { minAmount: 1000, maxAmount: 4999, rate: 5.20 },
          { minAmount: 5000, maxAmount: 9999, rate: 5.70 },
          { minAmount: 10000, maxAmount: 24999, rate: 6.20 },
          { minAmount: 25000, maxAmount: 49999, rate: 6.70 },
          { minAmount: 50000, maxAmount: 200000, rate: 7.20 }
        ]
      }
    ]
  };

  res.json({
    status: 'success',
    data: fnbRates,
    message: 'Fixed deposit rates retrieved successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

