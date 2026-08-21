import dns from 'node:dns';
import { connectDb } from './db/index.js';
import app from './app.js';
const PORT = process.env.PORT || 8000;
import dotenv from 'dotenv';

dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config({
  path: './env'
});

/*Method 1 --to connect*/
  await connectDb()
  .then(() => {
    app.on('Error', (error) => {
    console.log('Error found in connection of Db: ', error);
    throw new error;
   });
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

