const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const client = new Client({
  host: process.env.DB_HOST || '100.63.22.73',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

const fs = require('fs');
const path = require('path');
const frontendDir = path.resolve(__dirname, '..', '..', 'frontend');
const appDir = path.join(frontendDir, 'app');

function routeExists(route) {
  if (!route || !route.startsWith('/')) return true;
  const cleanRoute = route.split('?')[0].split('#')[0];
  const parts = cleanRoute.replace(/^\//, '').split('/');
  
  function checkDir(currentDir, remainingParts) {
    if (remainingParts.length === 0) {
      return fs.existsSync(path.join(currentDir, 'page.tsx')) ||
             fs.existsSync(path.join(currentDir, 'page.jsx')) ||
             fs.existsSync(path.join(currentDir, 'page.js'));
    }

    const nextPart = remainingParts[0];
    const rest = remainingParts.slice(1);

    const exactPath = path.join(currentDir, nextPart);
    if (fs.existsSync(exactPath) && fs.statSync(exactPath).isDirectory()) {
      if (checkDir(exactPath, rest)) return true;
    }

    const subdirs = fs.readdirSync(currentDir).filter(f => {
      try {
        return fs.statSync(path.join(currentDir, f)).isDirectory();
      } catch { return false; }
    });

    for (const sub of subdirs) {
      if (sub.startsWith('[') && sub.endsWith(']')) {
        if (checkDir(path.join(currentDir, sub), rest)) return true;
      }
    }

    return false;
  }

  return checkDir(appDir, parts);
}

async function run() {
  await client.connect();
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menu_registry'
  `);
  console.log('Columns:', cols.rows.map(c => c.column_name));

  const menus = await client.query(`
    SELECT * FROM public.menu_registry
  `);
  console.log(`Total rows: ${menus.rows.length}`);

  const missing404 = [];
  menus.rows.forEach(m => {
    // Check path or route
    const r = m.route_path || m.path || m.route || m.url || m.href;
    if (r && r.startsWith('/')) {
      if (!routeExists(r)) {
        missing404.push({ key: m.menu_key, name: m.menu_label, route: r, role: m.role });
      }
    }
  });

  console.log(`\n=== 404 ROUTES IN public.menu_registry (${missing404.length}) ===`);
  console.log(JSON.stringify(missing404, null, 2));

  await client.end();
}

run().catch(console.error);
