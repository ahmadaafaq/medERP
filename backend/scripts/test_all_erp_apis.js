const endpoints = [
  { path: '/health', method: 'GET' },
  { path: '/auth/me', method: 'GET' },
  { path: '/student-master/hustle-board?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/categories?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/topics?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/submissions?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/mini-project?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/mini-projects/all?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/mini-projects/applicants?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/logbook/weekly-logs/all?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/medical-timetable/schedule?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/notices?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/departments?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/courses?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/batches?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/semesters?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/sections?tenant=srms-cet-bareilly', method: 'GET' },
  { path: '/academic-periods?tenant=srms-cet-bareilly', method: 'GET' },
];

const BASE_URL = 'http://127.0.0.1:8081/api/v1';

async function testAll() {
  console.log(`Testing ${endpoints.length} backend API endpoints on ${BASE_URL}...\n`);
  const results = [];

  for (const ep of endpoints) {
    const url = `${BASE_URL}${ep.path}`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: ep.method,
        headers: {
          'x-tenant-slug': 'srms-cet-bareilly',
          'x-tenant': 'srms-cet-bareilly',
        },
      });
      const duration = Date.now() - start;
      const status = res.status;
      let bodySnippet = '';
      try {
        const text = await res.text();
        bodySnippet = text.slice(0, 100).replace(/\s+/g, ' ');
      } catch (e) {
        bodySnippet = `[Error reading body: ${e.message}]`;
      }
      results.push({
        endpoint: ep.path,
        status,
        duration: `${duration}ms`,
        ok: res.ok,
        sample: bodySnippet,
      });
    } catch (err) {
      results.push({
        endpoint: ep.path,
        status: 'FETCH_ERROR',
        duration: `${Date.now() - start}ms`,
        ok: false,
        sample: err.message,
      });
    }
  }

  console.table(results);
}

testAll().catch(console.error);
