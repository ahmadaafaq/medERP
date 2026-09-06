const jwt = require('jsonwebtoken');

const JWT_SECRET = 'change_me_to_a_super_long_random_string_at_least_64_chars';

// Create an expired token for Vinay Kumar
const expiredToken = jwt.sign(
  {
    sub: '13527823-2f8b-4c6c-a1be-cb4b75d1c3af',
    email: 'vinayverma111.vk@gmail.com',
    role: 'FACULTY',
    tenantSlug: 'srms-cet-bareilly'
  },
  JWT_SECRET,
  { expiresIn: '-1s' } // Expired 1 second ago
);

async function testExpired() {
  const res = await fetch('http://localhost:8081/api/v1/auth/me', {
    headers: {
      Authorization: `Bearer ${expiredToken}`,
      'x-tenant-slug': 'srms-cet-bareilly'
    }
  });

  console.log('STATUS WITH EXPIRED TOKEN:', res.status);
  const json = await res.json();
  console.log('BODY WITH EXPIRED TOKEN:', json);
}

testExpired().catch(console.error);
