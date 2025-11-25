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

export default router;

