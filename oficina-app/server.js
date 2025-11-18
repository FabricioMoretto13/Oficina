require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de log para debug
app.use((req, res, next) => {
  if (req.path.includes('/usuarios/') && req.path.includes('/status')) {
    console.log('=== REQUEST DEBUG ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('==================');
  }
  next();
});

// serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/veiculos', require('./routes/veiculos'));
app.use('/api/os', require('./routes/os'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/lgpd', require('./routes/lgpd')); // Rotas LGPD

const PORT = process.env.PORT || 4000;

const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  let mongoUri = process.env.MONGODB_URI;
  // If no MONGODB_URI provided, use an in-memory MongoDB for development
  if (!mongoUri) {
    console.log('No MONGODB_URI found — starting in-memory MongoDB for development');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
  }

  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
