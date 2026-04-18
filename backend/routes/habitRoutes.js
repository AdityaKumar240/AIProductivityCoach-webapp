// routes/habitRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getHabits, getHabit, createHabit, updateHabit, checkInHabit, deleteHabit
} = require('../controllers/habitController');
const auth = require('../middleware/auth');
const { validateHabit } = require('../middleware/validate');

// All habit routes are protected — JWT required
router.get('/',                 auth, getHabits);
router.get('/:id',              auth, getHabit);
router.post('/',                auth, validateHabit, createHabit);
router.put('/:id',              auth, updateHabit);         // rename / recategorize
router.patch('/:id/checkin',    auth, checkInHabit);        // daily check-in
router.delete('/:id',           auth, deleteHabit);

module.exports = router;
