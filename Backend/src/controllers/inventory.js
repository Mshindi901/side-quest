import Inventory from "../models/inventory.js";

export const newInventoryItem = async(req, res) => {
    try {
        const { name, amount } = req.body;
        if (!name || amount === undefined || amount === null || isNaN(Number(amount))) {
            return res.status(400).json({ success: false, message: 'Provide all info' });
        }
        const createdInventory = await Inventory.create({
            name,
            amount
        });
        return res.status(201).json({ success: true, message: 'Inventory item created', data: createdInventory });
    } catch (error) {
        console.error(`Error with creating inventory item ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server error' });
    }
};

export const getAllInventory = async(req, res) => {
    try {
        const allInventory = await Inventory.findAll();
        if (!allInventory) {
            return res.status(404).json({ success: false, message: 'No Inventory items yet or Failed to fetch' });
        }
        return res.status(200).json({ success: true, message: 'Fetched Inventory items', data: allInventory });
    } catch (error) {
        console.error(`Error with getting all inventory items ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getInventoryItem = async(req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Provide valid ID' });
        }
        const inventoryItem = await Inventory.findByPk(id);
        if (!inventoryItem) {
            return res.status(404).json({ success: false, message: 'failed to fetch' });
        }
        return res.status(200).json({ success: true, message: 'Fetched Inventory item', data: inventoryItem });
    } catch (error) {
        console.error(`Error with getting inventory item ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateInventoryItem = async(req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Provide valid ID' });
        }
        const { name, amount } = req.body;
        if (!name || amount === undefined || amount === null || isNaN(Number(amount))) {
            return res.status(400).json({ success: false, message: 'Provide all info' });
        }
        const inventoryItem = await Inventory.findByPk(id);
        if (!inventoryItem) {
            return res.status(404).json({ success: false, message: 'failed to fetch' });
        }
        const updatedInventory = await inventoryItem.update({
            name,
            amount
        });
        return res.status(200).json({ success: true, message: 'Inventory item updated', data: updatedInventory });
    } catch (error) {
        console.error(`Error with updating inventory item ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteInventoryItem = async(req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Provide valid ID' });
        }
        const inventoryItem = await Inventory.findByPk(id);
        if (!inventoryItem) {
            return res.status(404).json({ success: false, message: 'failed to fetch' });
        }
        await inventoryItem.destroy();
        return res.status(200).json({ success: true, message: 'Inventory item deleted' });
    } catch (error) {
        console.error(`Error with deleting inventory item ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

