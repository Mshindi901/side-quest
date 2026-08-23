import PDFDocument from "pdfkit";
import Batch from "../models/batch.js";
import Expenses from "../models/expenses.js";
import Revenue from "../models/revenue.js";
import Report from "../models/report.js";

const getReportData = async (batchId) => {
    const where = batchId ? { batchId } : {};
    const [revenues, expenses] = await Promise.all([
        Revenue.findAll({ where, include: [{ model: Batch, attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] }),
        Expenses.findAll({ where, include: [{ model: Batch, attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] })
    ]);
    const totalRevenue = revenues.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return { revenues, expenses, totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
};

export const getReport = async (req, res) => {
    try {
        const data = await getReportData(req.query.batchId);
        const report = await Report.create({ batchId: req.query.batchId || null, totalRevenue: data.totalRevenue, totalExpenses: data.totalExpenses, netProfit: data.netProfit });
        return res.status(200).json({ success: true, message: 'Report generated', data: { ...data, reportId: report.id } });
    } catch (error) {
        console.error(`Error generating report ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const downloadReportPdf = async (req, res) => {
    try {
        const data = await getReportData(req.query.batchId);
        const document = new PDFDocument({ margin: 48 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="poultry-report.pdf"');
        document.pipe(res);
        document.fontSize(20).text('Poultry Farm Financial Report');
        document.moveDown().fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
        document.moveDown().fontSize(14).text(`Total Revenue: KES ${data.totalRevenue.toFixed(2)}`);
        document.text(`Total Expenses: KES ${data.totalExpenses.toFixed(2)}`);
        document.text(`Net Profit: KES ${data.netProfit.toFixed(2)}`);
        document.moveDown().fontSize(14).text('Revenue');
        data.revenues.forEach((item) => document.fontSize(10).text(`${item.name} | ${item.Batch?.name || 'Unknown batch'} | KES ${Number(item.amount).toFixed(2)}`));
        document.moveDown().fontSize(14).text('Expenses');
        data.expenses.forEach((item) => document.fontSize(10).text(`${item.name} | ${item.Batch?.name || 'Unknown batch'} | KES ${Number(item.amount).toFixed(2)}`));
        document.end();
    } catch (error) {
        console.error(`Error downloading report ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};