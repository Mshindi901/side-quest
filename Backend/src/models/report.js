import sequelize from "../database/config.js";
import { DataTypes } from "sequelize";

const Report = sequelize.define('reports', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    batchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    totalRevenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    totalExpenses: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    netProfit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {timestamps: true});

export default Report;