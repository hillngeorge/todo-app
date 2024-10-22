const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose'); // Only keep this declaration once at the top

dotenv.config();

// Middleware for token verification
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Get all tasks for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Create a new task for the logged-in user
router.post('/', auth, async (req, res) => {
  const { title, category } = req.body;

  try {
    const newTask = new Task({ user: req.user, title, category });
    const task = await newTask.save();
    res.json(task);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Update an existing task
router.put('/:id', auth, async (req, res) => {
  const { title, category, completed } = req.body;

  const taskFields = {};
  if (title) taskFields.title = title;
  if (category) taskFields.category = category;
  if (completed !== undefined) taskFields.completed = completed;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ msg: 'Task not found' });

    if (task.user.toString() !== req.user) return res.status(401).json({ msg: 'Not authorized' });

    task = await Task.findByIdAndUpdate(req.params.id, { $set: taskFields }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, async (req, res) => {
    try {
      // Check if the ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid task ID' });
      }
  
      let task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ msg: 'Task not found' });
      }
  
      if (task.user.toString() !== req.user) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
  
      await Task.findByIdAndDelete(req.params.id);  // Replaced with findByIdAndDelete
      res.json({ msg: 'Task removed' });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).send('Server error');
    }
});

  
module.exports = router;
