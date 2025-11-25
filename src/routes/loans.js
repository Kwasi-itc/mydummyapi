import express from 'express';
import {
  getLoans,
  getLoanById,
  addLoan,
  updateLoan
} from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();
const addMonthsUtc = (date, months) => {
  const result = new Date(date);
  if (Number.isNaN(result.getTime())) {
    return null;
  }
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

const formatAmount = (value, decimals = 2) => Number.parseFloat(value.toFixed(decimals));

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
 *               - loan_type
 *               - loan_amount
 *               - loan_purpose
 *               - annual_income
 *               - employment_status
 *               - preferred_term_months
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: The unique identifier of the customer applying for the loan
 *                 example: cust-001
 *               accountId:
 *                 type: string
 *                 description: The unique identifier of the account associated with the loan
 *                 example: acc-001
 *               loan_type:
 *                 type: string
 *                 enum: [personal, business]
 *                 description: Type of loan (personal or business)
 *                 example: business
 *               loan_amount:
 *                 type: number
 *                 minimum: 1000
 *                 maximum: 1000000
 *                 description: Loan amount in GH₵ (must be between 1,000 and 1,000,000)
 *                 example: 50000.00
 *               loan_purpose:
 *                 type: string
 *                 description: Purpose or reason for the loan
 *                 example: Business expansion
 *               annual_income:
 *                 type: number
 *                 minimum: 0
 *                 description: Annual income in GH₵ (must be >= 0)
 *                 example: 120000.00
 *               employment_status:
 *                 type: string
 *                 enum: [employed, self-employed, unemployed, retired]
 *                 description: Employment status of the applicant
 *                 example: employed
 *               preferred_term_months:
 *                 type: integer
 *                 minimum: 6
 *                 maximum: 360
 *                 description: Preferred loan term in months (must be between 6 and 360)
 *                 example: 12
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
 *         description: Missing required fields or invalid values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/apply', (req, res) => {
  const { 
    customerId, 
    accountId, 
    loan_type, 
    loan_amount, 
    loan_purpose, 
    annual_income, 
    employment_status, 
    preferred_term_months 
  } = req.body;

  // Validate required fields
  const requiredFields = {
    customerId,
    accountId,
    loan_type,
    loan_amount,
    loan_purpose,
    annual_income,
    employment_status,
    preferred_term_months
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

  // Calculate interest rate based on loan type, amount, and employment status
  let interestRate = 10.0; // Default
  if (loan_type === 'business') {
    interestRate = loan_amount > 50000 ? 7.5 : loan_amount > 20000 ? 8.5 : 9.5;
  } else {
    interestRate = loan_amount > 50000 ? 8.0 : loan_amount > 20000 ? 9.0 : 10.0;
  }
  
  // Adjust based on employment status
  if (employment_status === 'unemployed') {
    interestRate += 2.0;
  } else if (employment_status === 'retired') {
    interestRate += 1.0;
  }

  const monthlyPayment = (loan_amount * (1 + interestRate / 100)) / preferred_term_months;

  // Simulate credit score based on income and employment
  let creditScore = 500;
  if (annual_income > 200000) creditScore += 150;
  else if (annual_income > 100000) creditScore += 100;
  else if (annual_income > 50000) creditScore += 50;
  
  if (employment_status === 'employed') creditScore += 50;
  else if (employment_status === 'self-employed') creditScore += 25;
  else if (employment_status === 'unemployed') creditScore -= 50;
  
  creditScore += Math.floor(Math.random() * 100) - 50; // Random variation
  creditScore = Math.max(300, Math.min(850, creditScore)); // Clamp between 300-850

  const loan = addLoan({
    customerId,
    accountId,
    amount: loan_amount,
    currency: 'GHS',
    purpose: loan_purpose,
    tenure: preferred_term_months,
    interestRate,
    monthlyPayment,
    creditScore,
    loanType: loan_type,
    annualIncome: annual_income,
    employmentStatus: employment_status
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
 * /loans/get:
 *   post:
 *     summary: Get loan application details by ID
 *     tags: [Loans]
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
router.post('/get', (req, res) => {
  const { loanId } = req.body;
  
  if (!loanId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: loanId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const loan = getLoanById(loanId);
  
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
 * /loans/check-eligible:
 *   get:
 *     summary: Checker endpoint - Verify loan eligibility
 *     description: Returns true/false indicating if the loan is eligible (credit score >= 650). Used for workflow conditional logic.
 *     tags: [Loans]
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
router.get('/check-eligible', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    result: finalResult,
    reason: finalResult 
      ? 'Loan is eligible' 
      : 'Loan is not eligible',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/check-approved:
 *   get:
 *     summary: Checker endpoint - Verify loan approval status
 *     description: Returns true/false indicating if the loan has been approved. Used for workflow conditional logic.
 *     tags: [Loans]
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
router.get('/check-approved', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    result: finalResult,
    reason: finalResult 
      ? 'Loan has been approved' 
      : 'Loan has not been approved',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /loans/approve:
 *   post:
 *     summary: Approve a loan (admin action)
 *     tags: [Loans]
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
router.post('/approve', (req, res) => {
  const { loanId } = req.body;
  
  if (!loanId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: loanId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const loan = getLoanById(loanId);

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

  const updatedLoan = updateLoan(loanId, { 
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
 * /loans/reject:
 *   post:
 *     summary: Reject a loan application
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanId
 *             properties:
 *               loanId:
 *                 type: string
 *                 example: loan-001
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
router.post('/reject', (req, res) => {
  const { loanId, reason } = req.body;
  
  if (!loanId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: loanId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const loan = getLoanById(loanId);

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

  const updatedLoan = updateLoan(loanId, { 
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

/**
 * @swagger
 * /loans/repayments/calculate:
 *   get:
 *     summary: Loan repayment calculator
 *     description: Calculates amortized monthly payments, total interest and a month-by-month repayment schedule.
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: principal
 *         required: true
 *         schema:
 *           type: number
 *           example: 50000
 *         description: Loan amount in GHS.
 *       - in: query
 *         name: annualRate
 *         required: true
 *         schema:
 *           type: number
 *           example: 28.5
 *         description: Annual interest rate (percentage).
 *       - in: query
 *         name: termMonths
 *         required: true
 *         schema:
 *           type: integer
 *           example: 24
 *         description: Loan tenure in months.
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-02-01
 *         description: First disbursement date (defaults to today, UTC).
 *       - in: query
 *         name: extraPayment
 *         required: false
 *         schema:
 *           type: number
 *           example: 200
 *         description: Optional extra amount applied to principal each month.
 *     responses:
 *       200:
 *         description: Repayment projection generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoanRepaymentCalculation'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/repayments/calculate', (req, res) => {
  const { principal, annualRate, termMonths, startDate, extraPayment = '0' } = req.query;

  if (!principal || !annualRate || !termMonths) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required query parameters: principal, annualRate, termMonths',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const principalAmount = Number.parseFloat(principal);
  const annualRatePercent = Number.parseFloat(annualRate);
  const term = Number.parseInt(termMonths, 10);
  const extra = Number.parseFloat(extraPayment);

  if (Number.isNaN(principalAmount) || principalAmount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'principal must be a positive number',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (Number.isNaN(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 200) {
    return res.status(400).json({
      status: 'error',
      message: 'annualRate must be between 0 and 200 percent',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (Number.isNaN(term) || term <= 0 || term > 360) {
    return res.status(400).json({
      status: 'error',
      message: 'termMonths must be between 1 and 360',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (Number.isNaN(extra) || extra < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'extraPayment must be >= 0',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const scheduleStartDate = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(scheduleStartDate.getTime())) {
    return res.status(400).json({
      status: 'error',
      message: 'startDate must be a valid date (YYYY-MM-DD)',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const basePayment = monthlyRate === 0
    ? principalAmount / term
    : (principalAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));

  let balance = principalAmount;
  let totalInterest = 0;
  let totalPaid = 0;
  const installments = [];

  for (let i = 1; i <= term && balance > 0; i += 1) {
    const interestComponent = monthlyRate === 0 ? 0 : balance * monthlyRate;
    let paymentAmount = basePayment + extra;
    const principalComponent = paymentAmount - interestComponent;

    if (principalComponent > balance) {
      paymentAmount = balance + interestComponent;
    }

    const appliedPrincipal = paymentAmount - interestComponent;
    balance = Math.max(0, balance - appliedPrincipal);

    totalInterest += interestComponent;
    totalPaid += paymentAmount;

    const dueDate = addMonthsUtc(scheduleStartDate, i);

    installments.push({
      installment: i,
      dueDate: dueDate ? dueDate.toISOString() : null,
      paymentAmount: formatAmount(paymentAmount),
      principalComponent: formatAmount(appliedPrincipal),
      interestComponent: formatAmount(interestComponent),
      remainingBalance: formatAmount(balance)
    });
  }

  const scheduledPayment = formatAmount(basePayment + extra);
  const responseData = {
    principal: formatAmount(principalAmount),
    annualRate: formatAmount(annualRatePercent, 4),
    termMonths: term,
    baseMonthlyPayment: formatAmount(basePayment),
    scheduledMonthlyPayment: scheduledPayment,
    totalPaid: formatAmount(totalPaid),
    totalInterest: formatAmount(totalInterest),
    projectedMonths: installments.length,
    payoffDate: installments.length ? installments[installments.length - 1].dueDate : null,
    amortizationSchedule: installments,
    summary: `Pay ~GHS ${scheduledPayment} per month to clear the loan in ${installments.length} months.`
  };

  res.json({
    status: 'success',
    data: responseData,
    message: 'Loan repayment projection generated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
