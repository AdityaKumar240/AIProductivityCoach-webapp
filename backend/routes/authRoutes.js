// routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { register, login, getMe, updateMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');

// Public
router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);

// Protected
router.get('/me',  auth, getMe);
router.put('/me',  auth, updateMe);

module.exports = router;
