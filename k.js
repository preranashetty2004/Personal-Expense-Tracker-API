const express = require('express');
const nodeCron = require('node-cron');

const app = express();
app.use(express.json()); // Middleware to parse JSON

// In-memory storage for expenses
const expenses = [];

// Predefined expense categories
const allowedCategories = ["Food", "Travel", "Utilities", "Entertainment"];

// Welcome route
app.get('/', (req, res) => {
    res.send("Welcome to the Personal Expense Tracker API! Use /expenses or /expenses/analysis to interact with the API.");
});

// POST /expenses - Log a new expense
app.post('/expenses', (req, res) => {
    const { category, amount, date } = req.body;

    // Data validation
    if (!category || !amount || !date) {
        return res.status(400).json({ status: "error", data: null, error: "Missing required fields" });
    }
    if (!allowedCategories.includes(category)) {
        return res.status(400).json({ status: "error", data: null, error: "Invalid category" });
    }
    if (amount <= 0) {
        return res.status(400).json({ status: "error", data: null, error: "Amount must be positive" });
    }

    // Add expense
    const expense = { id: expenses.length + 1, category, amount, date };
    expenses.push(expense);
    res.status(201).json({ status: "success", data: expense, error: null });
});

// GET /expenses - Retrieve expenses
app.get('/expenses', (req, res) => {
    const { category, startDate, endDate } = req.query;

    let filteredExpenses = expenses;

    // Filter by category
    if (category) {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === category);
    }

    // Filter by date range
    if (startDate && endDate) {
        filteredExpenses = filteredExpenses.filter(exp => {
            const expenseDate = new Date(exp.date);
            return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
        });
    }

    res.status(200).json({ status: "success", data: filteredExpenses, error: null });
});

// GET /expenses/analysis - Analyze spending
app.get('/expenses/analysis', (req, res) => {
    const analysis = {};

    // Group by category
    allowedCategories.forEach(category => {
        const categoryExpenses = expenses.filter(exp => exp.category === category);
        const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        analysis[category] = total;
    });

    res.status(200).json({ status: "success", data: analysis, error: null });
});

// CRON job - Generate summary reports
nodeCron.schedule('0 0 * * *', () => {
    console.log("Daily summary:");
    generateSummary('daily');
});

nodeCron.schedule('0 0 * * 0', () => {
    console.log("Weekly summary:");
    generateSummary('weekly');
});

nodeCron.schedule('0 0 1 * *', () => {
    console.log("Monthly summary:");
    generateSummary('monthly');
});

// Generate summary function
function generateSummary(type) {
    const now = new Date();
    let startDate;

    if (type === 'daily') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
    } else if (type === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (type === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const filteredExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    console.log(`Generated ${type} summary: Total Expenses = $${total}`);
}

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
