import mysql from 'mysql2/promise';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '$app/env/private';

export const db = mysql.createPool({
	host: DB_HOST,
	port: DB_PORT,
	user: DB_USER,
	password: DB_PASSWORD,
	database: DB_NAME,
	connectionLimit: 10
});
