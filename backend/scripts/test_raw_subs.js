const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { TenantSchemaService } = require('../dist/database/tenant-schema.service');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const tenantSchemaService = app.get(TenantSchemaService);
  const cleanSlug = 'srms-cet-bareilly';
  const schema = `tenant_${cleanSlug}`;

  const res = await tenantSchemaService.queryInTenant(
    cleanSlug,
    `SELECT DISTINCT ON (s.id)
      s.id,
      t.title,
      s.attachment_name,
      s.attachment_url,
      s.student_id,
      st.name AS student_name
    FROM "${schema}".logbook_submissions s
    JOIN "${schema}".logbook_topics t ON (t.id::text = s.topic_id::text)
    LEFT JOIN "${schema}".students st ON (st.id::text = s.student_id::text);`
  );
  console.log('topicSubmissions raw rows:', res);
  await app.close();
}
main();
