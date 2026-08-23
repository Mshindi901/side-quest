import express from "express";
import {
    newInventoryItem,
    getAllInventory,
    getInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} from "../controllers/inventory.js";

const router = express.Router();

router.post('/', newInventoryItem);
router.get('/', getAllInventory);
router.get('/:id', getInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;

