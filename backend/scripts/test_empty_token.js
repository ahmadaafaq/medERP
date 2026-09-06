async function testEmptySub() {
  const meRes = await fetch('http://localhost:8081/api/v1/auth/me', {
    headers: {
      'x-tenant-slug': 'srms-cet-bareilly'
    }
  });
  console.log('STATUS:', meRes.status);
  const meJson = await meRes.json();
  console.log('RESULT WITHOUT TOKEN:', JSON.stringify(meJson, null, 2));
}

testEmptySub().catch(console.error);
