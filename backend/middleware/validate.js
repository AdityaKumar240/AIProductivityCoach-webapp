// middleware/validate.js — Lightweight request body validators

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name?.trim())
    return res.status(400).json({ success: false, message: 'Name is required' });
  if (!email?.trim())
    return res.status(400).json({ success: false, message: 'Email is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  if (!password || password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  next();
};

const validateTask = (req, res, next) => {
  const { title } = req.body;
  if (!title?.trim())
    return res.status(400).json({ success: false, message: 'Task title is required' });
  next();
};

const validateHabit = (req, res, next) => {
  const { name } = req.body;
  if (!name?.trim())
    return res.status(400).json({ success: false, message: 'Habit name is required' });
  next();
};

module.exports = { validateRegister, validateLogin, validateTask, validateHabit };
