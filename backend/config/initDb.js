import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { env } from './env.js';

export async function initDb() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true
    });
    const schema = await fs.readFile(path.join(process.cwd(), 'database', 'schema.sql'), 'utf8');
    await connection.query(schema);
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error(
        `Acesso negado ao MySQL para o usuario "${env.db.user}". Abra o MySQL Workbench, confirme usuario/senha da conexao e atualize backend/.env em DB_USER e DB_PASSWORD.`
      );
    }
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `MySQL nao esta aceitando conexoes em ${env.db.host}:${env.db.port}. Em producao, configure DB_HOST/DB_PORT com o host publico ou interno do seu banco MySQL gerenciado.`
      );
    }
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}
