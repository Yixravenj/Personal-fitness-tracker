const express = require('express');
const { query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview with key metrics
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Current month dates
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Previous month dates
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month expenses
    const currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Previous month expenses for comparison
    const previousMonthExpenses = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Category breakdown for current month
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          percentage: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Calculate percentages for categories
    const totalMonthlyExpenses = currentMonthExpenses[0]?.totalAmount || 0;
    const categoriesWithPercentage = categoryBreakdown.map(cat => ({
      ...cat,
      percentage: totalMonthlyExpenses > 0 ? (cat.totalAmount / totalMonthlyExpenses) * 100 : 0
    }));

    // Goals overview
    const goalsOverview = await Goal.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalTarget: { $sum: '$targetAmount' },
          totalCurrent: { $sum: '$currentAmount' }
        }
      }
    ]);

    // Recent transactions
    const recentTransactions = await Expense.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title amount category date paymentMethod');

    // Calculate month-over-month change
    const currentTotal = currentMonthExpenses[0]?.totalAmount || 0;
    const previousTotal = previousMonthExpenses[0]?.totalAmount || 0;
    const monthOverMonthChange = previousTotal > 0 ? 
      ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    // Budget analysis
    const monthlyBudget = req.user.monthlyBudget || 0;
    const budgetUsed = monthlyBudget > 0 ? (currentTotal / monthlyBudget) * 100 : 0;
    const budgetRemaining = Math.max(monthlyBudget - currentTotal, 0);

    res.json({
      currentMonth: {
        totalExpenses: currentTotal,
        transactionCount: currentMonthExpenses[0]?.count || 0,
        averageTransaction: currentMonthExpenses[0]?.averageAmount || 0,
        monthOverMonthChange
      },
      budget: {
        monthlyBudget,
        budgetUsed,
        budgetRemaining,
        isOverBudget: budgetUsed > 100
      },
      categoryBreakdown: categoriesWithPercentage,
      goals: {
        active: goalsOverview.find(g => g._id === 'Active')?.count || 0,
        completed: goalsOverview.find(g => g._id === 'Completed')?.count || 0,
        totalTarget: goalsOverview.reduce((sum, g) => sum + g.totalTarget, 0),
        totalSaved: goalsOverview.reduce((sum, g) => sum + g.totalCurrent, 0)
      },
      recentTransactions
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/dashboard/spending-trends
// @desc    Get spending trends over time
// @access  Private
router.get('/spending-trends', [
  auth,
  query('period').optional().isIn(['7days', '30days', '90days', '1year']).withMessage('Invalid period'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy value')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { period = '30days', groupBy = 'day' } = req.query;
    const userId = req.user._id;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build aggregation pipeline based on groupBy
    let dateGrouping;
    switch (groupBy) {
      case 'day':
        dateGrouping = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'week':
        dateGrouping = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      case 'month':
        dateGrouping = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
      default:
        dateGrouping = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
    }

    const trends = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: dateGrouping,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    res.json({
      period,
      groupBy,
      trends,
      summary: {
        totalPeriods: trends.length,
        totalAmount: trends.reduce((sum, t) => sum + t.totalAmount, 0),
        averagePerPeriod: trends.length > 0 ? 
          trends.reduce((sum, t) => sum + t.totalAmount, 0) / trends.length : 0
      }
    });

  } catch (error) {
    console.error('Spending trends error:', error);
    res.status(500).json({ message: 'Server error while fetching spending trends' });
  }
});

// @route   GET /api/dashboard/category-analysis
// @desc    Get detailed category analysis
// @access  Private
router.get('/category-analysis', [
  auth,
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const now = new Date();
    const defaultStartDate = startDate ? new Date(startDate) : 
      new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = endDate ? new Date(endDate) : 
      new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const categoryAnalysis = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: defaultStartDate, $lte: defaultEndDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' },
          transactions: { $push: { title: '$title', amount: '$amount', date: '$date' } }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Calculate percentages and trends
    const totalSpent = categoryAnalysis.reduce((sum, cat) => sum + cat.totalAmount, 0);
    
    const categoriesWithAnalysis = categoryAnalysis.map(category => ({
      ...category,
      percentage: totalSpent > 0 ? (category.totalAmount / totalSpent) * 100 : 0,
      transactions: category.transactions.sort((a, b) => b.date - a.date).slice(0, 5) // Last 5 transactions
    }));

    // Monthly comparison for each category
    const previousPeriodStart = new Date(defaultStartDate);
    const previousPeriodEnd = new Date(defaultEndDate);
    const periodLength = defaultEndDate - defaultStartDate;
    
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodLength);

    const previousPeriodData = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Add comparison data
    const categoriesWithComparison = categoriesWithAnalysis.map(category => {
      const previousData = previousPeriodData.find(p => p._id === category._id);
      const previousAmount = previousData?.totalAmount || 0;
      const change = previousAmount > 0 ? 
        ((category.totalAmount - previousAmount) / previousAmount) * 100 : 0;

      return {
        ...category,
        previousPeriodAmount: previousAmount,
        changePercentage: change
      };
    });

    res.json({
      dateRange: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      },
      totalSpent,
      categoryCount: categoriesWithComparison.length,
      categories: categoriesWithComparison
    });

  } catch (error) {
    console.error('Category analysis error:', error);
    res.status(500).json({ message: 'Server error while fetching category analysis' });
  }
});

