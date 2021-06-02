const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Error 💥:', err.name, err.message);
  process.exit(1);
});

dotenv.config({
  path: './config.env',
});
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// Connecting to Database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log('Database connection established!')
  );

// console.log(app.get('env')); // These are global variables. This tells us in which environment we are currently in.
// console.log(process.env); // Lis of all environments set by Express
// console.log(process.env.NODE_ENV);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port} ...`);
});

process.on('unhandledRejection', err => {
  console.log('Error 💥:', err.name, err.message);
  server.close(() => process.exit(1));
});
