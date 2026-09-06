const { Client } = require('pg');

async function test() {
  // Call login API on local backend
  const loginRes = await fetch('http://localhost:8081/api/v1/auth/login?tenant=srms-cet-bareilly', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': 'srms-cet-bareilly' },
    body: JSON.stringify({
      email: 'vinayverma111.vk@gmail.com',
      password: 'password123',
      role: 'FACULTY'
    })
  });
  const loginJson = await loginRes.json();
  console.log('LOGIN RESULT:', loginJson);

  if (loginJson.data?.accessToken) {
    const meRes = await fetch('http://localhost:8081/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${loginJson.data.accessToken}`,
        'x-tenant-slug': 'srms-cet-bareilly'
      }
    });
    const meJson = await meRes.json();
    console.log('AUTH/ME RESULT FOR VINAY:', meJson);
  }
}

test().catch(console.error);
