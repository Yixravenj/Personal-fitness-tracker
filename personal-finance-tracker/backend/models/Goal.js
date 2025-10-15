const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0.01, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Emergency Fund',
      'Vacation',
      'Car',
      'House',
      'Education',
      'Retirement',
      'Wedding',
      'Medical',
      'Business',
      'Electronics',
      'Other'
    ]
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Contribution amount must be greater than 0']
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters']
    }
  }],
  autoContribute: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      min: [0.01, 'Auto-contribute amount must be greater than 0']
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: function() { return this.autoContribute.enabled; }
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const timeDiff = this.targetDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Method to add contribution
goalSchema.methods.addContribution = function(amount, note = '') {
  this.contributions.push({ amount, note });
  this.currentAmount += amount;
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'Completed';
  }
  
  return this.save();
};

// Static method to get active goals
goalSchema.statics.getActiveGoals = function(userId) {
  return this.find({ user: userId, status: 'Active' }).sort({ priority: -1, targetDate: 1 });
};

// Static method to get goals by status
goalSchema.statics.getByStatus = function(userId, status) {
  return this.find({ user: userId, status }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Goal', goalSchema);