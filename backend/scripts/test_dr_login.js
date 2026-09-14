async function testAllLoginCases() {
  const cases = [
    {
      name: '1. DR/01/2026 with role COLLEGE_ADMIN & tenant rimt-bareilly',
      url: 'http://localhost:8081/api/v1/auth/login?tenant=rimt-bareilly',
      body: { email: 'DR/01/2026', password: 'admin@123', role: 'COLLEGE_ADMIN' },
    },
    {
      name: '2. DR/01/2026 with role FACULTY & tenant rimt-bareilly',
      url: 'http://localhost:8081/api/v1/auth/login?tenant=rimt-bareilly',
      body: { email: 'DR/01/2026', password: 'admin@123', role: 'FACULTY' },
    },
    {
      name: '3. admin@rajshree.ac.in with role COLLEGE_ADMIN & tenant rimt-bareilly',
      url: 'http://localhost:8081/api/v1/auth/login?tenant=rimt-bareilly',
      body: { email: 'admin@rajshree.ac.in', password: 'admin@123', role: 'COLLEGE_ADMIN' },
    },
    {
      name: '4. Next.js Proxy Port 3000: DR/01/2026 with role COLLEGE_ADMIN',
      url: 'http://localhost:3000/api/v1/auth/login?tenant=rimt-bareilly',
      body: { email: 'DR/01/2026', password: 'admin@123', role: 'COLLEGE_ADMIN' },
    },
    {
      name: '5. Auto-detect tenant: DR/01/2026 WITHOUT tenant in query',
      url: 'http://localhost:8081/api/v1/auth/login',
      body: { email: 'DR/01/2026', password: 'admin@123', role: 'COLLEGE_ADMIN' },
    },
  ];

  for (const c of cases) {
    console.log(`\n=== Testing: ${c.name} ===`);
    try {
      const res = await fetch(c.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': 'rimt-bareilly',
        },
        body: JSON.stringify(c.body),
      });
      const data = await res.json();
      if (res.ok && data.data?.accessToken) {
        console.log(`✓ SUCCESS [${res.status}]`);
        console.log('  User:', {
          id: data.data.user?.id,
          email: data.data.user?.email,
          role: data.data.user?.role,
          tenantSlug: data.data.user?.tenantSlug,
          collegeName: data.data.user?.collegeName,
        });
      } else {
        console.error(`✗ FAILED [${res.status}]:`, data);
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

testAllLoginCases().catch(console.error);
