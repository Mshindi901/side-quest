import PDFDocument from "pdfkit";
import Batch from "../models/batch.js";
import Expenses from "../models/expenses.js";
import Revenue from "../models/revenue.js";
import Report from "../models/report.js";

const getReportData = async (batchId) => {
    const where = batchId ? { batchId } : {};
    const [revenues, expenses, selectedBatch] = await Promise.all([
        Revenue.findAll({ where, include: [{ model: Batch, attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] }),
        Expenses.findAll({ where, include: [{ model: Batch, attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] }),
        batchId ? Batch.findByPk(batchId, { attributes: ['id', 'name'] }) : null
    ]);
    const totalRevenue = revenues.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return { revenues, expenses, selectedBatch, totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
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
        const batchName = data.selectedBatch?.name || (req.query.batchId ? 'Selected Batch' : 'All Batches');
        const document = new PDFDocument({ margin: 48, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="poultry-report.pdf"');
        document.pipe(res);
        const contentLeft = document.page.margins.left;
        const pageWidth = document.page.width - document.page.margins.left - document.page.margins.right;
        const formatAmount = (amount) => `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
        const drawSection = (title, items, color) => {
            if (document.y > document.page.height - 150) document.addPage();
            document.x = contentLeft;
            document.moveDown(1).font('Helvetica-Bold').fontSize(14).fillColor(color).text(title);
            document.moveDown(0.35).fillColor('#e5e7eb').rect(contentLeft, document.y, pageWidth, 1).fill();
            document.moveDown(0.45);
            if (items.length === 0) {
                document.font('Helvetica').fontSize(10).fillColor('#6b7280').text('No records for this batch.');
                return;
            }
            items.forEach((item) => {
                if (document.y > document.page.height - 70) document.addPage();
                const rowY = document.y;
                document.fillColor('#f8fafc').roundedRect(contentLeft, rowY - 3, pageWidth, 22, 3).fill();
                document.fillColor('#111827').font('Helvetica').fontSize(10).text(item.name, contentLeft + 8, rowY + 3, { width: pageWidth - 150, lineBreak: false });
                document.fillColor(color).font('Helvetica-Bold').text(formatAmount(item.amount), contentLeft + pageWidth - 140, rowY + 3, { width: 132, align: 'right', lineBreak: false });
                document.y = rowY + 27;
            });
        };

        document.x = contentLeft;
        document.fillColor('#166534').font('Helvetica-Bold').fontSize(24).text(`Report for ${batchName}`, contentLeft);
        document.moveDown(0.35).fillColor('#4b5563').font('Helvetica').fontSize(10).text('Poultry Farm Financial Summary');
        document.moveDown(0.2).text(`Generated ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}`);
        document.moveDown(1).fillColor('#166534').roundedRect(document.x, document.y, pageWidth, 5, 2).fill();
        document.moveDown(1.1);

        const cardWidth = (pageWidth - 20) / 3;
        const cardY = document.y;
        [
            ['Total Revenue', data.totalRevenue, '#15803d'],
            ['Total Expenses', data.totalExpenses, '#dc2626'],
            ['Profit / Loss', data.netProfit, data.netProfit >= 0 ? '#15803d' : '#dc2626']
        ].forEach(([label, amount, color], index) => {
            const cardX = contentLeft + index * (cardWidth + 10);
            document.fillColor('#f8fafc').roundedRect(cardX, cardY, cardWidth, 58, 6).fill();
            document.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), cardX + 10, cardY + 11, { width: cardWidth - 20 });
            document.fillColor(color).font('Helvetica-Bold').fontSize(14).text(formatAmount(amount), cardX + 10, cardY + 30, { width: cardWidth - 20 });
        });
        document.y = cardY + 75;
        drawSection('Revenue', data.revenues, '#15803d');
        drawSection('Expenses', data.expenses, '#dc2626');
        document.end();
    } catch (error) {
        console.error(`Error downloading report ${error}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};