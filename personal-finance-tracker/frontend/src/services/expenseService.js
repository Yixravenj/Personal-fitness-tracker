import api from './api';

const expenseService = {
  // Get all expenses with filtering
  getExpenses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/expenses?${queryString}`);
    return response.data;
  },

  // Get single expense
  getExpense: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create new expense
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Update expense
  updateExpense: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  // Get category summary
  getCategorySummary: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/expenses/categories/summary?${queryString}`);
    return response.data;
  }
};

export default expenseService;