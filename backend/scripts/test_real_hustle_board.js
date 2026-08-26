const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function computeRealHustleBoard() {
  const schema = 'tenant_srms-cet-bareilly';

  const query = `
    WITH student_base AS (
      SELECT s.id, s.name, s.rollno, s.registration_no, s.course_cd, s.batch_cd, s.photo_url, s.user_id::text AS user_id,
             COALESCE(s.attendance_percentage, 0) AS srms_attd_pct,
             c.name AS course_name,
             COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, 'Batch ' || s.batch_cd, s.batch_cd) AS batch_name
      FROM "${schema}".students s
      LEFT JOIN "${schema}".courses c ON c.course_cd = s.course_cd
      LEFT JOIN "${schema}".batches b ON (b.id = s.batch_id OR (b.batch_cd = s.batch_cd AND b.course_cd = s.course_cd))
    ),
    repo_metrics AS (
      SELECT DISTINCT ON (COALESCE(r.student_reg_no, r.student_name))
             r.student_reg_no,
             r.student_name,
             r.title AS project_title,
             COALESCE(r.score, 0) AS project_score,
             COALESCE(r.grade, 'N/A') AS project_grade,
             r.incubation_status,
             COALESCE(r.funding_amount, 0) AS funding_amount,
             (r.incubation_status IN ('Incubated', 'Selected', 'Funded')) AS is_incubated
      FROM "${schema}".repositories r
      ORDER BY COALESCE(r.student_reg_no, r.student_name), r.score DESC NULLS LAST
    ),
    exam_metrics AS (
      SELECT sr.student_id,
             sr.marks_obtained,
             sr.practical_mark,
             ep.max_marks,
             ep.name AS exam_name,
             ROUND((sr.marks_obtained / NULLIF(ep.max_marks, 0)) * 100, 1) AS theory_pct
      FROM "${schema}".student_results sr
      JOIN "${schema}".examination_papers ep ON ep.id = sr.paper_id
    ),
    att_metrics AS (
      SELECT ar.student_id,
             COUNT(ar.id) AS total_classes,
             COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT', 'LATE', 'P', 'L')) AS attended_classes,
             ROUND((COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT', 'LATE', 'P', 'L')) * 100.0) / NULLIF(COUNT(ar.id), 0), 1) AS attendance_pct
      FROM "${schema}".attendance_records ar
      GROUP BY ar.student_id
    ),
    chat_metrics AS (
      SELECT cm.sender_id::text AS sender_id, COUNT(cm.id) AS chat_count
      FROM "${schema}".chat_messages cm
      GROUP BY cm.sender_id::text
    )
    SELECT sb.id, sb.name, sb.rollno, sb.registration_no, sb.course_name, sb.batch_name, sb.photo_url,
           rm.project_title,
           rm.project_score,
           rm.project_grade,
           rm.incubation_status,
           rm.funding_amount,
           COALESCE(rm.is_incubated, false) AS is_incubated,
           em.theory_pct,
           em.exam_name,
           ROUND(COALESCE(am.attendance_pct, sb.srms_attd_pct, 0)::numeric, 1) AS attendance_pct,
           COALESCE(am.total_classes, CASE WHEN sb.srms_attd_pct > 0 THEN 1 ELSE 0 END) AS total_classes,
           COALESCE(cm.chat_count, 0) AS chat_count,
           (COALESCE(cm.chat_count, 0) > 0) AS is_chat_active,
           -- Dynamic Authentic Composite Calculation
           ROUND(
             (
               COALESCE(rm.project_score * 0.40, 0) +
               COALESCE(em.theory_pct * 0.40, 0) +
               COALESCE(COALESCE(am.attendance_pct, sb.srms_attd_pct, 0) * 0.10, 0) +
               CASE WHEN rm.incubation_status = 'Incubated' THEN 10
                    WHEN rm.incubation_status IN ('Selected', 'Funded') THEN 8
                    WHEN rm.incubation_status = 'Under Review' THEN 4
                    ELSE 0 END +
               CASE WHEN COALESCE(cm.chat_count, 0) > 0 THEN 5 ELSE 0 END
             )::numeric, 1
           ) AS composite_score
    FROM student_base sb
    LEFT JOIN repo_metrics rm ON (rm.student_reg_no = sb.registration_no OR rm.student_reg_no = sb.rollno OR rm.student_name ILIKE sb.name)
    LEFT JOIN exam_metrics em ON em.student_id = sb.id
    LEFT JOIN att_metrics am ON am.student_id = sb.id
    LEFT JOIN chat_metrics cm ON cm.sender_id = sb.user_id
    WHERE (rm.project_score > 0 OR em.theory_pct > 0 OR sb.srms_attd_pct > 0 OR am.total_classes > 0 OR rm.incubation_status IS NOT NULL)
    ORDER BY composite_score DESC, rm.project_score DESC NULLS LAST, em.theory_pct DESC NULLS LAST
    LIMIT 20;
  `;

  const res = await pool.query(query);
  console.log('\n======================================================');
  console.log(`REAL EVALUATED HUSTLE BOARD TOPPERS (${res.rows.length} STUDENTS)`);
  console.log('======================================================\n');
  res.rows.forEach((s, idx) => {
    console.log(`#${idx + 1} | ${s.name} (Roll: ${s.rollno}) [${s.course_name || 'College'}, ${s.batch_name || '2025'}]`);
    console.log(`     🎯 Composite Score: ${s.composite_score} pts`);
    console.log(`     📂 Project: "${s.project_title || 'N/A'}" | Score: ${s.project_score}% (Grade ${s.project_grade}) | Incubation: ${s.incubation_status || 'None'}`);
    console.log(`     📝 Theory Exam: ${s.theory_pct ? s.theory_pct + '%' : 'Pending'} (${s.exam_name || 'No exam'})`);
    console.log(`     📊 Attendance: ${s.attendance_pct}% (Synced from SRMS Database) | Chat Active: ${s.is_chat_active}`);
    console.log('');
  });

  await pool.end();
}

computeRealHustleBoard().catch(console.error);
