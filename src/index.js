import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import {DB_NAME} from './constant';

const app = express();
const PORT = process.env.PORT || 8000;
dotenv.config();

( async () => {
  try {
   await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
   app.on('Error', (error) => {
    console.log('Error: ', error);
    throw new error;
   });

   app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
   });

  } catch (error) {
    console.error('Error: ', error);
  }
})();


