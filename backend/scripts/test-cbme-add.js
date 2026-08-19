async function test() {
  try {
    // 1. Login as admin
    const loginRes = await fetch('http://localhost:3001/api/v1/auth/login?tenant=rajshreemri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin',
        password: 'admin',
        role: 'COLLEGE_ADMIN',
        tenantSlug: 'rajshreemri'
      })
    });
    const loginJson = await loginRes.json();
    console.log('Login result:', loginJson.success, loginJson.data?.accessToken ? 'Token received' : 'No token');
    const token = loginJson.data?.accessToken || '';

    // 2. Create CBME Linker
    const createRes = await fetch('http://localhost:3001/api/v1/admin-master/professional-linkers?tenant=rajshreemri', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': 'rajshreemri'
      },
      body: JSON.stringify({
        code: '2024',
        name: 'NMC 204 guideline',
        course_cd: 'MBBS',
        professional_phase: '1st Professional (Phase I)',
        academic_session: '2024-2030',
        description: 'NMC 204 guideline'
      })
    });
    const createJson = await createRes.json();
    console.log('Create CBME Linker result:', createJson);

    // 3. List CBME Linkers
    const listRes = await fetch('http://localhost:3001/api/v1/admin-master/professional-linkers?tenant=rajshreemri', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': 'rajshreemri'
      }
    });
    const listJson = await listRes.json();
    console.log('List CBME Linkers in rajshreemri:', listJson.data);
  } catch (err) {
    console.error('Test error:', err);
  }
}
test();
