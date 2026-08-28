const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function analyzeDump() {
  const dumpPath = path.join(__dirname, 'unicampus_complete_production_dump.sql');
  const fileStream = fs.createReadStream(dumpPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const tableColumns = new Map();

  for await (const line of rl) {
    const match = line.match(/^INSERT INTO "([^"]+)"\."([^"]+)"\s*\(([^)]+)\)/);
    if (match) {
      const schema = match[1];
      const table = match[2];
      const cols = match[3].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const key = schema + '.' + table;
      if (!tableColumns.has(key)) {
        tableColumns.set(key, new Set());
      }
      const set = tableColumns.get(key);
      cols.forEach(c => set.add(c));
    }
  }

  const result = {};
  for (const [key, cols] of tableColumns.entries()) {
    result[key] = Array.from(cols);
  }
  fs.writeFileSync(path.join(__dirname, 'dump_analysis.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log('Dump analysis complete. Found', tableColumns.size, 'distinct tables.');
}

analyzeDump();
