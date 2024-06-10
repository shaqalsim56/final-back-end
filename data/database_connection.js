//Import NPM Packages- mysql for database connections
//dotenv -- loading environment variables from a '.env' file
import mysql from 'mysql2'
import dotenv from 'dotenv'

//loading the enviroment variables from 'config.env' file
dotenv.config({path: './config.env'});


//using mysql.createPool to make a connection to the database
export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
}).promise();



