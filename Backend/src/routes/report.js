import express from "express";
import { getReport, downloadReportPdf } from "../controllers/report.js";

const router = express.Router();

router.get('/', getReport);
router.get('/pdf', downloadReportPdf);

export default router;