import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';

export const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        console.log(`\n Mongo Db connected. \nConnection host is: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error('DB connection error:', error);
        process.exit(1);
    }
};