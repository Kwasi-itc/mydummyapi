import express from 'express';
import { addWallet, getWallets } from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();

/**
 * @swagger
 * /chango/wallets/create:
 *   post:
 *     summary: Create a wallet for making contributions and/or receiving cashouts
 *     description: Create a wallet supporting Mobile Money (for contributions and cashout), Bank Account (for cashout only), or Card (for contributions only). Bearer token may be provided but is not required (dummy implementation).
 *     tags: [Chango]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country
 *               - walletType
 *             properties:
 *               country:
 *                 type: string
 *                 enum: [Ghana, Kenya, Liberia, Rwanda, Global]
 *                 description: Country for the wallet
 *                 example: Ghana
 *               walletType:
 *                 type: string
 *                 enum: [mobile_wallet, bank_account, card]
 *                 description: Type of wallet - mobile_wallet (for contributions and cashout), bank_account (for cashout only), or card (for contributions only)
 *                 example: mobile_wallet
 *               bankName:
 *                 type: string
 *                 description: Name of the bank (required only if walletType is 'bank_account')
 *                 example: "GCB Bank"
 *               accountHolderName:
 *                 type: string
 *                 description: Account holder name (required only if walletType is 'bank_account')
 *                 example: "John Doe"
 *               accountNumber:
 *                 type: string
 *                 description: Bank account number (required only if walletType is 'bank_account')
 *                 example: "1234567890"
 *               cardHolderName:
 *                 type: string
 *                 description: Card holder name (required only if walletType is 'card')
 *                 example: "John Doe"
 *               cardNumber:
 *                 type: string
 *                 description: Card number (required only if walletType is 'card')
 *                 example: "4111111111111111"
 *               cardExpiry:
 *                 type: string
 *                 description: Card expiry date in MM/YY format (required only if walletType is 'card')
 *                 example: "12/25"
 *               cardAlias:
 *                 type: string
 *                 description: Alias or nickname for the card (required only if walletType is 'card')
 *                 example: "My Primary Card"
 *               mobileNetwork:
 *                 type: string
 *                 enum: [MTN, AT, Telecel]
 *                 description: Mobile money network - MTN, AT, or Telecel (required only if walletType is 'mobile_wallet')
 *                 example: MTN
 *               mobileNumber:
 *                 type: string
 *                 description: Mobile money phone number (required only if walletType is 'mobile_wallet')
 *                 example: "+233241234567"
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Missing required fields or invalid values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create', (req, res) => {
  const {
    country,
    walletType,
    bankName,
    accountHolderName,
    accountNumber,
    cardHolderName,
    cardNumber,
    cardExpiry,
    cardAlias,
    mobileNetwork,
    mobileNumber
  } = req.body;

  // Validate required fields
  const requiredFields = {
    country,
    walletType
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

  // Validate country enum
  const validCountries = ['Ghana', 'Kenya', 'Liberia', 'Rwanda', 'Global'];
  if (!validCountries.includes(country)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid country. Must be one of: ${validCountries.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate walletType enum
  const validWalletTypes = ['mobile_wallet', 'bank_account', 'card'];
  if (!validWalletTypes.includes(walletType)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid walletType. Must be one of: ${validWalletTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate conditional fields based on walletType
  if (walletType === 'mobile_wallet') {
    if (!mobileNetwork) {
      return res.status(400).json({
        status: 'error',
        message: 'mobileNetwork is required when walletType is "mobile_wallet"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'mobileNumber is required when walletType is "mobile_wallet"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    // Validate mobileNetwork enum
    const validNetworks = ['MTN', 'AT', 'Telecel'];
    if (!validNetworks.includes(mobileNetwork)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid mobileNetwork. Must be one of: ${validNetworks.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  } else if (walletType === 'bank_account') {
    if (!bankName) {
      return res.status(400).json({
        status: 'error',
        message: 'bankName is required when walletType is "bank_account"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!accountHolderName) {
      return res.status(400).json({
        status: 'error',
        message: 'accountHolderName is required when walletType is "bank_account"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!accountNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'accountNumber is required when walletType is "bank_account"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  } else if (walletType === 'card') {
    if (!cardHolderName) {
      return res.status(400).json({
        status: 'error',
        message: 'cardHolderName is required when walletType is "card"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!cardNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'cardNumber is required when walletType is "card"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!cardExpiry) {
      return res.status(400).json({
        status: 'error',
        message: 'cardExpiry is required when walletType is "card"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    // Validate cardExpiry format (MM/YY)
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(cardExpiry)) {
      return res.status(400).json({
        status: 'error',
        message: 'cardExpiry must be in MM/YY format (e.g., 12/25)',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!cardAlias) {
      return res.status(400).json({
        status: 'error',
        message: 'cardAlias is required when walletType is "card"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  // Create the wallet
  const wallet = addWallet({
    country,
    walletType,
    bankName: walletType === 'bank_account' ? bankName : null,
    accountHolderName: walletType === 'bank_account' ? accountHolderName : null,
    accountNumber: walletType === 'bank_account' ? accountNumber : null,
    cardHolderName: walletType === 'card' ? cardHolderName : null,
    cardNumber: walletType === 'card' ? cardNumber : null,
    cardExpiry: walletType === 'card' ? cardExpiry : null,
    cardAlias: walletType === 'card' ? cardAlias : null,
    mobileNetwork: walletType === 'mobile_wallet' ? mobileNetwork : null,
    mobileNumber: walletType === 'mobile_wallet' ? mobileNumber : null
  });

  res.status(201).json({
    status: 'success',
    data: {
      id: wallet.id,
      country: wallet.country,
      walletType: wallet.walletType,
      bankName: wallet.bankName,
      accountHolderName: wallet.accountHolderName,
      accountNumber: wallet.accountNumber,
      cardHolderName: wallet.cardHolderName,
      cardNumber: wallet.cardNumber ? wallet.cardNumber.replace(/\d(?=\d{4})/g, '*') : null, // Mask card number
      cardExpiry: wallet.cardExpiry,
      cardAlias: wallet.cardAlias,
      mobileNetwork: wallet.mobileNetwork,
      mobileNumber: wallet.mobileNumber,
      status: wallet.status,
      createdAt: wallet.createdAt
    },
    message: 'Wallet created successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/wallets:
 *   get:
 *     summary: Get all wallets for the authenticated user
 *     description: Retrieve all wallets associated with the authenticated user. Bearer token may be provided but is not required (dummy implementation - returns all wallets).
 *     tags: [Chango]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     responses:
 *       200:
 *         description: List of wallets retrieved successfully
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
 *                         $ref: '#/components/schemas/Wallet'
 */
