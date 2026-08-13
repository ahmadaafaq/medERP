const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();
  console.log('--- SYNCING AUTHENTIC TIMETABLE SLOTS IN tenant_srms-ims ---');

  // 1. Fetch exact IDs for Faculty, Subjects, Departments, and Batch
  const facs = await client.query(`SELECT id, name, department_id FROM "tenant_srms-ims".faculty`);
  const sanjay = facs.rows.find(f => f.name.includes('Sanjay'));
  const shipra = facs.rows.find(f => f.name.includes('Shipra'));

  const subs = await client.query(`SELECT id, name, code, department_id FROM "tenant_srms-ims".subjects`);
  const physioSub = subs.rows.find(s => s.code === 'PY' || s.name.toUpperCase().includes('PHYSIOLOGY'));
  const anatSub = subs.rows.find(s => s.code === 'AN' || s.name.toUpperCase().includes('ANATOMY'));

  const batches = await client.query(`SELECT id, code FROM "tenant_srms-ims".batches`);
  const batch2025 = batches.rows.find(b => b.code === '2025') || batches.rows[0];

  if (!sanjay || !shipra || !physioSub || !anatSub || !batch2025) {
    console.error('Error: Could not resolve faculty, subjects, or batch UUIDs.');
    console.log({ sanjay, shipra, physioSub, anatSub, batch2025 });
    await client.end();
    return;
  }

  // 2. Delete fake/dummy mock slots (assigned to Dr. Sarah Sharma or non-existent PHY101)
  const delRes = await client.query(`
    DELETE FROM "tenant_srms-ims".timetable_slots 
    WHERE faculty_id NOT IN ($1, $2) OR subject_id NOT IN ($3, $4)
  `, [sanjay.id, shipra.id, physioSub.id, anatSub.id]);
  console.log(`Deleted ${delRes.rowCount} dummy/mock timetable slots.`);

  // 3. Upsert authentic timetable slots corresponding to attendance_sessions UUIDs
  // Slot 1: Physiology (Dr. Sanjay Singh), Day 1 (Monday) 09:00-10:00 (UUID: 4aad081b-1600-4686-9848-50c46d8f0fd4)
  // Slot 2: Anatomy (Dr. Shipra Pandey), Day 1 (Monday) 10:00-11:00 (UUID: dcc2da9b-2daf-4b87-b212-ff421a4b6f95)
  // Slot 3: Physiology (Dr. Sanjay Singh), Day 4 (Thursday) 09:00-10:00 (UUID: 87aa9532-1208-4694-91aa-5a0850f5f8c7)

  const slotsToUpsert = [
    {
      id: '4aad081b-1600-4686-9848-50c46d8f0fd4',
      faculty_id: sanjay.id,
      subject_id: physioSub.id,
      department_id: sanjay.department_id,
      batch_id: batch2025.id,
      day_of_week: 1, // Monday
      start_time: '09:00:00',
      end_time: '10:00:00',
      room: 'Lecture Hall 1',
      slot_type: 'LECTURE',
      topic: 'Excitation-Contraction Coupling in Muscle (PYT2)',
      competency_codes: 'PY2.1',
    },
    {
      id: 'dcc2da9b-2daf-4b87-b212-ff421a4b6f95',
      faculty_id: shipra.id,
      subject_id: anatSub.id,
      department_id: shipra.department_id,
      batch_id: batch2025.id,
      day_of_week: 1, // Monday
      start_time: '10:00:00',
      end_time: '11:00:00',
      room: 'Lecture Hall 2',
      slot_type: 'LECTURE',
      topic: 'General Histology & Epithelial Tissues (ANT1)',
      competency_codes: 'AN1.1',
    },
    {
      id: '87aa9532-1208-4694-91aa-5a0850f5f8c7',
      faculty_id: sanjay.id,
      subject_id: physioSub.id,
      department_id: sanjay.department_id,
      batch_id: batch2025.id,
      day_of_week: 4, // Thursday
      start_time: '09:00:00',
      end_time: '10:00:00',
      room: 'Lecture Hall 1',
      slot_type: 'LECTURE',
      topic: 'Cardiac Action Potential & ECG Principles (PYT2)',
      competency_codes: 'PY2.2',
    },
  ];

  for (const s of slotsToUpsert) {
    await client.query(`
      INSERT INTO "tenant_srms-ims".timetable_slots (
        id, faculty_id, subject_id, department_id, batch_id, day_of_week,
        start_time, end_time, room, slot_type, topic, competency_codes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::TIME, $8::TIME, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        faculty_id = EXCLUDED.faculty_id,
        subject_id = EXCLUDED.subject_id,
        department_id = EXCLUDED.department_id,
        batch_id = EXCLUDED.batch_id,
        day_of_week = EXCLUDED.day_of_week,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        room = EXCLUDED.room,
        slot_type = EXCLUDED.slot_type,
        topic = EXCLUDED.topic,
        competency_codes = EXCLUDED.competency_codes
    `, [
      s.id, s.faculty_id, s.subject_id, s.department_id, s.batch_id, s.day_of_week,
      s.start_time, s.end_time, s.room, s.slot_type, s.topic, s.competency_codes
    ]);
  }

  console.log('Successfully upserted 3 authentic timetable slots (Physiology & Anatomy)!');

  // Print results
  const res = await client.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.topic, ts.competency_codes,
           f.name AS faculty_name, s.name AS subject_name, s.code AS subject_code
    FROM "tenant_srms-ims".timetable_slots ts
    JOIN "tenant_srms-ims".faculty f ON f.id = ts.faculty_id
    JOIN "tenant_srms-ims".subjects s ON s.id = ts.subject_id
    ORDER BY ts.day_of_week, ts.start_time
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
