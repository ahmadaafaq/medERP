const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
};

async function exportDatabase() {
  console.log('Connecting to database:', config.database, 'at', config.host);
  const client = new Client(config);
  await client.connect();

  const outputDir = path.join(__dirname, '../database_backup');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sqlFile = path.join(outputDir, 'unicampus_full_dump.sql');
  const jsonFile = path.join(outputDir, 'unicampus_full_dump.json');
  const sqlStream = fs.createWriteStream(sqlFile, { flags: 'w' });

  sqlStream.write(`-- UniCampus MedERP Full Database Export\n`);
  sqlStream.write(`-- Generated: ${new Date().toISOString()}\n`);
  sqlStream.write(`-- Database: ${config.database}\n\n`);
  sqlStream.write(`SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\n\n`);

  // 1. Get all user schemas
  const schemaRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY CASE WHEN schema_name = 'public' THEN 0 ELSE 1 END, schema_name ASC
  `);

  const schemas = schemaRes.rows.map(r => r.schema_name);
  console.log(`Found schemas:`, schemas);

  const fullJsonBackup = {};

  for (const schema of schemas) {
    sqlStream.write(`\n-- ========================================================\n`);
    sqlStream.write(`-- SCHEMA: ${schema}\n`);
    sqlStream.write(`-- ========================================================\n`);
    sqlStream.write(`CREATE SCHEMA IF NOT EXISTS "${schema}";\n\n`);

    fullJsonBackup[schema] = {};

    // Get all tables in this schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `, [schema]);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Schema "${schema}" contains ${tables.length} tables`);

    for (const table of tables) {
      // Fetch table columns
      const colsRes = await client.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position ASC
      `, [schema, table]);

      const columns = colsRes.rows;
      const colMap = {};
      columns.forEach(c => {
        colMap[c.column_name] = { dataType: c.data_type, udtName: c.udt_name };
      });

      // Fetch all rows
      const dataRes = await client.query(`SELECT * FROM "${schema}"."${table}"`);
      const rows = dataRes.rows;
      fullJsonBackup[schema][table] = rows;

      console.log(`  └─ ${schema}.${table}: ${rows.length} rows`);

      if (rows.length > 0) {
        sqlStream.write(`-- Data for "${schema}"."${table}" (${rows.length} rows)\n`);
        const colNames = Object.keys(rows[0]);

        for (const row of rows) {
          const vals = colNames.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return String(val);
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') {
              if (Array.isArray(val)) {
                const colMeta = colMap[col];
                if (colMeta && (colMeta.dataType === 'ARRAY' || (colMeta.udtName && colMeta.udtName.startsWith('_')))) {
                  let elemType = colMeta.udtName ? colMeta.udtName.replace(/^_/, '') : 'text';
                  if (elemType === 'varchar') elemType = 'varchar';
                  if (val.length === 0) {
                    return `'{}'::${elemType}[]`;
                  }
                  const escapedElems = val.map(item => {
                    if (item === null || item === undefined) return 'NULL';
                    return `'${String(item).replace(/'/g, "''")}'`;
                  });
                  return `ARRAY[${escapedElems.join(', ')}]::${elemType}[]`;
                }
              }
              const str = JSON.stringify(val).replace(/'/g, "''");
              return `'${str}'::jsonb`;
            }
            const str = String(val).replace(/'/g, "''");
            return `'${str}'`;
          });

          sqlStream.write(`INSERT INTO "${schema}"."${table}" ("${colNames.join('", "')}") VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`);
        }
        sqlStream.write(`\n`);
      }
    }
  }

  sqlStream.end();
  fs.writeFileSync(jsonFile, JSON.stringify(fullJsonBackup, null, 2), 'utf8');

  console.log(`\n======================================================`);
  console.log(`✅ Full database export complete!`);
  console.log(`📁 SQL Dump:  ${sqlFile}`);
  console.log(`📁 JSON Data: ${jsonFile}`);
  console.log(`======================================================`);

  await client.end();
}

exportDatabase().catch(err => {
  console.error('Database export error:', err);
  process.exit(1);
});
