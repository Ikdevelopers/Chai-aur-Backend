import express from 'express';
import { connectDb } from './db/index.js';
const app = express();
const PORT = process.env.PORT || 8000;
import dotenv from 'dotenv';
dotenv.config({
  path: './env'
});

/*Method 1 --to connect*/
  await connectDb()
  .then(() => {
    app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
  });
  })
  .catch((error) => {
    console.log('MongoDb connection failed.Erro is: ', error);
  });


  





/* Method 2 --to connect

import mongoose from 'mongoose';
import {DB_NAME} from './constant';

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
*/

