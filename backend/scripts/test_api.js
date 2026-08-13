const fetch = require('node-fetch');

async function main() {
  // Login to get token
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': 'srms-ims' },
    body: JSON.stringify({ email: 'faculty@srms.edu.in', password: 'password123' })
  }).catch(() => null);

  let token = '';
  if (loginRes && loginRes.ok) {
    const loginData = await loginRes.json();
    token = loginData.data?.accessToken || loginData.token || '';
  }

  const url = 'http://localhost:3001/api/v1/exams/question-bank?mode=MCQ&subjectId=bd3e051a-7513-4f9e-8577-0e1ec39e3527&topicId=0fb688a4-41d8-4767-87e7-e010fc25355d&competencyCode=PY1.1%282024%29';
  console.log('Testing GET with token:', url);

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': 'srms-ims'
    }
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response Items Count:', Array.isArray(data) ? data.length : data.data?.length);
  console.log('Response Items:', JSON.stringify(data, null, 2));
}

main().catch(err => console.error(err));
