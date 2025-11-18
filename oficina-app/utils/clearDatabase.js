// Script para limpar todas as coleções do banco MongoDB
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/oficina';

async function clearDatabase() {
  await mongoose.connect(MONGO_URL);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    if (col.name === 'usuarios') {
      console.log('Coleção preservada: usuarios');
      continue;
    }
    await mongoose.connection.db.collection(col.name).deleteMany({});
    console.log(`Coleção limpa: ${col.name}`);
  }
  await mongoose.disconnect();
  console.log('Base de dados limpa com sucesso!');
}

clearDatabase().catch(err => {
  console.error('Erro ao limpar base de dados:', err);
  process.exit(1);
});
