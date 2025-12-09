import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const execAsync = promisify(exec);

async function startBackend() {
  console.log('Building React frontend...');
  
  try {
    await execAsync('npm run build', { cwd: projectRoot });
    console.log('Frontend built successfully!');
  } catch (error) {
    console.error('Frontend build failed:', error);
    console.error('Aborting startup due to build failure.');
    process.exit(1);
  }

  console.log('Starting Python FastAPI backend...');
  
  const python = spawn('uvicorn', [
    'backend.main:app',
    '--host', '0.0.0.0',
    '--port', '5000',
    '--reload'
  ], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env }
  });

  python.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
    process.exit(1);
  });

  python.on('close', (code) => {
    console.log(`Python backend exited with code ${code}`);
    process.exit(code || 0);
  });

  process.on('SIGTERM', () => {
    python.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    python.kill('SIGINT');
  });
}

startBackend().catch(console.error);
