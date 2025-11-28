import express from 'express';
import {
  getAccounts,
  getAccountById,
  addAccount,
  updateAccount
} from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: List all accounts with optional filters
 *     tags: [Accounts]
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
 *           enum: [active, suspended, closed]
 *         description: Filter by account status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [savings, current]
 *         description: Filter by account type
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *     responses:
 *       200:
 *         description: List of accounts
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
 *                         $ref: '#/components/schemas/Account'
 */
router.get('/', (req, res) => {
  const { customerId, status, type, currency } = req.query;
  let accounts = getAccounts();

  if (customerId) {
    accounts = accounts.filter(acc => acc.customerId === customerId);
  }
  if (status) {
    accounts = accounts.filter(acc => acc.status === status);
  }
  if (type) {
    accounts = accounts.filter(acc => acc.type === type);
  }
  if (currency) {
    accounts = accounts.filter(acc => acc.currency === currency);
  }

  res.json({
    status: 'success',
    data: accounts,
    count: accounts.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/get:
 *   post:
 *     summary: Get account details by ID
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: acc-001
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/get', (req, res) => {
  const { accountId } = req.body;
  
  if (!accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: accountId',
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

  res.json({
    status: 'success',
    data: account,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - type
 *               - currency
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: The unique identifier of the customer
 *                 example: cust-001
 *               type:
 *                 type: string
 *                 enum: [savings, current]
 *                 description: Type of account to create (savings or current)
 *                 example: savings
 *               currency:
 *                 type: string
 *                 description: Currency code for the account (e.g., GHS, USD, EUR, NGN)
 *                 example: GHS
 *               initialDeposit:
 *                 type: number
 *                 minimum: 0
 *                 description: Initial deposit amount (defaults to 0 if not provided)
 *                 example: 1000.00
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', (req, res) => {
  const { customerId, type, currency, initialDeposit } = req.body;

  // Validate required fields
  const requiredFields = {
    customerId,
    type,
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

  // Validate type enum
  const validTypes = ['savings', 'current'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate initialDeposit if provided
  if (initialDeposit !== undefined && initialDeposit !== null) {
    if (typeof initialDeposit !== 'number' || isNaN(initialDeposit) || initialDeposit < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'initialDeposit must be a number >= 0',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  const account = addAccount({
    customerId,
    type,
    currency,
    balance: initialDeposit !== undefined && initialDeposit !== null ? initialDeposit : 0,
    status: 'active',
    accountNumber: String(Math.floor(Math.random() * 9000000000) + 1000000000)
  });

  res.status(201).json({
    status: 'success',
    data: account,
    message: 'Account created successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/update-status:
 *   post:
 *     summary: Update account status
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - status
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: acc-001
 *               status:
 *                 type: string
 *                 enum: [active, suspended, closed]
 *                 example: suspended
 *     responses:
 *       200:
 *         description: Account status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/update-status', (req, res) => {
  const { accountId, status } = req.body;
  
  if (!accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: accountId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  const validStatuses = ['active', 'suspended', 'closed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const account = updateAccount(accountId, { status });

  if (!account) {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: account,
    message: 'Account status updated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/check-active:
 *   get:
 *     summary: Checker endpoint - Verify if account is active
 *     description: Returns true/false indicating if the account is active. Used for workflow conditional logic.
 *     tags: [Accounts]
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
router.get('/check-active', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    value: finalResult,
    message: finalResult ? 'Account is active' : 'Account is inactive',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/calbank/create:
 *   post:
 *     summary: Create a new account with CalBank
 *     description: Submit a comprehensive account opening application for CalBank with personal details, address, employment, identification, and contact information
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - dateOfBirth
 *               - placeOfBirth
 *               - mothersMaidenName
 *               - accountType
 *               - tinNumber
 *               - maritalStatus
 *               - houseNumber
 *               - landmark
 *               - cityTown
 *               - telephoneNumber
 *               - email
 *               - profession
 *               - employerName
 *               - natureOfBusiness
 *               - employerLocation
 *               - yearsEmployed
 *               - expectedIncome
 *               - idType
 *               - idNumber
 *               - idIssueDate
 *               - idExpiryDate
 *               - initialDeposit
 *               - contactPersonName
 *               - contactPersonTelephone
 *               - contactPersonAddress
 *               - contactPersonRelationship
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: The unique identifier of the customer
 *                 example: cust-001
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD)
 *                 example: 1990-01-15
 *               placeOfBirth:
 *                 type: string
 *                 description: Place of birth
 *                 example: Accra, Ghana
 *               mothersMaidenName:
 *                 type: string
 *                 description: Mother's maiden name
 *                 example: Jane Doe
 *               accountType:
 *                 type: string
 *                 enum: [savings, current, premium]
 *                 description: Type of account to create
 *                 example: savings
 *               tinNumber:
 *                 type: string
 *                 description: Tax Identification Number
 *                 example: TIN123456789
 *               maritalStatus:
 *                 type: string
 *                 description: Marital status
 *                 example: single
 *               houseNumber:
 *                 type: string
 *                 description: House number
 *                 example: 123
 *               landmark:
 *                 type: string
 *                 description: Landmark near residence
 *                 example: Near Independence Square
 *               cityTown:
 *                 type: string
 *                 description: City or town
 *                 example: Accra
 *               telephoneNumber:
 *                 type: string
 *                 description: Contact telephone number
 *                 example: +233241234567
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: john.doe@example.com
 *               profession:
 *                 type: string
 *                 description: Profession or occupation
 *                 example: Software Engineer
 *               employerName:
 *                 type: string
 *                 description: Name of employer
 *                 example: Tech Solutions Ltd
 *               natureOfBusiness:
 *                 type: string
 *                 description: Nature of business
 *                 example: Technology Services
 *               employerLocation:
 *                 type: string
 *                 description: Location/address of employer
 *                 example: 456 Business Street, Accra
 *               yearsEmployed:
 *                 type: number
 *                 description: Number of years employed
 *                 example: 5
 *               expectedIncome:
 *                 type: number
 *                 description: Expected annual income
 *                 example: 120000
 *               idType:
 *                 type: string
 *                 description: Type of identification document
 *                 example: national_id
 *               idNumber:
 *                 type: string
 *                 description: Identification document number
 *                 example: GHA-123456789
 *               idIssueDate:
 *                 type: string
 *                 format: date
 *                 description: ID issue date (YYYY-MM-DD)
 *                 example: 2020-01-10
 *               idExpiryDate:
 *                 type: string
 *                 format: date
 *                 description: ID expiry date (YYYY-MM-DD)
 *                 example: 2030-01-10
 *               initialDeposit:
 *                 type: number
 *                 minimum: 0
 *                 description: Initial deposit amount
 *                 example: 1000.00
 *               introducer:
 *                 type: string
 *                 description: Name of introducer (if any)
 *                 example: John Smith
 *               contactPersonName:
 *                 type: string
 *                 description: Name of contact person
 *                 example: Mary Doe
 *               contactPersonTelephone:
 *                 type: string
 *                 description: Contact person's telephone number
 *                 example: +233241234568
 *               contactPersonAddress:
 *                 type: string
 *                 description: Contact person's address location
 *                 example: 789 Contact Street, Accra
 *               contactPersonRelationship:
 *                 type: string
 *                 description: Relationship to contact person
 *                 example: Sister
 *     responses:
 *       201:
 *         description: Account application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       400:
 *         description: Missing required fields or invalid values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/calbank/create', (req, res) => {
  const {
    customerId,
    dateOfBirth,
    placeOfBirth,
    mothersMaidenName,
    accountType,
    tinNumber,
    maritalStatus,
    houseNumber,
    landmark,
    cityTown,
    telephoneNumber,
    email,
    profession,
    employerName,
    natureOfBusiness,
    employerLocation,
    yearsEmployed,
    expectedIncome,
    idType,
    idNumber,
    idIssueDate,
    idExpiryDate,
    initialDeposit,
    introducer,
    contactPersonName,
    contactPersonTelephone,
    contactPersonAddress,
    contactPersonRelationship
  } = req.body;

  // Validate required fields
  const requiredFields = {
    customerId,
    dateOfBirth,
    placeOfBirth,
    mothersMaidenName,
    accountType,
    tinNumber,
    maritalStatus,
    houseNumber,
    landmark,
    cityTown,
    telephoneNumber,
    email,
    profession,
    employerName,
    natureOfBusiness,
    employerLocation,
    yearsEmployed,
    expectedIncome,
    idType,
    idNumber,
    idIssueDate,
    idExpiryDate,
    initialDeposit,
    contactPersonName,
    contactPersonTelephone,
    contactPersonAddress,
    contactPersonRelationship
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

  // Validate account type
  const validAccountTypes = ['savings', 'current', 'premium'];
  if (!validAccountTypes.includes(accountType)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid accountType. Must be one of: ${validAccountTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateOfBirth) || !dateRegex.test(idIssueDate) || !dateRegex.test(idExpiryDate)) {
    return res.status(400).json({
      status: 'error',
      message: 'Date fields must be in YYYY-MM-DD format',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate initial deposit
  if (typeof initialDeposit !== 'number' || initialDeposit < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'initialDeposit must be a number >= 0',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid email format',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Create account with CalBank
  const account = addAccount({
    customerId,
    type: accountType,
    currency: 'GHS',
    balance: initialDeposit || 0,
    status: 'active',
    accountNumber: String(Math.floor(Math.random() * 9000000000) + 1000000000),
    // Store additional CalBank-specific information
    calbankDetails: {
      dateOfBirth,
      placeOfBirth,
      mothersMaidenName,
      tinNumber,
      maritalStatus,
      address: {
        houseNumber,
        landmark,
        cityTown,
        telephoneNumber,
        email
      },
      employment: {
        profession,
        employerName,
        natureOfBusiness,
        employerLocation,
        yearsEmployed,
        expectedIncome
      },
      identification: {
        idType,
        idNumber,
        idIssueDate,
        idExpiryDate
      },
      initialDeposit,
      introducer: introducer || null,
      contactPerson: {
        name: contactPersonName,
        telephone: contactPersonTelephone,
        address: contactPersonAddress,
        relationship: contactPersonRelationship
      }
    }
  });

  res.status(201).json({
    status: 'success',
    data: {
      customerId,
      accountType,
      applicationStatus: 'submitted'
    },
    message: 'CalBank account application submitted successfully. Please wait 1 to 2 business days for processing.',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

