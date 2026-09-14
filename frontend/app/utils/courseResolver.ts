/**
 * Course and Department title resolver utility for MedERP
 * Accurately maps numerical course codes and department identifiers across SRMS and other institutions
 */

export function resolveCourseTitle(courseCd?: string | number | null, fallbackName?: string | null): string {
  const cd = String(courseCd || '').trim();
  const name = String(fallbackName || '').trim();

  // Check code first
  switch (cd) {
    case '1':
      return 'B.Tech';
    case '2':
      return 'B.Pharm';
    case '3':
      return 'MCA';
    case '4':
      return 'MBA';
    case '5':
      return 'M.Tech';
    case '6':
      return 'M.Pharm';
    case '7':
      return 'B.Tech (Lateral Entry)';
    case '8':
      return 'B.Pharma (Lateral Entry)';
    case '9':
      return 'MCA (Lateral Entry)';
    case '11':
      return 'BA.LL.B';
    case '12':
      return 'BBA';
    case '13':
      return 'BCA';
  }

  // If code is not an exact match, check string hints
  const lowerName = name.toLowerCase();
  if (lowerName.includes('mba')) return 'MBA';
  if (lowerName.includes('bca')) return 'BCA';
  if (lowerName.includes('b.tech') || lowerName === 'btech' || lowerName.includes('b. tech')) return 'B.Tech';
  if (lowerName.includes('b.pharm') || lowerName.includes('bpharma') || lowerName.includes('b. pharma')) return 'B.Pharm';
  if (lowerName.includes('mca')) return 'MCA';
  if (lowerName.includes('m.tech') || lowerName === 'mtech') return 'M.Tech';
  if (lowerName.includes('m.pharm') || lowerName.includes('mpharma')) return 'M.Pharm';
  if (lowerName.includes('bba')) return 'BBA';
  if (lowerName.includes('ll.b') || lowerName.includes('llb') || lowerName.includes('law')) return 'BA.LL.B';
  if (lowerName.includes('mbbs')) return 'MBBS';

  if (name && name !== '1' && name !== '2' && name !== '3' && name !== '4' && name !== '13') {
    return name;
  }

  return cd ? `Course ${cd}` : 'Student';
}

export function resolveDepartmentTitle(courseCd?: string | number | null, deptName?: string | null): string {
  const cd = String(courseCd || '').trim();
  const d = String(deptName || '').trim();
  const lowerDept = d.toLowerCase();

  if (cd === '4' || lowerDept.includes('mba')) return 'MBA Department';
  if (cd === '3' || cd === '9' || lowerDept.includes('mca')) return 'Master of Computer Applications';
  if (cd === '13' || lowerDept.includes('bca')) return 'BCA Department';
  if (cd === '2' || cd === '6' || cd === '8' || lowerDept.includes('pharm')) return 'Faculty of Pharmacy';
  if (cd === '11' || lowerDept.includes('law')) return 'Faculty of Law';
  if (cd === '12' || lowerDept.includes('business')) return 'Department of Business Administration';

  if (d && !['bca general', 'computer science & engineering', 'academic department', '-', '1', '4', '13'].includes(lowerDept)) {
    return d;
  }

  if (cd === '1' || cd === '7') return 'Department of Computer Science & Engineering';

  return d || 'Academic Department';
}
