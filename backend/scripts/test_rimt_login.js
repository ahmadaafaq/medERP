async function testRimtLogin() {
  const payload = {
    email: 'admin@rajshree.ac.in',
    password: 'rajshree@123#',
    role: 'COLLEGE_ADMIN'
  };

  console.log('Sending login request to http://localhost:8081/api/v1/auth/login?tenant=rimt-bareilly');
  const res = await fetch('http://localhost:8081/api/v1/auth/login?tenant=rimt-bareilly', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': 'rimt-bareilly'
    },
    body: JSON.stringify(payload)
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testRimtLogin().catch(console.error);
