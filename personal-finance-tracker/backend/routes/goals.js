const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/goals
// @desc    Get all goals for user
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['Active', 'Completed', 'Paused', 'Cancelled']).withMessage('Invalid status'),
  query('category').optional().isString().withMessage('Category must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, category } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;

    const goals = await Goal.find(filter)
      .sort({ priority: -1, targetDate: 1, createdAt: -1 });

    // Calculate additional statistics
    const totalGoals = goals.length;
    const activeGoals = goals.filter(goal => goal.status === 'Active').length;
    const completedGoals = goals.filter(goal => goal.status === 'Completed').length;
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    res.json({
      goals,
      statistics: {
        totalGoals,
        activeGoals,
        completedGoals,
        totalTargetAmount,
        totalCurrentAmount,
        overallProgress: totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0
      }
    });

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error while fetching goals' });
  }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(goal);

  } catch (error) {
    console.error('Get goal error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    res.status(500).json({ message: 'Server error while fetching goal' });
  }
});

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('targetAmount').isFloat({ min: 0.01 }).withMessage('Target amount must be greater than 0'),
  body('targetDate').isISO8601().withMessage('Target date must be a valid date'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('currentAmount').optional().isFloat({ min: 0 }).withMessage('Current amount cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if target date is in the future
    const targetDate = new Date(req.body.targetDate);
    if (targetDate <= new Date()) {
      return res.status(400).json({ message: 'Target date must be in the future' });
    }

    const goalData = {
      ...req.body,
      user: req.user._id
    };

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });

  } catch (error) {
    console.error('Create goal error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ message: 'Server error while creating goal' });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('targetAmount').optional().isFloat({ min: 0.01 }).withMessage('Target amount must be greater than 0'),
  body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('status').optional().isIn(['Active', 'Completed', 'Paused', 'Cancelled']).withMessage('Invalid status'),
  body('currentAmount').optional().isFloat({ min: 0 }).withMessage('Current amount cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check if target date is in the future (if being updated)
    if (req.body.targetDate) {
      const targetDate = new Date(req.body.targetDate);
      if (targetDate <= new Date()) {
        return res.status(400).json({ message: 'Target date must be in the future' });
      }
    }

    // Update goal with new data
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        goal[key] = req.body[key];
      }
    });

    // Auto-update status based on progress
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'Active') {
      goal.status = 'Completed';
    }

    await goal.save();

    res.json({
      message: 'Goal updated successfully',
      goal
    });

  } catch (error) {
    console.error('Update goal error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ message: 'Server error while updating goal' });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await Goal.deleteOne({ _id: req.params.id });

    res.json({ message: 'Goal deleted successfully' });

  } catch (error) {
    console.error('Delete goal error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    res.status(500).json({ message: 'Server error while deleting goal' });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to goal
// @access  Private
router.post('/:id/contribute', [
  auth,
  body('amount').isFloat({ min: 0.01 }).withMessage('Contribution amount must be greater than 0'),
  body('note').optional().isLength({ max: 200 }).withMessage('Note cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.status !== 'Active') {
      return res.status(400).json({ message: 'Cannot contribute to inactive goal' });
    }

    const { amount, note } = req.body;
    
    // Add contribution using the model method
    await goal.addContribution(amount, note || '');

    res.json({
      message: 'Contribution added successfully',
      goal
    });

  } catch (error) {
    console.error('Add contribution error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    res.status(500).json({ message: 'Server error while adding contribution' });
  }
});

// @route   GET /api/goals/:id/contributions
// @desc    Get goal contributions history
// @access  Private
router.get('/:id/contributions', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Sort contributions by date (most recent first)
    const contributions = goal.contributions.sort((a, b) => b.date - a.date);

    res.json({
      contributions,
      totalContributions: contributions.length,
      totalAmount: contributions.reduce((sum, contrib) => sum + contrib.amount, 0)
    });

  } catch (error) {
    console.error('Get contributions error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    res.status(500).json({ message: 'Server error while fetching contributions' });
  }
});

// @route   PUT /api/goals/:id/status
// @desc    Update goal status
// @access  Private
router.put('/:id/status', [
  auth,
  body('status').isIn(['Active', 'Completed', 'Paused', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.status = req.body.status;
    await goal.save();

    res.json({
      message: 'Goal status updated successfully',
      goal
    });

  } catch (error) {
    console.error('Update goal status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    res.status(500).json({ message: 'Server error while updating goal status' });
  }
});

module.exports = router;