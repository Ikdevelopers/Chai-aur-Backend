import mongoose from 'mongoose';
import { DB_NAME } from '../constant';

export const connecDb = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};