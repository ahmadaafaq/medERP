const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { LogbookService } = require('../dist/logbook/logbook.service');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const logbookService = app.get(LogbookService);
  const cleanSlug = 'srms-cet-bareilly';

  const res = await logbookService.getAllAdminLogbookEntries(cleanSlug, {});
  console.log('Total entries returned by logbookService:', res.length);
  const genAi = res.find(r => r.title === 'GEN AI');
  console.log('GEN AI Entry:', JSON.stringify(genAi, null, 2));

  const top = res.find(r => r.title === 'Topology');
  console.log('Topology Entry:', JSON.stringify(top, null, 2));

  await app.close();
}
main();
