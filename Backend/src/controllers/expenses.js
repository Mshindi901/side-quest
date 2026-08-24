import Expenses from "../models/expenses.js";
import Batch from "../models/batch.js";
import { Op } from "sequelize";

export const newExpense = async(req, res) => {
    try {
        const {name, amount, type, batchId} = req.body;
        if(!name || amount === undefined || amount === null || isNaN(Number(amount)) || !type || !batchId){
            return res.status(400).json({success: false, message : 'Provide all info'});
        };
        if (!await Batch.findByPk(batchId)) return res.status(400).json({success: false, message: 'Valid batchId is required'});
        const createdExpense = await Expenses.create({
            name,
            amount,
            type,
            batchId
        });
        return res.status(201).json({success: true, message: 'Expense created', data: createdExpense});
    } catch (error) {
        console.error(`Error with creating a new expense ${error}`);
        return res.status(500).json({success: false, message: 'Internal Server error'});
    }
};

export const getAllExpenses = async(req, res) => {
    try {
        const { batchName } = req.query;
        const allExpenses = await Expenses.findAll({
            include: [{
                model: Batch,
                attributes: ['id', 'name'],
                ...(batchName ? { where: { name: { [Op.iLike]: `%${batchName}%` } } } : {})
            }],
            order: [['createdAt', 'DESC']]
        });
        if(!allExpenses){
            return res.status(404).json({success: false, message: 'No Expenses yet or Failed to fetch'});
        };
        return res.status(200).json({success: true, message: 'Fetched Expenses', data: allExpenses})
    } catch (error) {
        console.error(`Error with getting all expenses ${error}`);
        return res.status(500).json({success: false, message : 'Internal Server Error'});
    }
};

export const getExpense = async(req, res) => {
    try {
        const {id} = req.params;
        if(!id){
            return res.status(400).json({success: false, message: 'Provide valid ID'});
        };
        const expense = await Expenses.findByPk(id);
        if(!expense){
            return res.status(404).json({success: false, message: 'failed to fetch'});
        };
        return res.status(200).json({success: true, message: 'Fetched Expense', data: expense})
    } catch (error) {
        console.error(`Error with getting expense ${error}`);
        return res.status(500).json({success: false, message : 'Internal Server Error'});
    }
};

export const updateExpense = async(req, res) => {
    try {
        const {id} = req.params;
        if(!id){
            return res.status(400).json({success: false, message: 'Provide valid ID'});
        };
        const {name, amount, type, batchId} = req.body;
        if(!name || amount === undefined || amount === null || isNaN(Number(amount)) || !type || !batchId){
            return res.status(400).json({success: false, message : 'Provide all info'});
        };
        if (!await Batch.findByPk(batchId)) return res.status(400).json({success: false, message: 'Valid batchId is required'});
        const expense = await Expenses.findByPk(id);
        if(!expense){
            return res.status(404).json({success: false, message: 'failed to fetch'});
        };
        const updatedExpense = await expense.update({
            name,
            amount,
            type,
            batchId
        });
        return res.status(200).json({success: true, message: 'Expense updated', data: updatedExpense});
    } catch (error) {
        console.error(`Error with updating expense ${error}`);
        return res.status(500).json({success: false, message : 'Internal Server Error'});
    }
};

export const deleteExpense = async(req, res) => {
    try {
        const {id} = req.params;
        if(!id){
            return res.status(400).json({success: false, message: 'Provide valid ID'});
        };
        const expense = await Expenses.findByPk(id);
        if(!expense){
            return res.status(404).json({success: false, message: 'failed to fetch'});
        };
        await expense.destroy();
        return res.status(200).json({success: true, message: 'Expense deleted'})
    } catch (error) {
        console.error(`Error with deleting expense ${error}`);
        return res.status(500).json({success: false, message : 'Internal Server Error'});
    }
};