router.get('/', (req, res) => {
  // Bearer token may be provided but is not required or validated (dummy implementation)
  // In a real implementation, we would validate the token and get the user ID
  // For this dummy implementation, we just return all wallets
  const wallets = getWallets();

  // Mask card numbers in response
  const maskedWallets = wallets.map(wallet => ({
    ...wallet,
    cardNumber: wallet.cardNumber ? wallet.cardNumber.replace(/\d(?=\d{4})/g, '*') : null
  }));

  res.json({
    status: 'success',
    data: maskedWallets,
    count: maskedWallets.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/wallets/check-exists:
 *   get:
 *     summary: Checker endpoint - Verify if wallet exists
 *     description: Returns true/false indicating if the user has at least one wallet. Used for workflow conditional logic. Bearer token may be provided but is not required (dummy implementation).
 *     tags: [Chango]
 *     parameters:
 *       - in: query
 *         name: result
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Optional. Set to true/false (as string) to force the checker response. Defaults to checking if wallets exist if not provided.
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/check-exists', (req, res) => {
  const { result } = req.query;

  // Check if result is forced
  const forced = getForcedBoolean(result);
  
  let finalResult;
  if (forced !== null) {
    // Use forced value
    finalResult = forced;
  } else {
    // Check if wallets exist (dummy implementation - checks if any wallets exist)
    // In real implementation, would check wallets for the authenticated user
    const wallets = getWallets();
    finalResult = wallets.length > 0;
  }

  res.json({
    value: finalResult,
    message: finalResult
      ? 'Wallet exists'
      : 'No wallet found',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

