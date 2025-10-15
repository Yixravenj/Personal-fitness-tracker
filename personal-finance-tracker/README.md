# Personal Finance Tracker

A comprehensive web application built with the MERN stack to help users manage their expenses, set savings goals, and track their financial progress.

## Features

### 🏦 Expense Management
- Add, edit, and delete expenses
- Categorize expenses (Food, Transportation, Entertainment, etc.)
- Support for different payment methods
- Upload receipts
- Recurring expense tracking
- Advanced filtering and search

### 💰 Savings Goals
- Create and track savings goals
- Set target amounts and dates
- Add contributions to goals
- Progress visualization
- Goal categories and priorities
- Auto-contribution settings

### 📊 Reports and Analytics
- Interactive dashboard with key metrics
- Spending trends and patterns
- Category-wise expense breakdown
- Monthly/yearly reports
- Budget analysis and alerts
- Goal progress tracking

### 👤 User Management
- Secure authentication (JWT)
- User profiles with preferences
- Multiple currency support
- Monthly budget settings
- Password management

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **cors** for cross-origin resource sharing

### Frontend
- **React** with functional components and hooks
- **React Router** for navigation
- **Axios** for API calls
- **Recharts** for data visualization
- **React Toastify** for notifications
- **React DatePicker** for date inputs
- **React Modal** for modals

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/personal-finance-tracker
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running on your system:
   ```bash
   # On macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # On Windows, start MongoDB service
   # On Linux
   sudo systemctl start mongod
   ```

5. **Start the backend server:**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

   The backend server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration (Optional):**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server:**
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Expenses
- `GET /api/expenses` - Get user expenses (with filtering)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/categories/summary` - Get category summary

### Goals
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get single goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contribute` - Add contribution to goal
- `GET /api/goals/:id/contributions` - Get goal contributions
- `PUT /api/goals/:id/status` - Update goal status

### Dashboard/Reports
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/spending-trends` - Spending trends
- `GET /api/dashboard/category-analysis` - Category analysis
- `GET /api/dashboard/goals-progress` - Goals progress
- `GET /api/dashboard/monthly-report` - Monthly report

## Application Structure

```
personal-finance-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   └── Goal.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── goals.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Usage

1. **Register/Login:**
   - Create a new account or login with existing credentials
   - Set your preferred currency and monthly budget

2. **Add Expenses:**
   - Click "Add Expense" to record new expenses
   - Choose categories, payment methods, and add descriptions
   - Upload receipts if needed

3. **Create Savings Goals:**
   - Set savings targets with specific amounts and deadlines
   - Add contributions regularly
   - Track progress with visual indicators

4. **View Reports:**
   - Monitor spending patterns in the dashboard
   - Analyze expenses by categories and time periods
   - Generate monthly reports

5. **Manage Profile:**
   - Update personal information
   - Change currency preferences
   - Set monthly budgets

## Features in Detail

### Expense Categories
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Groceries
- Housing
- Insurance
- Gifts & Donations
- Personal Care
- Business
- Other

### Goal Categories
- Emergency Fund
- Vacation
- Car
- House
- Education
- Retirement
- Wedding
- Medical
- Business
- Electronics
- Other

### Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- INR (Indian Rupee)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Error handling and logging

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# The build files will be in the build/ directory
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/personal-finance-tracker
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
