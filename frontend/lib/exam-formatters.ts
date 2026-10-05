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
export function formatCourseName(courseCd?: string | number | null, courseName?: string | null): string {
  if (courseName && courseName.trim()) {
    const rawName = courseName.trim();
    const upperName = rawName.toUpperCase();
    if (COURSE_MAP[upperName]) return COURSE_MAP[upperName];
    if (upperName === 'B.TECH.' || upperName === 'B.TECH') return 'B.Tech';
    if (upperName === 'B.PHARM.' || upperName === 'B.PHARM') return 'B.Pharm';
    if (upperName === 'M.TECH.' || upperName === 'M.TECH') return 'M.Tech';
    if (upperName === 'M. PHARM.' || upperName === 'M.PHARM') return 'M.Pharm';
    return rawName;
  }

  const rawCd = String(courseCd || '').trim().toUpperCase();
  if (COURSE_MAP[rawCd]) return COURSE_MAP[rawCd];

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
export function formatSectionOnly(section?: string | null): string {
  if (!section) return '';
  const str = String(section).trim();
  if (str.toLowerCase().startsWith('section') || str.toLowerCase().startsWith('sec')) {
    return str.replace(/^Sec\b/i, 'Section');
  }
  return `Section ${str}`;
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
