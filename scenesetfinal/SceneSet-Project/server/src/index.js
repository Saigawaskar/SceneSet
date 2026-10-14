require('dotenv').config();
const { createApp } = require('./app');
const { connectDatabase } = require('./config/db');

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set in server/.env and contain at least 32 characters.');
  }
  await connectDatabase();
  const app = createApp();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => console.log(`SceneSet API listening on http://localhost:${port}`));
  const shutdown = async () => {
    console.log('Shutting down SceneSet API...');
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  start().catch((error) => { console.error(error.message); process.exit(1); });
}

module.exports = { start };
