async function testSubjectOffering() {
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
    const token = loginJson.data?.accessToken || '';

    // 2. Fetch phases, subjects, delivery types
    const [phasesRes, subjectsRes, dtypesRes] = await Promise.all([
      fetch('http://localhost:3001/api/v1/admin-master/professional-phases?tenant=rajshreemri', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': 'rajshreemri' }
      }),
      fetch('http://localhost:3001/api/v1/admin-master/subjects?tenant=rajshreemri', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': 'rajshreemri' }
      }),
      fetch('http://localhost:3001/api/v1/admin-master/delivery-types?tenant=rajshreemri', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': 'rajshreemri' }
      })
    ]);

    const phases = (await phasesRes.json()).data;
    const subjects = (await subjectsRes.json()).data;
    const dtypes = (await dtypesRes.json()).data;

    console.log(`Phases (${phases?.length}):`, phases?.[0]?.name);
    console.log(`Subjects (${subjects?.length}):`, subjects?.[0]?.name);
    console.log(`Delivery Types (${dtypes?.length}):`, dtypes?.[0]?.name);

    if (phases?.length && subjects?.length && dtypes?.length) {
      // 3. Create Subject Offering
      const createRes = await fetch('http://localhost:3001/api/v1/admin-master/subject-offerings?tenant=rajshreemri', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': 'rajshreemri'
        },
        body: JSON.stringify({
          subject_id: subjects[0].id,
          prof_id: phases[0].id,
          dtype_id: dtypes[0].id,
          batch_year: 2026,
          hours_allotted: 60
        })
      });
      const createJson = await createRes.json();
      console.log('Create Subject Offering result:', createJson);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}
testSubjectOffering();
