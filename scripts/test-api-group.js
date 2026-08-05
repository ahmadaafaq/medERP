async function testApiGroup() {
  try {
    const res = await fetch('http://localhost:3001/api/v1/student-master?tenant=srms-ims');
    const json = await res.json();
    console.log('API Status:', res.status);
    console.log('Returned students count:', json.data ? json.data.length : 0);
    if (json.data && json.data.length > 0) {
      console.log('Sample student fields:', {
        name: json.data[0].name,
        registration_no: json.data[0].registration_no,
        group_id: json.data[0].group_id,
        group_code: json.data[0].group_code,
        group_name: json.data[0].group_name,
      });
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testApiGroup();
