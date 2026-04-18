// routes/taskRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getTasks, getTask, createTask, updateTask, completeTask, deleteTask
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');

// All task routes are protected — JWT required
router.get('/',                 auth, getTasks);
router.get('/:id',              auth, getTask);
router.post('/',                auth, validateTask, createTask);
router.put('/:id',              auth, updateTask);          // edit fields
router.patch('/:id/complete',   auth, completeTask);        // toggle done/undone
router.delete('/:id',           auth, deleteTask);

module.exports = router;
