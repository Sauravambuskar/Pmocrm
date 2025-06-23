const mysql = require('mysql2/promise');

let connection = null;

async function getConnection() {
  if (connection) {
    return connection;
  }

  try {
    // Use DATABASE_URL if available (for cloud databases)
    if (process.env.DATABASE_URL) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      // Use individual environment variables
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    }

    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

async function query(sql, params = []) {
  const conn = await getConnection();
  try {
    const [results] = await conn.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

module.exports = {
  getConnection,
  query,
  closeConnection
}; 