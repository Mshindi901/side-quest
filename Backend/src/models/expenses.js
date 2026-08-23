import { DataTypes } from "sequelize";
import sequelize from "../database/config.js";

const Expenses = sequelize.define('expenses', {
    id: {
        type: DataTypes.UUID,
        defaultValue:  DataTypes.UUIDV4,
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
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    batchId: {
        type: DataTypes.UUID,
        references:{
            model: 'batches',
            key: 'id'
        },
        allowNull: false
    }
}, {timestamps: true});

export default Expenses;