import Revenue from "../models/revenue.js";
import Batch from "../models/batch.js";
import { Op } from "sequelize";

export const newRevenue = async(req, res) => {
    try {
        const { name, amount, batchId } = req.body;
        if (!name || amount === undefined || amount === null || isNaN(Number(amount)) || !batchId) {
            return res.status(400).json({ success: false, message: 'Provide all info' });
        }
        if (!await Batch.findByPk(batchId)) return res.status(400).json({success: false, message: 'Valid batchId is required'});
        const createdRevenue = await Revenue.create({
            name,
            amount,
            batchId
        });
        return res.status(201).json({ success: true, message: 'Revenue created', data: createdRevenue });
    } catch (error) {
        console.error(`Error with creating a new revenue ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server error' });
    }
};

export const getAllRevenues = async(req, res) => {
    try {
        const { batchName } = req.query;
        const allRevenues = await Revenue.findAll({
            include: [{
                model: Batch,
                attributes: ['id', 'name'],
                ...(batchName ? { where: { name: { [Op.iLike]: `%${batchName}%` } } } : {})
            }],
            order: [['createdAt', 'DESC']]
        });
        if (!allRevenues) {
            return res.status(404).json({ success: false, message: 'No Revenues yet or Failed to fetch' });
        }
        return res.status(200).json({ success: true, message: 'Fetched Revenues', data: allRevenues });
    } catch (error) {
        console.error(`Error with getting all revenues ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getRevenue = async(req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Provide valid ID' });
        }
        const revenue = await Revenue.findByPk(id);
        if (!revenue) {
            return res.status(404).json({ success: false, message: 'failed to fetch' });
        }
        return res.status(200).json({ success: true, message: 'Fetched Revenue', data: revenue });
    } catch (error) {
        console.error(`Error with getting revenue ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateRevenue = async(req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Provide valid ID' });
        }
        const { name, amount, batchId } = req.body;
        if (!name || amount === undefined || amount === null || isNaN(Number(amount)) || !batchId) {
            return res.status(400).json({ success: false, message: 'Provide all info' });
        }
        if (!await Batch.findByPk(batchId)) return res.status(400).json({success: false, message: 'Valid batchId is required'});
        const revenue = await Revenue.findByPk(id);
        if (!revenue) {
            return res.status(404).json({ success: false, message: 'failed to fetch' });
        }
        const updatedRevenue = await revenue.update({
            name,
            amount,
            batchId
        });
        return res.status(200).json({ success: true, message: 'Revenue updated', data: updatedRevenue });
    } catch (error) {
        console.error(`Error with updating revenue ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteRevenue = async(req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Provide valid ID' });
        }
        const revenue = await Revenue.findByPk(id);
        if (!revenue) {
            return res.status(404).json({ success: false, message: 'failed to fetch' });
        }
        await revenue.destroy();
        return res.status(200).json({ success: true, message: 'Revenue deleted' });
    } catch (error) {
        console.error(`Error with deleting revenue ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};