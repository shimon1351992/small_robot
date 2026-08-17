const { spawn } = require('child_process');

console.log('⚡ Starting Local ESP32 Compilation & Flashing Server (Port 3001)...');
const serverProcess = spawn('node', ['server/server.js'], { stdio: 'inherit', shell: true });

console.log('🚀 Starting React Web Application Studio...');
const reactProcess = spawn('npx', ['react-scripts', 'start'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  serverProcess.kill();
  reactProcess.kill();
  process.exit();
});
