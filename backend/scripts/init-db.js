import { initDb } from '../config/initDb.js';

try {
  await initDb();
  console.log('Banco MySQL inicializado com sucesso para o PrivyChat.');
} catch (error) {
  console.error('Nao foi possivel inicializar o banco MySQL.');
  console.error(error.message);
  process.exit(1);
}
