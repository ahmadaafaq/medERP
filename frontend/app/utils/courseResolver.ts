/**
 * Course and Department title resolver utility for MedERP
 * Accurately maps numerical course codes and department identifiers across SRMS and other institutions
 */

export function resolveCourseTitle(courseCd?: string | number | null, fallbackName?: string | null): string {
  const cd = String(courseCd || '').trim();
  const name = String(fallbackName || '').trim();
  const lowerName = name.toLowerCase();

  // 1. If explicit authentic course name is provided from database, prioritize it!
  if (lowerName.includes('bca')) return 'BCA';
  if (lowerName.includes('mba')) return 'MBA';
  if (lowerName.includes('b.tech') || lowerName === 'btech' || lowerName.includes('b. tech')) return 'B.Tech';
  if (lowerName.includes('b.pharm') || lowerName.includes('bpharma') || lowerName.includes('b. pharma')) return 'B.Pharm';
  if (lowerName.includes('mca')) return 'MCA';
  if (lowerName.includes('m.tech') || lowerName === 'mtech') return 'M.Tech';
  if (lowerName.includes('m.pharm') || lowerName.includes('mpharma')) return 'M.Pharm';
  if (lowerName.includes('bba')) return 'BBA';
  if (lowerName.includes('ll.b') || lowerName.includes('llb') || lowerName.includes('law')) return 'BA.LL.B';
  if (lowerName.includes('mbbs')) return 'MBBS';

  if (name && !['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '12', '13', 'null', 'undefined', ''].includes(lowerName)) {
    return name;
  }

  // 2. Fall back to numerical code mapping only if no real name was provided
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

  return cd ? `Course ${cd}` : 'Student';
}

export function resolveDepartmentTitle(
  courseCd?: string | number | null,
  deptName?: string | null,
  branchCd?: string | number | null,
): string {
  const cd = String(courseCd || '').trim();
  const d = String(deptName || '').trim();
  const br = String(branchCd || '').trim();
  const lowerDept = d.toLowerCase();

  // If department name mistakenly contains law/ba.ll.b for non-law courses, discard and resolve from courseCd
  if (cd !== '11' && (lowerDept.includes('law') || lowerDept.includes('ll.b') || lowerDept.includes('llb') || lowerDept.includes('ba.ll.b'))) {
    if (cd === '1' || cd === '7') {
      return br === '2' ? '(IT)' : '(CSE)';
    }
    if (cd === '2' || cd === '6' || cd === '8') return 'B.PHARM. Department';
    if (cd === '3' || cd === '9') return 'MCA Department';
    if (cd === '4') return 'MBA Department';
    if (cd === '13') return 'BCA Department';
  }

  if (cd === '4' || lowerDept.includes('mba')) return 'MBA Department';
  if (cd === '3' || cd === '9' || lowerDept.includes('mca')) return 'MCA Department';
  if (cd === '13' || lowerDept.includes('bca')) return 'BCA Department';
  if (cd === '2' || cd === '6' || cd === '8' || lowerDept.includes('pharm')) return 'B.PHARM. Department';
  if (cd === '11' || lowerDept.includes('law')) return 'Faculty of Law';
  if (cd === '12' || lowerDept.includes('business')) return 'Department of Business Administration';

  // Preserve specific engineering branches
  if (lowerDept.includes('(it)') || lowerDept.includes('information tech') || (cd === '1' && br === '2')) return '(IT)';
  if (lowerDept.includes('(cse)') || lowerDept.includes('computer science') || (cd === '1' && (br === '1' || !br))) return '(CSE)';
  if (lowerDept.includes('(ece)') || lowerDept.includes('electronics')) return '(ECE)';
  if (lowerDept.includes('(me)') || lowerDept.includes('mechanical')) return '(ME)';

  if (d && !['bca general', 'computer science & engineering', 'academic department', '-', '1', '4', '13', 'null'].includes(lowerDept)) {
    return d;
  }

  if (cd === '1' || cd === '7') return br === '2' ? '(IT)' : '(CSE)';

  return d || 'Academic Department';
}
