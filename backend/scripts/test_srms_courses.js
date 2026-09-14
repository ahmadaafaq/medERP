async function checkSrmsCourses() {
  try {
    const colRes = await fetch('https://myportal.srms.ac.in/srmserp/Home/GetCollege', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log("COLLEGES:", await colRes.json());

    const courseRes = await fetch('https://myportal.srms.ac.in/srmserp/Home/GetCourse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colg_cd: 1 })
    });
    console.log("COURSES (colg 1):", await courseRes.json());

    const courseRes2 = await fetch('https://myportal.srms.ac.in/srmserp/Home/GetCourse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colg_cd: 2 })
    });
    console.log("COURSES (colg 2):", await courseRes2.json());
  } catch (e) {
    console.error(e);
  }
}
checkSrmsCourses();
