/**
 * Strict Subject & Topic-wise Competency Filter (NMC Standards Compliant)
 * Ensures that slots (e.g. Physiology PYT2) ONLY show competencies belonging 
 * to their specific topic (e.g. PY2.1, PY2.2) and NEVER mix competencies from 
 * other topics (e.g. PY1.1) or other subjects (e.g. AN1.1).
 */

export interface CompetencyItem {
  code: string;
  description?: string;
  topicName?: string;
  topic_name?: string;
  subject_code?: string;
}

/**
 * Extracts canonical NMC Topic Number from topic title or code (e.g., "PYT2", "(PYT2)", "Topic 2" -> "2")
 */
export function extractTopicNumber(topicName?: string): string | null {
  if (!topicName) return null;
  const t = topicName.toUpperCase().trim();

  // Pattern 1: e.g. "PYT2", "ANT1", "BIT12", "PATH3" -> Match "T2", "T12"
  const pytMatch = t.match(/\b[A-Z]{2,4}T(\d+)\b/);
  if (pytMatch && pytMatch[1]) return pytMatch[1];

  // Pattern 2: e.g. "(PYT2)", "(AN1)" -> Match inside parentheses
  const parenMatch = t.match(/\(([A-Z]{2,4})T?(\d+)\)/);
  if (parenMatch && parenMatch[2]) return parenMatch[2];

  // Pattern 3: e.g. "PY2", "AN1"
  const codeMatch = t.match(/\b[A-Z]{2,4}(\d+)\b/);
  if (codeMatch && codeMatch[1]) return codeMatch[1];

  // Pattern 4: e.g. "Topic 2", "Topic-2", "Topic #2"
  const topicMatch = t.match(/TOPIC\s*[-#]?\s*(\d+)/i);
  if (topicMatch && topicMatch[1]) return topicMatch[1];

  return null;
}

/**
 * Flexible Day-of-Week Matching Engine
 * Handles 1-indexed (Mon=1..Thu=4..Sun=7), 0-indexed (Mon=0..Thu=3 or Sun=0),
 * string names ("Thursday", "Thu"), and numeric string comparisons.
 */
export function matchSlotDay(
  slotDay: number | string | undefined | null,
  selectedDay: number
): boolean {
  if (slotDay === undefined || slotDay === null) return false;

  const slotNum = Number(slotDay);
  if (!isNaN(slotNum)) {
    // 1-indexed exact match (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7)
    if (slotNum === selectedDay) return true;

    // 0-indexed Sunday (0 === 7)
    if (slotNum === 0 && selectedDay === 7) return true;

    return false;
  }

  const str = String(slotDay).toLowerCase().trim();
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayAbbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const targetName = dayNames[selectedDay - 1];
  const targetAbbrev = dayAbbrevs[selectedDay - 1];

  if (targetName && str.includes(targetName)) return true;
  if (targetAbbrev && str.includes(targetAbbrev)) return true;

  return false;
}

export function filterCompetenciesForSlot<T extends CompetencyItem>(
  competencies: T[],
  subjectCode?: string,
  subjectName?: string,
  topicName?: string
): T[] {
  if (!competencies || competencies.length === 0) return [];

  const sCode = (subjectCode || '').toUpperCase().trim();
  const sName = (subjectName || '').toUpperCase().trim();

  // 1. Detect Subject Prefix (PY, AN, BI, PA, etc.)
  let prefix = '';
  if (sCode.startsWith('PY') || sCode.includes('PHY') || sName.includes('PHYSIO')) {
    prefix = 'PY';
  } else if (sCode.startsWith('AN') || sCode.includes('ANA') || sName.includes('ANAT')) {
    prefix = 'AN';
  } else if (sCode.startsWith('BI') || sCode.startsWith('BC') || sCode.includes('BCH') || sName.includes('BIOCHEM')) {
    prefix = 'BI';
  } else if (sCode.startsWith('PA') || sCode.includes('PATH') || sName.includes('PATHOL')) {
    prefix = 'PA';
  } else if (sCode.startsWith('PH') || sCode.includes('PHARM') || sName.includes('PHARMACOL')) {
    prefix = 'PH';
  } else if (sCode.startsWith('FM') || sName.includes('FORENSIC')) {
    prefix = 'FM';
  } else if (sCode.startsWith('CM') || sName.includes('COMMUNITY')) {
    prefix = 'CM';
  } else if (sCode.startsWith('SU') || sName.includes('SURGERY')) {
    prefix = 'SU';
  } else if (sCode.startsWith('PE') || sName.includes('PEDIATRICS')) {
    prefix = 'PE';
  } else if (sCode.startsWith('OG') || sName.includes('OBSTETRICS')) {
    prefix = 'OG';
  }

  // 2. Extract Topic Number e.g. "2" from "Cardiac Action Potential & ECG Principles (PYT2)"
  const topicNum = extractTopicNumber(topicName);

  // 3. Construct Specific Topic Prefix e.g. "PY2."
  const specificPrefix = (prefix && topicNum) ? `${prefix}${topicNum}.` : (prefix || '');

  // 4. Try strict topic-number prefix matching first (e.g., PY2.)
  let filtered = competencies.filter((comp) => {
    const compCode = (comp.code || '').replace(/\(\d+\)/g, '').toUpperCase().trim();
    if (specificPrefix) {
      return compCode.startsWith(specificPrefix);
    }
    if (prefix) {
      return compCode.startsWith(prefix);
    }
    return true;
  });

  // 5. Fallback: If strict topic-number left 0 items, fallback to subject prefix matching (PY)
  if (filtered.length === 0 && prefix) {
    filtered = competencies.filter((comp) => {
      const compCode = (comp.code || '').replace(/\(\d+\)/g, '').toUpperCase().trim();
      return compCode.startsWith(prefix);
    });
  }

  return filtered;
}

/**
 * Filter a comma-separated competency string (e.g. "PY2.2, PY1.1, AN1.1") 
 * to strictly include topic-relevant codes matching the slot topic.
 */
export function filterCompetencyCodesString(
  rawCodesStr: string | null | undefined,
  subjectCode?: string,
  subjectName?: string,
  topicName?: string
): string {
  if (!rawCodesStr) return '';
  const codes = rawCodesStr.split(',').map((c) => c.trim()).filter(Boolean);

  const sCode = (subjectCode || '').toUpperCase().trim();
  const sName = (subjectName || '').toUpperCase().trim();

  let prefix = '';
  if (sCode.startsWith('PY') || sCode.includes('PHY') || sName.includes('PHYSIO')) prefix = 'PY';
  else if (sCode.startsWith('AN') || sCode.includes('ANA') || sName.includes('ANAT')) prefix = 'AN';
  else if (sCode.startsWith('BI') || sCode.startsWith('BC') || sCode.includes('BCH') || sName.includes('BIOCHEM')) prefix = 'BI';
  else if (sCode.startsWith('PA') || sCode.includes('PATH') || sName.includes('PATHOL')) prefix = 'PA';
  else if (sCode.startsWith('PH') || sCode.includes('PHARM') || sName.includes('PHARMACOL')) prefix = 'PH';

  const topicNum = extractTopicNumber(topicName);
  const specificPrefix = (prefix && topicNum) ? `${prefix}${topicNum}.` : (prefix || '');

  if (!specificPrefix) return codes.join(', ');

  // 1. Try matching specific topic prefix (e.g. PY2.)
  let filtered = codes.filter((code) => {
    const clean = code.replace(/\(\d+\)/g, '').toUpperCase().trim();
    return clean.startsWith(specificPrefix);
  });

  // 2. Fallback to subject prefix (e.g. PY) if no specific topic prefix matches
  if (filtered.length === 0 && prefix) {
    filtered = codes.filter((code) => {
      const clean = code.replace(/\(\d+\)/g, '').toUpperCase().trim();
      return clean.startsWith(prefix);
    });
  }

  return filtered.length > 0 ? filtered.join(', ') : codes.join(', ');
}
