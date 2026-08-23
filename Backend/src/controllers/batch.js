import Batch from "../models/batch.js";

export const createBatch = async (req, res) => {
    try {
        const { name, startDate, endDate, status } = req.body;
        if (!name || !startDate) {
            return res.status(400).json({ success: false, message: 'Name and startDate are required' });
        }
        const batch = await Batch.create({ name, startDate, endDate: endDate || null, status: status || 'active' });
        return res.status(201).json({ success: true, message: 'Batch created', data: batch });
    } catch (error) {
        console.error(`Error creating batch ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAllBatches = async (_req, res) => {
    try {
        const batches = await Batch.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json({ success: true, message: 'Fetched batches', data: batches });
    } catch (error) {
        console.error(`Error getting batches ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getBatch = async (req, res) => {
    try {
        const batch = await Batch.findByPk(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
        return res.status(200).json({ success: true, message: 'Fetched batch', data: batch });
    } catch (error) {
        console.error(`Error getting batch ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateBatch = async (req, res) => {
    try {
        const batch = await Batch.findByPk(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
        const { name, startDate, endDate, status } = req.body;
        if (!name || !startDate) return res.status(400).json({ success: false, message: 'Name and startDate are required' });
        await batch.update({ name, startDate, endDate: endDate || null, status: status || batch.status });
        return res.status(200).json({ success: true, message: 'Batch updated', data: batch });
    } catch (error) {
        console.error(`Error updating batch ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateBatchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be active or completed' });
        }
        const batch = await Batch.findByPk(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
        await batch.update({ status });
        return res.status(200).json({ success: true, message: 'Batch status updated', data: batch });
    } catch (error) {
        console.error(`Error updating batch status ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteBatch = async (req, res) => {
    try {
        const batch = await Batch.findByPk(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
        await batch.destroy();
        return res.status(200).json({ success: true, message: 'Batch deleted' });
    } catch (error) {
        console.error(`Error deleting batch ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};