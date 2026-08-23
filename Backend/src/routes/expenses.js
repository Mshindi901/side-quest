import express from "express";
import {
    newExpense,
    getAllExpenses,
    getExpense,
    updateExpense,
    deleteExpense
} from "../controllers/expenses.js";

const router = express.Router();

router.post('/', newExpense);
router.get('/', getAllExpenses);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;

