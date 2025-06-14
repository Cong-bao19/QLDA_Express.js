const mysql = require("mysql2");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the pool object for querying the database
module.exports = pool.promise();
