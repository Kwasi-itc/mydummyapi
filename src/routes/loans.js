import express from 'express';
import {
  getLoans,
  getLoanById,
  addLoan,
  updateLoan
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /loans/apply:
 *   post:
 *     summary: Submit a loan application
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - accountId
 *               - amount
 *               - purpose
 *               - tenure
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cust-001
 *               accountId:
 *                 type: string
 *                 example: acc-001
 *               amount:
 *                 type: number
 *                 example: 5000.00
 *               purpose:
 *                 type: string
 *                 example: Business expansion
 *               tenure:
 *                 type: integer
 *                 example: 12
 *               collateral:
 *                 type: string
 *                 example: Property documents
 *     responses:
 *       201:
 *         description: Loan application submitted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Missing required fields or invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/apply', (req, res) => {
  const { customerId, accountId, amount, purpose, tenure, collateral } = req.body;

  if (!customerId || !accountId || !amount || !purpose || !tenure) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: customerId, accountId, amount, purpose, tenure',
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

  // Calculate interest rate based on amount (simplified)
  const interestRate = amount > 10000 ? 7.5 : amount > 5000 ? 8.5 : 10.0;
  const monthlyPayment = (amount * (1 + interestRate / 100)) / tenure;

  // Simulate credit score
  const creditScore = Math.floor(Math.random() * 200) + 500;

  const loan = addLoan({
    customerId,
    accountId,
    amount,
    currency: 'GHS',
    purpose,
    tenure,
    interestRate,
    monthlyPayment,
    creditScore,
    collateral: collateral || null
  });

  res.status(201).json({
    status: 'success',
    data: loan,
    message: 'Loan application submitted',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/{loanId}:
 *   get:
 *     summary: Get loan application details by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Loan'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:loanId', (req, res) => {
  const loan = getLoanById(req.params.loanId);
  
  if (!loan) {
    return res.status(404).json({
      status: 'error',
      message: 'Loan not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: loan,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans:
 *   get:
 *     summary: List loans with optional filters
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by loan status
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO format)
 *     responses:
 *       200:
 *         description: List of loans
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
 *                         $ref: '#/components/schemas/Loan'
 */
router.get('/', (req, res) => {
  const { customerId, status, dateFrom } = req.query;
  let loans = getLoans();

  if (customerId) {
    loans = loans.filter(loan => loan.customerId === customerId);
  }
  if (status) {
    loans = loans.filter(loan => loan.status === status);
  }
  if (dateFrom) {
    loans = loans.filter(loan => loan.appliedAt >= dateFrom);
  }

  res.json({
    status: 'success',
    data: loans,
    count: loans.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/{loanId}/check-eligible:
 *   get:
 *     summary: Checker endpoint - Verify loan eligibility
 *     description: Returns true/false indicating if the loan is eligible (credit score >= 650). Used for workflow conditional logic.
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/:loanId/check-eligible', (req, res) => {
  const loan = getLoanById(req.params.loanId);

  if (!loan) {
    return res.json({
      result: false,
      reason: 'Loan not found',
      metadata: { loanId: req.params.loanId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isEligible = loan.eligible && loan.creditScore >= 650;
  
  res.json({
    result: isEligible,
    reason: isEligible 
      ? 'Loan is eligible' 
      : `Credit score ${loan.creditScore} is below minimum threshold (650)`,
    metadata: {
      loanId: loan.id,
      creditScore: loan.creditScore,
      eligible: loan.eligible,
      amount: loan.amount,
      status: loan.status
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/{loanId}/check-approved:
 *   get:
 *     summary: Checker endpoint - Verify loan approval status
 *     description: Returns true/false indicating if the loan has been approved. Used for workflow conditional logic.
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/:loanId/check-approved', (req, res) => {
  const loan = getLoanById(req.params.loanId);

  if (!loan) {
    return res.json({
      result: false,
      reason: 'Loan not found',
      metadata: { loanId: req.params.loanId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isApproved = loan.status === 'approved';
  const pendingChecks = isApproved ? [] : ['credit_check', 'document_verification', 'risk_assessment'];
  
  res.json({
    result: isApproved,
    reason: isApproved 
      ? 'Loan has been approved' 
      : `Loan status is: ${loan.status}`,
    metadata: {
      loanId: loan.id,
      status: loan.status,
      pendingChecks,
      approvedAt: loan.approvedAt
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/{loanId}/approve:
 *   post:
 *     summary: Approve a loan (admin action)
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan approved and disbursed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Cannot approve loan with current status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:loanId/approve', (req, res) => {
  const loan = getLoanById(req.params.loanId);

  if (!loan) {
    return res.status(404).json({
      status: 'error',
      message: 'Loan not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (loan.status !== 'pending') {
    return res.status(400).json({
      status: 'error',
      message: `Cannot approve loan with status: ${loan.status}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const updatedLoan = updateLoan(req.params.loanId, { 
    status: 'approved',
    disbursedAt: new Date().toISOString(),
    remainingBalance: loan.amount
  });

  res.json({
    status: 'success',
    data: updatedLoan,
    message: 'Loan approved and disbursed',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/{loanId}/reject:
 *   post:
 *     summary: Reject a loan application
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Insufficient credit score
 *     responses:
 *       200:
 *         description: Loan application rejected
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Cannot reject loan with current status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:loanId/reject', (req, res) => {
  const { reason } = req.body;
  const loan = getLoanById(req.params.loanId);

  if (!loan) {
    return res.status(404).json({
      status: 'error',
      message: 'Loan not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (loan.status !== 'pending') {
    return res.status(400).json({
      status: 'error',
      message: `Cannot reject loan with status: ${loan.status}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const updatedLoan = updateLoan(req.params.loanId, { 
    status: 'rejected',
    rejectionReason: reason || 'Application does not meet requirements'
  });

  res.json({
    status: 'success',
    data: updatedLoan,
    message: 'Loan application rejected',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
