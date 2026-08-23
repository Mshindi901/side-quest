import express from "express";
import { createBatch, getAllBatches, getBatch, updateBatch, updateBatchStatus, deleteBatch } from "../controllers/batch.js";

const router = express.Router();

router.post('/', createBatch);
router.get('/', getAllBatches);
router.get('/:id', getBatch);
router.patch('/:id/status', updateBatchStatus);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

export default router;