async function cleanupDuplicates() {
  const API_BASE = 'http://localhost:3001/api/v1';
  const tenants = ['srms-ims', 'srms'];

  for (const tenant of tenants) {
    try {
      const res = await fetch(`${API_BASE}/student-master?tenant=${tenant}`);
      const data = await res.json();
      const list = data.data || [];
      for (const s of list) {
        if (s.registration_no && s.registration_no.startsWith('SRMS2025')) {
          console.log(`🗑️ Deleting ${s.name} (${s.registration_no}) from ${tenant}...`);
          await fetch(`${API_BASE}/student-master/${s.id}?tenant=${tenant}`, { method: 'DELETE' });
        }
      }
    } catch (e) {}
  }
  console.log('✅ Cleanup completed.');
}

cleanupDuplicates();
