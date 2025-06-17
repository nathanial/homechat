import 'dotenv/config';
import { createServer } from './server.js';
import { initializeDatabase } from './database/init.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    const server = await createServer();
    
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();