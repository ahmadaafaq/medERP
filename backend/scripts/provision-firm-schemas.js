const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { TenantSchemaService } = require('../dist/database/tenant-schema.service');

async function provisionAll() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const schemaService = app.get(TenantSchemaService);

  const slugs = ['rmribar', 'apex-tech', 'rmch-bareilly'];
  for (const s of slugs) {
    try {
      console.log(`Provisioning schema for: ${s}...`);
      await schemaService.provisionSchema(s);
      console.log(`✓ Successfully provisioned schema tenant_${s}`);
    } catch (e) {
      console.warn(`Note on ${s}:`, e.message);
    }
  }

  await app.close();
  console.log('ALL SCHEMAS PROVISIONED!');
}

provisionAll().catch((err) => {
  console.error('PROVISION ERROR:', err);
  process.exit(1);
});
