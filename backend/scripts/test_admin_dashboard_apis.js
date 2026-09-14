async function testAllAdminApis() {
  const tenant = 'rimt-bareilly';
  console.log('--- 1. LOGIN AS ADMIN ---');
  const loginRes = await fetch(`http://localhost:8081/api/v1/auth/login?tenant=${tenant}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenant,
    },
    body: JSON.stringify({
      email: 'admin@rajshree.ac.in',
      password: 'rajshree@123#',
      role: 'COLLEGE_ADMIN',
    }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.data?.accessToken) {
    console.error('Login FAILED:', loginRes.status, loginData);
    return;
  }

  const token = loginData.data.accessToken;
  console.log('✓ Logged in successfully! Token received.');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-slug': tenant,
    'x-tenant': tenant,
    'x-tenant-id': `tenant_${tenant}`,
  };

  const endpoints = [
    { method: 'GET', url: `/api/v1/analytics/dashboard/college?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/exams/papers?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/placement-drive/list?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/repository/list?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/internships/list?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/firms/status?slug=${tenant}` },
    { method: 'GET', url: `/api/v1/firms/${tenant}/transactions` },
    { method: 'GET', url: `/api/v1/lessons/recent?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/notices?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/chat/threads?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/incubation-cell/meta?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/incubation-cell/projects?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/student-master/students?tenant=${tenant}&page=1&limit=10` },
    { method: 'GET', url: `/api/v1/users/faculty?tenant=${tenant}&limit=10` },
    { method: 'GET', url: `/api/v1/admin-master/departments?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/admin-master/subjects?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/admin-master/courses?tenant=${tenant}` },
    { method: 'GET', url: `/api/v1/tenants/${tenant}/theme` },
  ];

  console.log('\n--- 2. TESTING ALL DASHBOARD APIS ---');
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:8081${ep.url}`, {
        method: ep.method,
        headers,
      });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 100); }
      const isOk = res.status < 400;
      const mark = isOk ? '✓' : '✗';
      console.log(`${mark} [${res.status}] ${ep.method} ${ep.url}`);
      if (!isOk) {
        console.error('  ERROR BODY:', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error(`✗ [FETCH ERROR] ${ep.method} ${ep.url}:`, err.message);
    }
  }
}

testAllAdminApis().catch(console.error);
