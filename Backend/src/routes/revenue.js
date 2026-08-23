import express from "express";
import {
    newRevenue,
    getAllRevenues,
    getRevenue,
    updateRevenue,
    deleteRevenue
} from "../controllers/revenue.js";

const router = express.Router();

router.post('/', newRevenue);
router.get('/', getAllRevenues);
router.get('/:id', getRevenue);
router.put('/:id', updateRevenue);
router.delete('/:id', deleteRevenue);

export default router;

