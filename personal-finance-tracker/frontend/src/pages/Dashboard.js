import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import { toast } from 'react-toastify';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardService.getOverview();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading your financial dashboard...</p>
      </div>
    );
  }

  const {
    currentMonth,
    budget,
    categoryBreakdown,
    goals,
    recentTransactions
  } = dashboardData || {};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Here's an overview of your financial activity</p>
        </div>
        <div className="quick-actions">
          <Link to="/expenses" className="btn btn-primary">
            <i className="fas fa-plus"></i>
            Add Expense
          </Link>
          <Link to="/goals" className="btn btn-secondary">
            <i className="fas fa-bullseye"></i>
            New Goal
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Monthly Overview Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon expense">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="stat-content">
              <h3>This Month</h3>
              <p className="stat-value">{formatCurrency(currentMonth?.totalExpenses)}</p>
              <span className={`stat-change ${currentMonth?.monthOverMonthChange >= 0 ? 'positive' : 'negative'}`}>
                {currentMonth?.monthOverMonthChange >= 0 ? '+' : ''}
                {currentMonth?.monthOverMonthChange?.toFixed(1)}% from last month
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon budget">
              <i className="fas fa-chart-pie"></i>
            </div>
            <div className="stat-content">
              <h3>Budget</h3>
              <p className="stat-value">{budget?.budgetUsed?.toFixed(1)}%</p>
              <span className={`stat-change ${budget?.isOverBudget ? 'negative' : 'positive'}`}>
                {formatCurrency(budget?.budgetRemaining)} remaining
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon transactions">
              <i className="fas fa-list"></i>
            </div>
            <div className="stat-content">
              <h3>Transactions</h3>
              <p className="stat-value">{currentMonth?.transactionCount || 0}</p>
              <span className="stat-change neutral">
                Avg: {formatCurrency(currentMonth?.averageTransaction)}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon goals">
              <i className="fas fa-target"></i>
            </div>
            <div className="stat-content">
              <h3>Active Goals</h3>
              <p className="stat-value">{goals?.active || 0}</p>
              <span className="stat-change positive">
                {formatCurrency(goals?.totalSaved)} saved
              </span>
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        {budget?.monthlyBudget > 0 && (
          <div className="card budget-card">
            <div className="card-header">
              <h2 className="card-title">Monthly Budget</h2>
              <span className={`budget-status ${budget?.isOverBudget ? 'over' : 'under'}`}>
                {budget?.isOverBudget ? 'Over Budget' : 'On Track'}
              </span>
            </div>
            <div className="budget-progress">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${budget?.isOverBudget ? 'over-budget' : ''}`}
                  style={{ width: `${Math.min(budget?.budgetUsed || 0, 100)}%` }}
                ></div>
              </div>
              <div className="budget-details">
                <div className="budget-item">
                  <span>Spent</span>
                  <span>{formatCurrency(currentMonth?.totalExpenses)}</span>
                </div>
                <div className="budget-item">
                  <span>Budget</span>
                  <span>{formatCurrency(budget?.monthlyBudget)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="card category-card">
          <div className="card-header">
            <h2 className="card-title">Top Categories</h2>
            <Link to="/reports" className="view-all-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="category-list">
            {categoryBreakdown?.slice(0, 5).map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category._id}</span>
                  <span className="category-amount">{formatCurrency(category.totalAmount)}</span>
                </div>
                <div className="category-progress">
                  <div 
                    className="category-progress-fill"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <span className="category-percentage">{category.percentage?.toFixed(1)}%</span>
              </div>
            ))}
            {(!categoryBreakdown || categoryBreakdown.length === 0) && (
              <div className="empty-state">
                <i className="fas fa-chart-bar"></i>
                <p>No expenses recorded this month</p>
                <Link to="/expenses" className="btn btn-sm btn-primary">
                  Add your first expense
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card transactions-card">
          <div className="card-header">
            <h2 className="card-title">Recent Transactions</h2>
            <Link to="/expenses" className="view-all-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="transactions-list">
            {recentTransactions?.map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-category">
                  <div className="category-icon">
                    <i className={getCategoryIcon(transaction.category)}></i>
                  </div>
                  <div className="transaction-info">
                    <span className="transaction-title">{transaction.title}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                  </div>
                </div>
                <div className="transaction-amount">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
            {(!recentTransactions || recentTransactions.length === 0) && (
              <div className="empty-state">
                <i className="fas fa-receipt"></i>
                <p>No transactions yet</p>
                <Link to="/expenses" className="btn btn-sm btn-primary">
                  Add your first transaction
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Goals Overview */}
        <div className="card goals-card">
          <div className="card-header">
            <h2 className="card-title">Savings Goals</h2>
            <Link to="/goals" className="view-all-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="goals-summary">
            <div className="goals-stats">
              <div className="goal-stat">
                <span className="stat-number">{goals?.active || 0}</span>
                <span className="stat-label">Active Goals</span>
              </div>
              <div className="goal-stat">
                <span className="stat-number">{goals?.completed || 0}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="goal-stat">
                <span className="stat-number">{formatCurrency(goals?.totalSaved)}</span>
                <span className="stat-label">Total Saved</span>
              </div>
            </div>
            {goals?.active === 0 && (
              <div className="empty-state">
                <i className="fas fa-bullseye"></i>
                <p>No active savings goals</p>
                <Link to="/goals" className="btn btn-sm btn-primary">
                  Create your first goal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get category icons
const getCategoryIcon = (category) => {
  const iconMap = {
    'Food & Dining': 'fas fa-utensils',
    'Transportation': 'fas fa-car',
    'Shopping': 'fas fa-shopping-bag',
    'Entertainment': 'fas fa-film',
    'Bills & Utilities': 'fas fa-bolt',
    'Healthcare': 'fas fa-heartbeat',
    'Education': 'fas fa-graduation-cap',
    'Travel': 'fas fa-plane',
    'Groceries': 'fas fa-shopping-cart',
    'Housing': 'fas fa-home',
    'Insurance': 'fas fa-shield-alt',
    'Gifts & Donations': 'fas fa-gift',
    'Personal Care': 'fas fa-spa',
    'Business': 'fas fa-briefcase',
    'Other': 'fas fa-ellipsis-h'
  };
  return iconMap[category] || 'fas fa-circle';
};

export default Dashboard;