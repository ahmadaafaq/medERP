const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { StudentMasterService } = require('../dist/student-master/student-master.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const service = app.get(StudentMasterService);

  console.log('=== 1. ALL STUDENTS ===');
  const all = await service.listStudents('all', {});
  console.log('Total students across all tenants:', all.length);

  console.log('\n=== 2. CET STUDENTS ===');
  const cetAll = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly' });
  console.log('Total students in CET:', cetAll.length);

  console.log('\n=== 3. CET BCA STUDENTS ===');
  const bca = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly', courseId: 'BCA' });
  console.log('Total BCA students in CET:', bca.length);
  if (bca.length > 0) {
    console.log('Sample BCA student:', {
      name: bca[0].name,
      rollno: bca[0].rollno,
      registration_no: bca[0].registration_no,
      course_code: bca[0].course_code,
      batch_code: bca[0].batch_code,
      college_name: bca[0].college_name,
      branch_code: bca[0].branch_code
    });
  }

  console.log('\n=== 4. CET BCA BATCH 2025 ===');
  const bca2025 = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly', courseId: 'BCA', batchId: '2025' });
  console.log('Total BCA 2025 students:', bca2025.length);

  console.log('\n=== 5. CET B.TECH STUDENTS ===');
  const btech = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly', courseId: 'B.TECH.' });
  console.log('Total B.Tech students:', btech.length);

  console.log('\n=== 6. CET MCA STUDENTS ===');
  const mca = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly', courseId: 'MCA' });
  console.log('Total MCA students:', mca.length);

  console.log('\n=== 7. CET MBA STUDENTS ===');
  const mba = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly', courseId: 'MBA' });
  console.log('Total MBA students:', mba.length);

  console.log('\n=== 8. CET B.PHARM STUDENTS ===');
  const bpharm = await service.listStudents('srms-cet-bareilly', { collegeId: 'srms-cet-bareilly', courseId: 'B.PHARM.' });
  console.log('Total B.Pharm students:', bpharm.length);

  await app.close();
}

test().catch(console.error);
