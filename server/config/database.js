const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🗄️ [DB_CONFIG] Initializing database configuration');

// Check if we're on Windows and use SQLite for compatibility
const isWindows = process.platform === 'win32';
const useSQLite = isWindows || process.env.USE_SQLITE === 'true';

if (useSQLite) {
  console.log('🪟 [DB_CONFIG] Windows detected - Using SQLite for compatibility');
  console.log('📝 [DB_CONFIG] SQLite database will be created in server/database.sqlite');
} else {
  console.log('📝 [DB_CONFIG] Environment variables:');
  console.log('   📊 Database:', process.env.SQL_DATABASE || 'ongc_auth_db');
  console.log('   👤 User:', process.env.SQL_USER || 'root');
  console.log('   🔐 Password:', process.env.SQL_PASSWORD ? '***configured***' : 'Not configured');
  console.log('   🌐 Host:', process.env.SQL_HOST || 'localhost');
  console.log('   🔌 Port:', process.env.SQL_PORT || 3306);
}

// Create connection string to handle special characters in password
const host = process.env.SQL_HOST || 'localhost';
const port = process.env.SQL_PORT || 3306;
const database = process.env.SQL_DATABASE || 'ongc_auth_db';
const user = process.env.SQL_USER || 'root';
const password = process.env.SQL_PASSWORD || '';

console.log('🔐 [DB_CONFIG] Creating connection string...');

// SQL Database Configuration using connection string
let sequelize;

if (useSQLite) {
  // Use SQLite for Windows compatibility
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './server/database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  // Use MySQL for production/Linux
  sequelize = new Sequelize(
    `mysql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`,
    {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
}

console.log('✅ [DB_CONFIG] Sequelize instance created');

// Test the connection
const testConnection = async () => {
  try {
    console.log('🔍 [DB_TEST] Testing database connection...');
    
    if (useSQLite) {
      console.log('📊 [DB_TEST] Using SQLite database');
    } else {
      console.log(`📊 [DB_TEST] Database: ${process.env.SQL_DATABASE || 'ongc_auth_db'}`);
      console.log(`👤 [DB_TEST] User: ${process.env.SQL_USER || 'root'}`);
      console.log(`🔐 [DB_TEST] Password: ${process.env.SQL_PASSWORD ? '***configured***' : 'Not configured'}`);
      console.log(`🌐 [DB_TEST] Host: ${process.env.SQL_HOST || 'localhost'}:${process.env.SQL_PORT || 3306}`);
    }
    
    console.log('🔌 [DB_TEST] Attempting to authenticate...');
    await sequelize.authenticate();
    console.log('✅ [DB_TEST] Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ [DB_TEST] Unable to connect to database:', error.message);
    if (useSQLite) {
      console.error('💡 [DB_TEST] SQLite should work automatically. Check file permissions.');
    } else {
      console.error('💡 [DB_TEST] Please ensure MySQL server is running and credentials are correct.');
    }
    return false;
  }
};

// Create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  try {
    if (useSQLite) {
      console.log('🗄️ [DB_CREATE] SQLite database will be created automatically');
      return true;
    }
    
    console.log('🗄️ [DB_CREATE] Checking if MySQL database exists...');
    
    // Connect without specifying database
    const tempSequelize = new Sequelize(
      `mysql://${user}:${encodeURIComponent(password)}@${host}:${port}`,
      {
        dialect: 'mysql',
        logging: false
      }
    );
    
    console.log('🔌 [DB_CREATE] Creating temporary connection...');
    
    // Create database if it doesn't exist
    const databaseName = process.env.SQL_DATABASE || 'ongc_auth_db';
    console.log(`📊 [DB_CREATE] Creating database: ${databaseName}`);
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    console.log(`✅ [DB_CREATE] Database '${databaseName}' is ready.`);
    
    await tempSequelize.close();
    console.log('🔌 [DB_CREATE] Temporary connection closed');
    return true;
  } catch (error) {
    console.error('❌ [DB_CREATE] Error creating database:', error.message);
    return false;
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    console.log('🔄 [DB_SYNC] Synchronizing database schema...');
    console.log('📝 [DB_SYNC] This will create tables if they don\'t exist');
    
    await sequelize.sync({ alter: true });
    console.log('✅ [DB_SYNC] SQL Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ [DB_SYNC] Error synchronizing SQL database:', error);
    return false;
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    console.log('📊 [DB_STATS] Getting database statistics...');
    const userCount = await sequelize.models.User?.count() || 0;
    console.log(`📊 [DB_STATS] Database Statistics:`);
    console.log(`   👥 Users: ${userCount}`);
    return { users: userCount };
  } catch (error) {
    console.error('❌ [DB_STATS] Error getting database stats:', error);
    return { users: 0 };
  }
};

module.exports = {
  sequelize,
  testConnection,
  createDatabaseIfNotExists,
  syncDatabase,
  getDatabaseStats
}; 