import dotenv from 'dotenv';
import connectDB from './db/config.js';

// env variables
dotenv.config({ path: './.env' });

// port
const PORT = process.env.PORT || 8000;

// connect to db
connectDB()
  .then(() => {
    // start listening for requests
    app.listen(PORT, () => {
      console.log(`[SERVER_SUCCESS] | Running on port ${PORT}`)
    });
  })
  .catch((err) => {
    console.error(err)
  })
