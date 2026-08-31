const net = require('net');

async function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function main() {
  const ports = [3000, 3001, 4000, 5000, 8000, 8080, 8081, 8082];
  for (const p of ports) {
    const open = await checkPort(p);
    if (open) console.log(`Port ${p} is OPEN`);
  }
}

main().catch(console.error);
