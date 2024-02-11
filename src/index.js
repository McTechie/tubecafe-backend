import dotenv from 'dotenv';
import connectDB from './db/config.js';


dotenv.config({
  path: './.env'
});

connectDB();
