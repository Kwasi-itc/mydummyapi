import express from 'express';
import {
  getUserByEmail,
  getUserByPhone,
  addUser,
  updateUser,
  createOTPVerification,
  verifyOTP
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /chango/auth/signup:
 *   post:
 *     summary: Create a new user account and send OTP
 *     description: Register a new user with email, phone number, and password. An OTP will be sent to the phone number. For dummy implementation, the OTP is returned in the response.
 *     tags: [Chango]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phoneNumber
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+233241234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: "SecurePassword123!"
 *     responses:
 *       201:
 *         description: Account created and OTP sent (OTP included in response for dummy implementation)
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
 *                         userId:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                         otp:
 *                           type: string
 *                           description: OTP code (only returned in dummy implementation)
 *       400:
 *         description: Missing required fields or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/signup', (req, res) => {
  const { email, phoneNumber, password } = req.body;

  // Validate required fields
  const requiredFields = {
    email,
    phoneNumber,
    password
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

  // Validate password (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({
      status: 'error',
      message: 'Password must be at least 6 characters long',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Check if user already exists
  if (getUserByEmail(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this email already exists',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (getUserByPhone(phoneNumber)) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this phone number already exists',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Create user (in real implementation, password would be hashed)
  const user = addUser({
    email,
    phoneNumber,
    password // In production, this should be hashed
  });

  // Generate and store OTP
  const otpVerification = createOTPVerification(phoneNumber, email);

  // In dummy implementation, return OTP in response
  // In production, OTP would be sent via SMS and not returned
  res.status(201).json({
    status: 'success',
    data: {
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      status: user.status,
      otp: otpVerification.otp, // Only in dummy implementation
      message: 'Account created. OTP sent to phone number. (In dummy implementation, OTP is included in response)'
    },
    message: 'Account created successfully. Please verify your phone number with the OTP.',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and activate account
 *     description: Verify the OTP sent to the user's phone number and activate the account.
 *     tags: [Chango]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phoneNumber
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+233241234567"
 *               otp:
 *                 type: string
 *                 description: OTP code received via SMS
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified and account activated
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
 *                         userId:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *       400:
 *         description: Invalid OTP or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-otp', (req, res) => {
  const { email, phoneNumber, otp } = req.body;

  // Validate required fields
  const requiredFields = {
    email,
    phoneNumber,
    otp
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

  // Find user
  const user = getUserByEmail(email);
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Verify phone number matches
  if (user.phoneNumber !== phoneNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone number does not match user record',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Verify OTP
  const verificationResult = verifyOTP(phoneNumber, email, otp);

  if (!verificationResult.valid) {
    return res.status(400).json({
      status: 'error',
      message: verificationResult.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Activate user account
  const updatedUser = updateUser(user.id, {
    status: 'active',
    verifiedAt: new Date().toISOString()
  });

  res.json({
    status: 'success',
    data: {
      userId: updatedUser.id,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      status: updatedUser.status,
      verifiedAt: updatedUser.verifiedAt
    },
    message: 'OTP verified successfully. Account activated.',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

