async function testSrmsMba() {
  const payloads = [
    {
      url: 'https://myportal.srms.ac.in/srmserp/student/GetEngSemesterSubjects',
      body: { ddl_batch: '15', colgcd: '1', coursecd: '4', ddl_branch: '1', sem_cd: '3', section_cd: '1', uid: '2400141780001' }
    },
    {
      url: 'https://myportal.srms.ac.in/srmserp/student/GetEngSemesterSubjects',
      body: { ddl_batch: '2', colgcd: '1', coursecd: '4', ddl_branch: '1', sem_cd: '1', section_cd: '1', uid: '2400141780001' }
    },
    {
      url: 'https://myportal.srms.ac.in/srmserp/Student/Get_stud_att_with_subCd',
      body: { batch_cd: 15, colg_cd: 1, course_cd: 4, branch_cd: 1, sem_cd: 3, section_cd: 1, fdt: '2025-07-01', tdt: '2026-03-01' }
    },
    {
      url: 'https://myportal.srms.ac.in/srmserp/Student/Get_stud_indi_Tot_att',
      body: { batch_cd: 15, colg_cd: 1, course_cd: 4, branch_cd: 1, stud_reg_no: '2400141780001' }
    }
  ];

  for (const p of payloads) {
    console.log(`\nTesting ${p.url} with payload:`, p.body);
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify(p.body)
      });
      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Response (first 300 chars):', text.substring(0, 300));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testSrmsMba();
