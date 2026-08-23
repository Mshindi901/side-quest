import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/database/connect.js';
import path from 'path';
import { fileURLToPath } from 'url';
import expenseRoutes from './src/routes/expenses.js';
import revenueRoutes from './src/routes/revenue.js';
import inventoryRoutes from './src/routes/inventory.js';
import batchRoutes from './src/routes/batch.js';
import reportRoutes from './src/routes/report.js';

import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.join(__dirname, '../frontend/dist');
const frontendSrc = path.join(__dirname, '../frontend');
const frontendPath = fs.existsSync(frontendDist) ? frontendDist : frontendSrc;

const PORT = process.env.PORT || 4000;
const app = express();

app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Poultry Report API is running' });
});

// API Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/revenues', revenueRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventories', inventoryRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/reports', reportRoutes);

// Fallback middleware: serves index.html for frontend routes, 404 for API
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is up and running on port ${PORT}`);
});