// @route   GET /api/dashboard/goals-progress
// @desc    Get goals progress and analytics
// @access  Private
router.get('/goals-progress', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const goals = await Goal.find({ user: userId });

    // Calculate overall statistics
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'Active');
    const completedGoals = goals.filter(g => g.status === 'Completed');
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);

    // Progress analysis
    const goalsByProgress = goals.map(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
      
      // Calculate time-based metrics
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      const daysTotal = Math.ceil((targetDate - goal.createdAt) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
      const daysPassed = daysTotal - daysRemaining;
      
      const timeProgress = daysTotal > 0 ? (daysPassed / daysTotal) * 100 : 0;
      const isOnTrack = progress >= timeProgress;
      
      // Calculate required monthly contribution to reach goal
      const monthsRemaining = Math.max(daysRemaining / 30, 0.1);
      const requiredMonthlyContribution = remainingAmount / monthsRemaining;

      return {
        ...goal.toObject(),
        progress,
        remainingAmount,
        daysRemaining,
        daysPassed,
        timeProgress,
        isOnTrack,
        requiredMonthlyContribution,
        contributionHistory: goal.contributions.sort((a, b) => b.date - a.date)
      };
    });

    // Goals by category
    const goalsByCategory = await Goal.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalTarget: { $sum: '$targetAmount' },
          totalCurrent: { $sum: '$currentAmount' },
          avgProgress: { 
            $avg: { 
              $cond: [
                { $gt: ['$targetAmount', 0] },
                { $multiply: [{ $divide: ['$currentAmount', '$targetAmount'] }, 100] },
                0
              ]
            }
          }
        }
      },
      { $sort: { totalTarget: -1 } }
    ]);

    res.json({
      overview: {
        totalGoals,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        totalTargetAmount,
        totalCurrentAmount,
        overallProgress: totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0
      },
      goals: goalsByProgress,
      categoryBreakdown: goalsByCategory,
      onTrackGoals: goalsByProgress.filter(g => g.isOnTrack && g.status === 'Active').length,
      behindGoals: goalsByProgress.filter(g => !g.isOnTrack && g.status === 'Active').length
    });

  } catch (error) {
    console.error('Goals progress error:', error);
    res.status(500).json({ message: 'Server error while fetching goals progress' });
  }
});

// @route   GET /api/dashboard/monthly-report
// @desc    Get comprehensive monthly report
// @access  Private
router.get('/monthly-report', [
  auth,
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Invalid year'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid month')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Daily breakdown
    const dailyBreakdown = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Payment method breakdown
    const paymentMethodBreakdown = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Top expenses
    const topExpenses = await Expense.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
      .sort({ amount: -1 })
      .limit(10)
      .select('title amount category date paymentMethod');

    const monthlyTotal = monthlyExpenses[0]?.totalAmount || 0;
    const monthlyBudget = req.user.monthlyBudget || 0;

    res.json({
      period: {
        year,
        month,
        startDate,
        endDate
      },
      summary: {
        totalExpenses: monthlyTotal,
        transactionCount: monthlyExpenses[0]?.count || 0,
        averageTransaction: monthlyExpenses[0]?.averageAmount || 0,
        monthlyBudget,
        budgetUsed: monthlyBudget > 0 ? (monthlyTotal / monthlyBudget) * 100 : 0,
        budgetRemaining: Math.max(monthlyBudget - monthlyTotal, 0),
        isOverBudget: monthlyBudget > 0 && monthlyTotal > monthlyBudget
      },
      dailyBreakdown,
      categoryBreakdown,
      paymentMethodBreakdown,
      topExpenses
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ message: 'Server error while generating monthly report' });
  }
});

module.exports = router;