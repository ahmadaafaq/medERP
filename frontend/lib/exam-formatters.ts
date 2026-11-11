/**
 * Shared Exam Formatting Utilities
 * Standardizes Course Names and Semester Display across MedERP Examination Suite
 */

const COURSE_MAP: Record<string, string> = {
  '1': 'B.Tech',
  'BTECH': 'B.Tech',
  'B.TECH': 'B.Tech',
  'B.TECH.': 'B.Tech',
  '2': 'B.Pharm',
  'BPHARM': 'B.Pharm',
  'B.PHARM': 'B.Pharm',
  'B.PHARM.': 'B.Pharm',
  '3': 'MCA',
  'MCA': 'MCA',
  '4': 'MBA',
  'MBA': 'MBA',
  '5': 'M.Tech',
  'MTECH': 'M.Tech',
  'M.TECH': 'M.Tech',
  'M.TECH.': 'M.Tech',
  '6': 'M.Pharm',
  'MPHARM': 'M.Pharm',
  'M.PHARM': 'M.Pharm',
  'M. PHARM.': 'M.Pharm',
  '7': 'B.Tech (Lateral Entry)',
  '8': 'B.Pharma (Lateral Entry)',
  '9': 'MCA (Lateral Entry)',
  '11': 'BA.LL.B',
  '12': 'BBA',
  'BBA': 'BBA',
  '13': 'BCA',
  'BCA': 'BCA',
};

/**
 * Formats numeric or raw course code into proper academic title (e.g. 13 -> BCA, 4 -> MBA, 3 -> MCA, 1 -> B.Tech)
 */
export function formatCourseName(courseCd?: string | number | null, courseName?: string | null, tenantSlug?: string | null): string {
  if (courseName && courseName.trim()) {
    const rawName = courseName.trim();
    const upperName = rawName.toUpperCase();
    if (upperName === 'B.TECH.' || upperName === 'B.TECH') return 'B.Tech';
    if (upperName === 'B.PHARM.' || upperName === 'B.PHARM') return 'B.Pharm';
    if (upperName === 'M.TECH.' || upperName === 'M.TECH') return 'M.Tech';
    if (upperName === 'M. PHARM.' || upperName === 'M.PHARM') return 'M.Pharm';
    return rawName;
  }

  const rawCd = String(courseCd || '').trim().toUpperCase();
  if (!rawCd) return '';

  // Determine if active tenant is SRMS
  let slug = (tenantSlug || '').toLowerCase();
  if (!slug && typeof window !== 'undefined') {
    slug = (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('tenant') ||
      ''
    ).toLowerCase();
  }
  const isSrms = slug.includes('srms');

  // Only map numeric codes to B.Tech, MCA etc. if tenant is SRMS
  if (isSrms && COURSE_MAP[rawCd]) {
    return COURSE_MAP[rawCd];
  }

  // Non-numeric standard names (e.g. BBA, BCA, MBA) can still be returned
  if (!/^\d+$/.test(rawCd) && COURSE_MAP[rawCd]) {
    return COURSE_MAP[rawCd];
  }

  return rawCd ? `Course ${rawCd}` : '';
}

/**
 * Formats semester so numeric code value is never displayed alone (e.g. 3 -> Semester 3, 1 -> Semester 1)
 */
export function formatSemesterOnly(semester?: string | number | null): string {
  if (!semester) return '';
  const str = String(semester).trim();
  if (str.toLowerCase().startsWith('semester')) return str;
  const digits = str.replace(/[^0-9]/g, '');
  if (digits) return `Semester ${digits}`;
  return str.replace(/^Sem\b/i, 'Semester');
}

/**
 * Formats section label cleanly (e.g. 'A' -> 'Section A', 'Section A' -> 'Section A')
 */
const NUM_TO_LETTER: Record<string, string> = {
  '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E',
  '6': 'F', '7': 'G', '8': 'H', '9': 'I', '10': 'J',
};

export function formatSectionOnly(section?: string | null): string {
  if (!section) return '';
  const str = String(section).trim();
  const lower = str.toLowerCase();
  if (lower === 'all' || lower === 'all sections' || lower.includes('common')) {
    return 'Common (All Sections)';
  }

  // If already matches Section A(1) or Section A
  const letterMatch = str.match(/\b([a-jA-J])\b/);
  if (letterMatch) {
    return `Section ${letterMatch[1].toUpperCase()}`;
  }

  // If numeric code 1 to 10
  const numMatch = str.match(/\b(10|[1-9])\b/);
  if (numMatch && NUM_TO_LETTER[numMatch[1]]) {
    return `Section ${NUM_TO_LETTER[numMatch[1]]}`;
  }

  const clean = str.replace(/^sec(tion)?\s*/i, '').replace(/\s*\(\d+\)\s*/g, '').trim();
  return clean ? `Section ${clean}` : 'Section A';
}

/**
 * Combined Semester & Section display (e.g. 'Semester 3 (Section A)')
 */
export function formatSemester(semester?: string | number | null, section?: string | null): string {
  const semStr = formatSemesterOnly(semester);
  const secStr = formatSectionOnly(section);

  if (semStr && secStr) return `${semStr} (${secStr})`;
  if (semStr) return semStr;
  if (secStr) return secStr;
  return '';
}
