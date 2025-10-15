import React from 'react';

const Expenses = () => {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Expenses Management</h1>
      <p>Track and manage your expenses here. This page will include:</p>
      <ul>
        <li>Add new expense form</li>
        <li>Expense list with filtering and search</li>
        <li>Edit and delete expenses</li>
        <li>Category organization</li>
        <li>Expense statistics</li>
      </ul>
    </div>
  );
};

export default Expenses;