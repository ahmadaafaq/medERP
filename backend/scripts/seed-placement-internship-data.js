const { Client } = require('pg');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function seedData() {
  await c.connect();

  const schemas = ['tenant_srms-cet-bareilly', 'tenant_srms-cet-unnao', 'tenant_srms-cetr-bareilly', 'tenant_srms-ibs-lucknow'];

  for (const schema of schemas) {
    console.log(`Seeding authentic placement & internship data in ${schema}...`);

    // 1. Seed Placement Companies
    const driveCount = await c.query(`SELECT count(*) FROM "${schema}".placement_drives`);
    if (parseInt(driveCount.rows[0].count, 10) <= 2) {
      const companies = [
        {
          company: 'Tata Consultancy Services (TCS)',
          role: 'Systems Engineer & Digital Specialist',
          package: '₹7.5 - ₹9.0 LPA',
          branches: ['CSE', 'IT', 'ECE', 'ME'],
          batches: ['2025', '2026'],
          date: '2026-09-10',
          deadline: '2026-09-05',
          description: 'Global IT leader hiring for enterprise cloud, cybersecurity, and full-stack software development tracks.',
          extra_fields: {
            'Interview Mode': 'Hybrid (Online Assessment + In-Person Technical / HR)',
            'Bond Period': 'None',
            'Work Location': 'Noida, Gurugram, Bengaluru, Pune',
            'Minimum CGPA': '6.5 or 65% aggregate with no active backlogs',
          }
        },
        {
          company: 'Infosys Limited',
          role: 'Specialist Programmer (Power Programmer)',
          package: '₹9.5 LPA',
          branches: ['CSE', 'IT', 'ECE'],
          batches: ['2025', '2026'],
          date: '2026-09-18',
          deadline: '2026-09-12',
          description: 'High-tier hiring for advanced algorithmic problem solving, modern cloud architecture, and AI platforms.',
          extra_fields: {
            'Interview Mode': 'HackWithInfy Contest & Technical Interview',
            'Joining Quarter': 'Q1 2027',
            'Shift Timings': 'General Shift (Mon - Fri)',
          }
        },
        {
          company: 'Larsen & Toubro (L&T)',
          role: 'Graduate Engineer Trainee (GET)',
          package: '₹6.8 LPA',
          branches: ['ME', 'EE', 'CE', 'ECE'],
          batches: ['2025', '2026'],
          date: '2026-09-25',
          deadline: '2026-09-20',
          description: 'Premier infrastructure and EPC conglomerate hiring core engineering graduates for smart infrastructure projects.',
          extra_fields: {
            'Technical Test': 'Core Engineering Domain + Aptitude (90 Mins)',
            'Medical Fitness': 'Standard Occupational Health Clearance Required',
            'Job Location': 'Pan-India Project Sites & Regional Engineering Centers',
          }
        },
        {
          company: 'HCL Technologies',
          role: 'Cloud & DevOps Associate',
          package: '₹5.5 - ₹7.0 LPA',
          branches: ['CSE', 'IT', 'ECE', 'EE'],
          batches: ['2025', '2026'],
          date: '2026-10-04',
          deadline: '2026-09-28',
          description: 'Engineering services division hiring engineers with foundational skills in AWS/Azure, Docker, Linux, and Python.',
          extra_fields: {
            'Certifications Preferred': 'AWS Certified Cloud Practitioner or Azure Fundamentals',
            'Training Duration': '3 Months Paid Foundation Academy',
          }
        }
      ];

      for (const comp of companies) {
        await c.query(
          `INSERT INTO "${schema}".placement_drives (
            colg_cd, company_name, role, package_ctc, description,
            eligibility_course_cd, eligibility_branch_cd, eligibility_batch_cd,
            eligible_branches, eligible_batches, min_score_required,
            drive_date, deadline_date, batch_title, source_file_name,
            extra_fields, status, created_by_empid, created_at, updated_at
          ) VALUES (
            '1', $1, $2, $3, $4,
            '13', $5, $6,
            $7, $8, 60.00,
            $9, $10, 'Campus Placement Season 2026-27', 'campus_drive_roster.xlsx',
            $11, 'Open', 'ADMIN', NOW(), NOW()
          )`,
          [
            comp.company,
            comp.role,
            comp.package,
            comp.description,
            comp.branches.join(', '),
            comp.batches.join(', '),
            comp.branches,
            comp.batches,
            comp.date,
            comp.deadline,
            JSON.stringify(comp.extra_fields),
          ]
        );
      }
      console.log(`Seeded ${companies.length} placement companies in ${schema}.`);
    }

    // 2. Seed Internship Programs
    const progCount = await c.query(`SELECT count(*) FROM "${schema}".internship_programs`);
    if (parseInt(progCount.rows[0].count, 10) === 0) {
      const programs = [
        {
          title: 'Full-Stack Cloud & AI Engineering Internship',
          category: 'IT',
          duration: '3_MONTH',
          fee_type: 'FREE',
          fee_amount: 0,
          description: 'Hands-on intensive development track on React, Next.js, Node.js/NestJS, Docker containerization, PostgreSQL schema-per-tenant architecture, and OpenAI/Gemini SDK integrations.',
          seats: 60,
          deadline: '2026-09-15'
        },
        {
          title: 'Executive Financial Analytics & Supply Chain Management',
          category: 'MANAGEMENT',
          duration: '2_MONTH',
          fee_type: 'PAID',
          fee_amount: 3500,
          description: 'Advanced managerial analytics covering SAP ERP modules, corporate financial forecasting, Excel modeling, and supply chain simulation.',
          seats: 40,
          deadline: '2026-09-20'
        },
        {
          title: 'Embedded Systems & IoT Robotics Workshop',
          category: 'IT',
          duration: '1_MONTH',
          fee_type: 'FREE',
          fee_amount: 0,
          description: 'Microcontroller programming (ESP32/STM32), sensor interfacing, MQTT communication protocols, and edge computation.',
          seats: 45,
          deadline: '2026-09-10'
        },
        {
          title: 'Clinical Diagnostics & Bio-Medical Instrumentation Program',
          category: 'PARAMEDICAL',
          duration: '6_MONTH',
          fee_type: 'PAID',
          fee_amount: 5000,
          description: 'Hospital laboratory instrumentation, automated biochemistry analyzers, radiological safety protocols, and diagnostic data analysis.',
          seats: 30,
          deadline: '2026-09-30'
        }
      ];

      for (const p of programs) {
        await c.query(
          `INSERT INTO "${schema}".internship_programs (
            title, category, duration, fee_type, fee_amount, description,
            seats_available, application_deadline, published_by, status,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, 'ADMIN', 'published',
            NOW(), NOW()
          )`,
          [p.title, p.category, p.duration, p.fee_type, p.fee_amount, p.description, p.seats, p.deadline]
        );
      }
      console.log(`Seeded ${programs.length} internship programs in ${schema}.`);
    }

    // 3. Seed an authentic completed internship and digital certificate for demo student (2025107990 / AAFREEN KHAN)
    const existingCert = await c.query(`SELECT count(*) FROM "${schema}".certificates`);
    if (parseInt(existingCert.rows[0].count, 10) === 0) {
      const itProg = (await c.query(`SELECT id, title FROM "${schema}".internship_programs WHERE category = 'IT' LIMIT 1`)).rows[0];
      if (itProg) {
        const appRes = await c.query(
          `INSERT INTO "${schema}".internship_applications (
            program_id, student_id, student_reg_no, student_name,
            course_cd, batch_cd, applied_at, status, locked,
            payment_status, completed_at, remarks, created_at, updated_at
          ) VALUES (
            $1, '2025107990', '2025107990', 'AAFREEN KHAN',
            'B.Tech (CSE)', '2022-2026', NOW() - INTERVAL '45 days', 'completed', false,
            'not_required', NOW() - INTERVAL '5 days', 'Outstanding capstone performance & project delivery', NOW(), NOW()
          ) RETURNING id`,
          [itProg.id]
        );

        const appId = appRes.rows[0].id;
        await c.query(
          `INSERT INTO "${schema}".certificates (
            application_id, certificate_no, internship_name, applicant_name,
            course, batch, issued_date, approved_by, pdf_url, created_at
          ) VALUES (
            $1, 'SRMS-CERT-2026-004821', $2, 'AAFREEN KHAN',
            'B.Tech (Computer Science & Engineering)', '2022-2026', CURRENT_DATE - 5,
            'Prof. (Dr.) Prabhakar Gupta', '/certificates/SRMS-CERT-2026-004821.pdf', NOW()
          )`,
          [appId, itProg.title]
        );
        console.log(`Seeded demo completed internship and certificate in ${schema}.`);
      }
    }
  }

  await c.end();
}

seedData().catch(console.error);
