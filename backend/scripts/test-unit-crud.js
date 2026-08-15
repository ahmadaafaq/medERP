const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function main() {
  const baseUrl = 'http://localhost:3001/api/v1/admin-master';
  const tenant = 'srms-cet-bareilly';

  console.log('1. Testing GET /units?tenant=' + tenant);
  const getRes = await fetch(`${baseUrl}/units?tenant=${tenant}`);
  const getData = await getRes.json();
  console.log('GET response count:', getData.data?.length);

  console.log('\n2. Testing POST /units?tenant=' + tenant);
  const postRes = await fetch(`${baseUrl}/units?tenant=${tenant}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      college_id: '1',
      course_cd: '13',
      branch_cd: '1',
      batch_id: '13',
      batch_year: 2025,
      subject_code: '88534',
      code: 'UNIT-1',
      name: 'Introduction to Web Technologies',
      description: 'Web Architecture, HTTP Protocol, HTML5 Semantic Elements, CSS3 Styling and Box Model',
      bloom_level: 'KL-2 (Understand)',
      unit_order: 1,
      hours: 12
    })
  });

  const postData = await postRes.json();
  console.log('POST status:', postRes.status);
  console.log('POST response:', JSON.stringify(postData, null, 2));

  if (postData.data?.id) {
    const unitId = postData.data.id;
    console.log('\n3. Testing PUT /units/' + unitId);
    const putRes = await fetch(`${baseUrl}/units/${unitId}?tenant=${tenant}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Introduction to Web Technologies & Modern Frontend',
        hours: 15,
        bloom_level: 'KL-3 (Apply)'
      })
    });
    const putData = await putRes.json();
    console.log('PUT response:', JSON.stringify(putData, null, 2));

    console.log('\n4. Testing DELETE /units/' + unitId);
    const delRes = await fetch(`${baseUrl}/units/${unitId}?tenant=${tenant}`, {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    console.log('DELETE response:', JSON.stringify(delData, null, 2));
  }
}

main().catch(console.error);
