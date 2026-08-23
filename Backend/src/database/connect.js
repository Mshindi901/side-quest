import sequelize from "./config.js";
import Batch from "../models/batch.js";
import Expenses from "../models/expenses.js";
import Revenue from "../models/revenue.js";
import Report from "../models/report.js";
import { randomUUID } from "node:crypto";

Batch.hasMany(Expenses, { foreignKey: 'batchId', onDelete: 'CASCADE' });
Expenses.belongsTo(Batch, { foreignKey: 'batchId' });
Batch.hasMany(Revenue, { foreignKey: 'batchId', onDelete: 'CASCADE' });
Revenue.belongsTo(Batch, { foreignKey: 'batchId' });
Batch.hasMany(Report, { foreignKey: 'batchId', onDelete: 'SET NULL' });
Report.belongsTo(Batch, { foreignKey: 'batchId' });

const connectDB = async() => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established');

        // Backfill records created before batch ownership was introduced.
        await Batch.sync({ alter: true });
        const [legacyBatch] = await sequelize.query(
            `SELECT "id" FROM "batches" WHERE "name" = 'Legacy records' LIMIT 1`
        );
        const legacyBatchId = legacyBatch[0]?.id || randomUUID();
        if (!legacyBatch[0]) {
            await sequelize.query(
                `INSERT INTO "batches" ("id", "name", "startDate", "status", "createdAt", "updatedAt") VALUES (:id, 'Legacy records', CURRENT_DATE, 'active', NOW(), NOW())`,
                { replacements: { id: legacyBatchId } }
            );
        }

        for (const table of ['revenues', 'expenses']) {
            const [columns] = await sequelize.query(
                `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = 'batchId'`,
                { replacements: { table } }
            );
            if (columns.length === 0) {
                await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "batchId" UUID`);
            }
            await sequelize.query(
                `UPDATE "${table}" SET "batchId" = :batchId WHERE "batchId" IS NULL`,
                { replacements: { batchId: legacyBatchId } }
            );
            await sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN "batchId" SET NOT NULL`);
        }

        await sequelize.sync({alter: true});
        console.log('Models synchronized successfully')
    } catch (error) {
        console.error(`Failed to connect to Database ${error}`);
        return;
    }
};

export default connectDB;