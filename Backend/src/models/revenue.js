import sequelize from "../database/config.js";
import { DataTypes } from "sequelize";

const Revenue = sequelize.define('revenues', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    batchId: {
        type: DataTypes.UUID,
        references: {
            model: 'batches',
            key: 'id'
        },
        allowNull: false
    }
}, {timestamps: true});

export default Revenue;