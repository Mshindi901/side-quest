import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false
    })
    : new Sequelize(
        process.env.DB_NAME || 'poultry',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'yugah2005@',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
            dialect: 'postgres',
            logging: false
        }
    );

export default sequelize;