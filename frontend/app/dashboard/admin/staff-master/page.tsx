'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface College {
  id: string;
  code: string;
  name: string;
  slug: string;
}

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  gender?: string;
  experience?: string;
  staff_type: string;
  is_active: boolean;
  photo_url?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  role?: string;
  qualification?: string;
  specialization?: string;
  date_of_joining?: string;
  joining_date?: string;
  date_of_birth?: string;
  blood_group?: string;
  father_name?: string;
  spouse_name?: string;
  address?: string;
  perm_addr?: string;
  city?: string;
  state?: string;
  caste?: string;
  pan_no?: string;
  aadhaar_no?: string;
  uan?: string;
  bank_ac_no?: string;
  current_basic?: number;
  device_cd?: string;
  salgrade?: string;
  highest_education?: string;
  category?: string;
  payroll_category?: string;
  employment_status?: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  branch_cd?: string;
  course_cd?: string;
  course_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  colg_cd?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  branch_cd?: string;
  course_cd?: string;
  course_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  colg_cd?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const SRMS_FIRM_OPTIONS = [
  { locid: '7', label: '[Loc 7] SRMS CET, Bareilly (Engineering & Pharmacy)', slug: 'srms-cet-bareilly' },
  { locid: '8', label: '[Loc 8] SRMS CETR, Bareilly (Engineering & Research)', slug: 'srms-cetr-bareilly' },
  { locid: '1', label: '[Loc 1] SRMS IMS, Bareilly (Medical College & Hospital)', slug: 'srms-ims' },
  { locid: '3', label: '[Loc 3] SRMS CET, Unnao Campus', slug: 'srms-cet-unnao' },
  { locid: '4', label: '[Loc 4] SRMS IBS, Lucknow (Business School)', slug: 'srms-ibs-lucknow' },
  { locid: '12', label: '[Loc 12] SRMS College of Pharmacy', slug: 'srms-pharmacy' },
  { locid: '15', label: '[Loc 15] SRMS College of Law', slug: 'srms-college-of-law' },
  { locid: '18', label: '[Loc 18] SRMS Nursing College, Bareilly', slug: 'srms-nursing-college' },
  { locid: 'all', label: '🌐 All SRMS Firm Locations & Institutions', slug: 'all' },
];

const STANDARD_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Head of Department (HOD)',
  'Dean / Director / Principal',
  'Registrar / Executive Officer',
  'Senior Resident',
  'Junior Resident',
  'Tutor / Demonstrator',
  'Medical Officer',
  'Medical Superintendent',
  'Lab Instructor / Technician',
  'Administrative Officer',
  'Assistant Registrar',
  'Senior Clerk',
  'Junior Clerk / Office Assistant',
  'Accountant',
  'System Administrator / IT In-charge',
  'Warden / Hostel In-charge',
  'Other / Custom',
];

export default function StaffMasterPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filtering and pagination
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStaffTypeFilter, setSelectedStaffTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Faculty | null>(null);
  const [detailFaculty, setDetailFaculty] = useState<Faculty | null>(null);

  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncLocId, setSyncLocId] = useState('7');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    count: number;
    message: string;
    teachingCount?: number;
    nonTeachingCount?: number;
  } | null>(null);

  // Excel / CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetCollege, setImportTargetCollege] = useState('srms-cet-bareilly');
  const [importFileName, setImportFileName] = useState('');
  const [importParsedRows, setImportParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    createdCount: number;
    updatedCount: number;
    failedCount: number;
    failedItems?: { empId: string; name: string; error: string }[];
  } | null>(null);

  // Custom Designation control
  const [selectedDesignationOption, setSelectedDesignationOption] = useState('Assistant Professor');
  const [customDesignationText, setCustomDesignationText] = useState('');

  // Upload photo states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Form State with ALL demographic, academic, and payroll fields
  const [formData, setFormData] = useState({
    college_id: '',
    college_slug: '',
    empId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Assistant Professor',
    departmentId: '',
    subjectId: '',
    gender: 'Male',
    experience: '',
    staffType: 'Faculty',
    photoUrl: '',
    isActive: true,
    qualification: '',
    dateOfBirth: '',
    dateOfJoining: '',
    bloodGroup: '',
    fatherName: '',
    spouseName: '',
    address: '',
    city: 'Bareilly',
    state: 'Uttar Pradesh',
    caste: 'General',
    panNo: '',
    aadhaarNo: '',
    salgrade: 'Standard',
    currentBasic: 0,
  });

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // User Auth & Tenant Context State
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>('srms-cet-bareilly');

  // 1. Initial Metadata Fetch
  const fetchMetadata = async () => {
    setMetadataLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      let role = 'ADMIN';
      let userColg = '1';
      let userSlug = 'srms-cet-bareilly';
      if (typeof window !== 'undefined') {
        role = (localStorage.getItem('role') || 'ADMIN').toUpperCase();
        userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        userSlug = (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly')
          .replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
        if (userSlug === 'srms-cet') userSlug = 'srms-cet-bareilly';
        if (userSlug === 'srms-cetr') userSlug = 'srms-cetr-bareilly';
        setUserRole(role);
        setUserColgCd(userColg);
        setUserTenantSlug(userSlug);
        if (role !== 'SUPER_ADMIN') {
          setSelectedCollegeFilter('all');
        }
      }

      const activeTenantSlug = role === 'SUPER_ADMIN' ? 'all' : userSlug;

      const [colRes, deptRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/colleges`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
      ]);

      let loadedColleges: College[] = [];
      let loadedDepts: Department[] = [];
      let loadedSubs: Subject[] = [];

      if (colRes && colRes.ok) {
        const colJson = await colRes.json();
        const colList = colJson.data || colJson;
        if (Array.isArray(colList)) {
          if (role !== 'SUPER_ADMIN') {
            const myCol = colList.find((c: any) => String(c.colg_cd) === String(userColg) || String(c.code) === String(userColg) || c.slug === userSlug);
            loadedColleges = myCol ? [myCol] : [{ id: userColg, code: userColg, name: 'SRMS CET, Bareilly', slug: userSlug }];
          } else {
            loadedColleges = colList;
          }
          setColleges(loadedColleges);
        }
      }

      if (deptRes && deptRes.ok) {
        const deptJson = await deptRes.json();
        const deptList = deptJson.data || deptJson;
        if (Array.isArray(deptList)) {
          loadedDepts = deptList;
          setDepartments(deptList);
        }
      }

      if (subRes && subRes.ok) {
        const subJson = await subRes.json();
        const subList = subJson.data || subJson;
        if (Array.isArray(subList)) {
          loadedSubs = subList;
          setSubjects(subList);
        }
      }

      if (loadedColleges.length > 0) {
        const firstCol = loadedColleges[0];
        const firstColCd = firstCol.code || firstCol.id || '1';
        const matchingDepts = loadedDepts.filter(d =>
          d.college_id === firstCol.id ||
          d.college_slug === firstCol.slug ||
          String(d.colg_cd) === String(firstColCd) ||
          String(d.college_code) === String(firstColCd)
        );
        const firstDept = matchingDepts[0];

        setFormData(prev => ({
          ...prev,
          college_id: prev.college_id || firstColCd,
          college_slug: prev.college_slug || firstCol.slug || '',
          departmentId: prev.departmentId || firstDept?.id || firstDept?.code || '',
        }));
      }
    } catch (err) {
      console.error('[StaffMaster] Metadata fetch error:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  // 2. Fetch Faculties
  const fetchFaculties = async (colFilter: string = selectedCollegeFilter) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

      const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'ADMIN').toUpperCase() : 'ADMIN';
      const rawSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
      let userSlug = rawSlug.replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
      if (userSlug === 'srms-cet') userSlug = 'srms-cet-bareilly';
      if (userSlug === 'srms-cetr') userSlug = 'srms-cetr-bareilly';

      let querySlug = userSlug;
      if (role === 'SUPER_ADMIN') {
        const targetCollege = colleges.find(c => String(c.code) === String(colFilter) || String(c.id) === String(colFilter) || c.slug === colFilter);
        querySlug = colFilter === 'all' ? 'all' : (targetCollege?.slug || colFilter || userSlug);
      }

      const headers: Record<string, string> = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-tenant-slug': querySlug,
        'x-tenant': querySlug,
      };

      const res = await fetch(`${API_BASE}/users/faculty?tenant=${querySlug}&limit=1000`, { headers });
      if (res.ok) {
        const json = await res.json();
        let dataList: Faculty[] = [];
        if (Array.isArray(json)) {
          dataList = json;
        } else if (Array.isArray(json?.data?.data)) {
          dataList = json.data.data;
        } else if (Array.isArray(json?.data)) {
          dataList = json.data;
        } else if (Array.isArray(json?.items)) {
          dataList = json.items;
        }
        const seen = new Set<string>();
        const dedupedList = dataList.filter(f => {
          const key = f.emp_id || f.id || f.email;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFaculties(dedupedList);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('[StaffMaster] Failed to fetch staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchFaculties(selectedCollegeFilter);
  }, [selectedCollegeFilter, colleges.length]);

  // Execute Live Sync with SRMS HR API
  const handleExecuteSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`${API_BASE}/college-master/employees/sync-external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ locid: syncLocId }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const items = Array.isArray(json.data) ? json.data : [];
        const teaching = items.filter((i: any) => (i.staffType || '').toLowerCase() === 'faculty').length;
        const nonTeaching = items.length - teaching;

        setSyncResult({
          success: true,
          count: json.count || items.length,
          message: json.message || `Synced ${items.length} employees from SRMS HR API!`,
          teachingCount: teaching,
          nonTeachingCount: nonTeaching,
        });

        showAlert('success', `⚡ Successfully synced ${items.length} employees with password '12345678' and full photo URLs!`);
        fetchFaculties(selectedCollegeFilter);
      } else {
        setSyncResult({
          success: false,
          count: 0,
          message: json.message || 'Failed to sync employees from SRMS HR API.',
        });
        showAlert('error', json.message || 'HR sync error occurred.');
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        count: 0,
        message: err?.message || 'Network error during sync execution.',
      });
      showAlert('error', 'Network error during sync execution.');
    } finally {
      setSyncing(false);
    }
  };

  // ─── EXCEL / CSV IMPORT & SAMPLE DOWNLOAD LOGIC ───

  // Download official Excel/CSV Sample Template
  const handleDownloadSampleFormat = () => {
    const headers = [
      'emp_id',
      'name',
      'email',
      'phone',
      'designation',
      'staff_type',
      'role',
      'department_code',
      'gender',
      'qualification',
      'experience',
      'date_of_joining',
      'date_of_birth',
      'blood_group',
      'father_name',
      'address',
      'city',
      'state',
      'pan_no',
      'aadhaar_no',
      'initial_password',
    ];

    const sampleRows = [
      [
        'EMP1001',
        'Dr. Ramesh Chandra',
        'ramesh.chandra@srms.ac.in',
        '9876543210',
        'Professor',
        'Faculty',
        'FACULTY',
        'CS',
        'Male',
        'Ph.D (Computer Science), M.Tech',
        '14 Years',
        '2018-07-15',
        '1980-04-12',
        'B+',
        'Late S. N. Chandra',
        '45 Civil Lines',
        'Bareilly',
        'Uttar Pradesh',
        'ABCDE1234F',
        '123456789012',
        'Temp@1234',
      ],
      [
        'EMP1002',
        'Dr. Priya Sharma',
        'priya.sharma@srms.ac.in',
        '9876543211',
        'Associate Professor',
        'Faculty',
        'HOD',
        'IT',
        'Female',
        'M.Tech (Information Technology)',
        '9 Years',
        '2020-01-10',
        '1986-09-22',
        'O+',
        'Mr. K. P. Sharma',
        '12 Rajendra Nagar',
        'Bareilly',
        'Uttar Pradesh',
        'FGHIJ5678K',
        '234567890123',
        'Temp@1234',
      ],
      [
        'EMP1003',
        'Er. Amit Verma',
        'amit.verma@srms.ac.in',
        '9876543212',
        'Assistant Professor',
        'Faculty',
        'FACULTY',
        'ME',
        'Male',
        'M.Tech (Mechanical Engineering)',
        '5 Years',
        '2022-08-01',
        '1992-11-05',
        'A+',
        'Mr. V. K. Verma',
        '78 Model Town',
        'Bareilly',
        'Uttar Pradesh',
        'KLMNO9012P',
        '345678901234',
        'Temp@1234',
      ],
      [
        'EMP1004',
        'Sunil Kumar Rastogi',
        'sunil.rastogi@srms.ac.in',
        '9876543213',
        'Senior Clerk',
        'CLERK',
        'CLERK',
        'ADM',
        'Male',
        'B.Com, PGDCA',
        '11 Years',
        '2015-03-20',
        '1984-06-18',
        'AB+',
        'Mr. R. L. Rastogi',
        '89 Station Road',
        'Bareilly',
        'Uttar Pradesh',
        'PQRST3456U',
        '456789012345',
        'Temp@1234',
      ],
      [
        'EMP1005',
        'Dr. Sanjay Singh',
        'sanjay.singh@srms.ac.in',
        '9876543214',
        'Professor & HOD',
        'Faculty',
        'HOD',
        'ANAT',
        'Male',
        'MD (Anatomy), MBBS',
        '18 Years',
        '2012-09-01',
        '1976-03-14',
        'O+',
        'Dr. M. P. Singh',
        'Campus Residence A-4',
        'Bareilly',
        'Uttar Pradesh',
        'UVWXY7890Z',
        '567890123456',
        'Temp@1234',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...sampleRows.map((e) =>
          e.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MedERP_Staff_Import_Sample_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV parser supporting quotes, commas, and multiline values
  const parseCSVText = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
    }
    return rows;
  };

  // Handle uploaded spreadsheet file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rawRows = parseCSVText(text);

        if (rawRows.length < 2) {
          showAlert('error', 'File contains no data rows. Header row + at least 1 record required.');
          return;
        }

        const rawHeaders = rawRows[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));
        const dataRows = rawRows.slice(1);

        // Header mapping helper
        const getIdx = (...keys: string[]) => {
          for (const k of keys) {
            const normalized = k.toLowerCase().replace(/[\s_-]+/g, '');
            const idx = rawHeaders.findIndex((h) => h === normalized || h.includes(normalized));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const empIdIdx = getIdx('empid', 'emp_id', 'employeecode', 'code', 'staffid');
        const nameIdx = getIdx('name', 'staffname', 'facultyname', 'fullname');
        const emailIdx = getIdx('email', 'emailaddress', 'mail');
        const phoneIdx = getIdx('phone', 'mobile', 'contact', 'phonenumber');
        const desigIdx = getIdx('designation', 'post', 'title');
        const staffTypeIdx = getIdx('stafftype', 'staff_type', 'type');
        const roleIdx = getIdx('role', 'systemrole');
        const deptIdx = getIdx('departmentcode', 'department_code', 'department', 'dept', 'deptcode');
        const genderIdx = getIdx('gender', 'sex');
        const qualIdx = getIdx('qualification', 'degree');
        const expIdx = getIdx('experience', 'exp');
        const dojIdx = getIdx('dateofjoining', 'date_of_joining', 'joiningdate', 'doj');
        const dobIdx = getIdx('dateofbirth', 'date_of_birth', 'dob');
        const bgIdx = getIdx('bloodgroup', 'blood_group');
        const fatherIdx = getIdx('fathername', 'father_name');
        const addrIdx = getIdx('address', 'permaddr');
        const cityIdx = getIdx('city');
        const stateIdx = getIdx('state');
        const panIdx = getIdx('panno', 'pan_no', 'pan');
        const aadhaarIdx = getIdx('aadhaarno', 'aadhaar_no', 'aadhaar');
        const passIdx = getIdx('initialpassword', 'password', 'temp_password', 'temppassword');

        const parsedList = dataRows.map((row, rowNum) => {
          const empId = empIdIdx !== -1 ? row[empIdIdx] || '' : `EMP${rowNum + 1000}`;
          const name = nameIdx !== -1 ? row[nameIdx] || '' : '';
          const email = emailIdx !== -1 ? row[emailIdx] || '' : `${empId.toLowerCase()}@srms.ac.in`;
          const phone = phoneIdx !== -1 ? row[phoneIdx] || '' : '';
          const designation = desigIdx !== -1 ? row[desigIdx] || 'Assistant Professor' : 'Assistant Professor';
          const staffType = staffTypeIdx !== -1 ? row[staffTypeIdx] || 'Faculty' : 'Faculty';
          const role = roleIdx !== -1 ? row[roleIdx] || 'FACULTY' : 'FACULTY';
          const departmentCode = deptIdx !== -1 ? row[deptIdx] || '' : '';
          const gender = genderIdx !== -1 ? row[genderIdx] || 'Male' : 'Male';
          const qualification = qualIdx !== -1 ? row[qualIdx] || '' : '';
          const experience = expIdx !== -1 ? row[expIdx] || '' : '';
          const dateOfJoining = dojIdx !== -1 ? row[dojIdx] || '' : '';
          const dateOfBirth = dobIdx !== -1 ? row[dobIdx] || '' : '';
          const bloodGroup = bgIdx !== -1 ? row[bgIdx] || '' : '';
          const fatherName = fatherIdx !== -1 ? row[fatherIdx] || '' : '';
          const address = addrIdx !== -1 ? row[addrIdx] || '' : '';
          const city = cityIdx !== -1 ? row[cityIdx] || 'Bareilly' : 'Bareilly';
          const state = stateIdx !== -1 ? row[stateIdx] || 'Uttar Pradesh' : 'Uttar Pradesh';
          const panNo = panIdx !== -1 ? row[panIdx] || '' : '';
          const aadhaarNo = aadhaarIdx !== -1 ? row[aadhaarIdx] || '' : '';
          const password = passIdx !== -1 && row[passIdx] ? row[passIdx] : 'Temp@1234';

          const isValid = Boolean(empId && name && email);

          return {
            empId,
            name,
            email,
            phone,
            designation,
            staffType,
            role,
            departmentId: departmentCode,
            departmentCode,
            gender,
            qualification,
            experience,
            dateOfJoining,
            dateOfBirth,
            bloodGroup,
            fatherName,
            address,
            city,
            state,
            panNo,
            aadhaarNo,
            password,
            isActive: true,
            isValid,
          };
        });

        setImportParsedRows(parsedList);
        showAlert('success', `Parsed ${parsedList.length} rows from ${file.name}. Review preview below!`);
      } catch (err: any) {
        showAlert('error', `Failed to parse CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Faculty Import to Backend for Target College
  const handleExecuteImport = async () => {
    if (importParsedRows.length === 0) {
      showAlert('error', 'No staff rows to import.');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const chosenCollege = colleges.find(
        (c) => c.slug === importTargetCollege || c.code === importTargetCollege || c.id === importTargetCollege
      );
      const targetSlug = chosenCollege?.slug || importTargetCollege || 'srms-cet-bareilly';
      const targetColId = chosenCollege?.id || targetSlug;

      const payload = {
        faculty: importParsedRows.map((r) => {
          const { isValid, ...cleanRow } = r;
          let aadhaar = cleanRow.aadhaarNo ? String(cleanRow.aadhaarNo).trim() : '';
          if (aadhaar.includes('E+') || aadhaar.includes('e+')) {
            const num = Number(aadhaar);
            if (!isNaN(num)) aadhaar = num.toLocaleString('fullwide', { useGrouping: false });
          }
          return {
            ...cleanRow,
            aadhaarNo: aadhaar,
            college_id: targetColId,
            college_slug: targetSlug,
          };
        }),
      };

      const res = await fetch(`${API_BASE}/users/faculty/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        const createdCount = Array.isArray(json.created) ? json.created.length : 0;
        const updatedCount = Array.isArray(json.updated) ? json.updated.length : 0;
        const failedItems = Array.isArray(json.failed) ? json.failed : [];
        const failedCount = failedItems.length;

        setImportResult({
          success: true,
          createdCount,
          updatedCount,
          failedCount,
          failedItems,
        });

        showAlert(
          'success',
          `🎉 Bulk Staff Import complete! (${createdCount} Created, ${updatedCount} Updated, ${failedCount} Failed)`
        );
        fetchFaculties(selectedCollegeFilter);
      } else {
        setImportResult({
          success: false,
          createdCount: 0,
          updatedCount: 0,
          failedCount: importParsedRows.length,
          failedItems: [{ empId: 'ALL', name: 'Batch', error: json.message || 'Server Error' }],
        });
        showAlert('error', json.message || 'Failed to import staff batch.');
      }
    } catch (err: any) {
      showAlert('error', `Import request failed: ${err?.message || 'Network error'}`);
    } finally {
      setImporting(false);
    }
  };

  // Convert uploaded photo file to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('error', 'File size exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData(prev => ({ ...prev, photoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photoUrl: '' }));
  };

  // Filter available departments for the Filter Bar
  const availableFilterDepartments = useMemo(() => {
    if (selectedCollegeFilter === 'all') return departments;
    const currentSelectedCol = colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter);
    return departments.filter(d => {
      if (!currentSelectedCol) return true;
      return (
        d.college_id === currentSelectedCol.id ||
        d.college_slug === currentSelectedCol.slug ||
        String(d.colg_cd) === String(currentSelectedCol.code) ||
        String(d.colg_cd) === String(currentSelectedCol.id) ||
        String(d.college_code) === String(currentSelectedCol.code)
      );
    });
  }, [departments, selectedCollegeFilter, colleges]);

  // Filter available departments inside Modal Form based on chosen College
  const modalAvailableDepartments = useMemo(() => {
    if (!formData.college_id && !formData.college_slug) return departments;
    const currentFormCol = colleges.find(c => String(c.code) === String(formData.college_id) || String(c.id) === String(formData.college_id) || c.slug === formData.college_slug);
    const colCode = currentFormCol?.code || formData.college_id;
    const colSlug = currentFormCol?.slug || formData.college_slug;
    const colId = currentFormCol?.id || formData.college_id;

    return departments.filter(d => {
      const isColMatch =
        (colCode && (String(d.colg_cd) === String(colCode) || String(d.college_code) === String(colCode))) ||
        (colSlug && d.college_slug === colSlug) ||
        (colId && (d.college_id === colId || String(d.colg_cd) === String(colId)));
      return isColMatch;
    });
  }, [departments, formData.college_id, formData.college_slug, colleges]);

  // Filter available subjects inside Modal Form based on chosen College and chosen Department
  const modalAvailableSubjects = useMemo(() => {
    const currentFormCol = colleges.find(c => String(c.code) === String(formData.college_id) || String(c.id) === String(formData.college_id) || c.slug === formData.college_slug);
    const colCode = currentFormCol?.code || formData.college_id;
    const colSlug = currentFormCol?.slug || formData.college_slug;
    const colId = currentFormCol?.id || formData.college_id;

    const chosenDept = departments.find(d =>
      d.id === formData.departmentId ||
      d.code === formData.departmentId ||
      d.branch_cd === formData.departmentId
    );

    return subjects.filter(s => {
      if (currentFormCol || colCode || colSlug || colId) {
        const isColMatch =
          !s.college_id ||
          (colCode && (String(s.colg_cd) === String(colCode) || String(s.college_code) === String(colCode))) ||
          (colSlug && s.college_slug === colSlug) ||
          (colId && s.college_id === colId);
        if (!isColMatch) return false;
      }
      if (formData.departmentId) {
        const isDeptMatch =
          s.department_id === formData.departmentId ||
          s.department_code === formData.departmentId ||
          s.branch_cd === formData.departmentId ||
          (chosenDept && (
            s.department_id === chosenDept.id ||
            s.department_code === chosenDept.code ||
            s.branch_cd === chosenDept.branch_cd ||
            s.branch_cd === chosenDept.code ||
            (s.department_name && chosenDept.name && s.department_name.toLowerCase() === chosenDept.name.toLowerCase())
          ));
        if (!isDeptMatch) return false;
      }
      return true;
    });
  }, [subjects, departments, formData.college_id, formData.college_slug, formData.departmentId, colleges]);

  // Handle College change in Modal Form
  const handleCollegeChangeInForm = (colCodeOrId: string) => {
    const selectedCol = colleges.find(c => String(c.code) === String(colCodeOrId) || String(c.id) === String(colCodeOrId) || c.slug === colCodeOrId) || colleges[0];
    const targetColCd = selectedCol?.code || selectedCol?.id || '1';
    const targetColSlug = selectedCol?.slug || '';

    const matchingDepts = departments.filter(d =>
      d.college_id === selectedCol?.id ||
      d.college_slug === selectedCol?.slug ||
      String(d.colg_cd) === String(targetColCd) ||
      String(d.college_code) === String(targetColCd)
    );
    const firstDept = matchingDepts[0];

    const matchingSubs = subjects.filter(s =>
      (!selectedCol || s.college_id === selectedCol.id || s.college_slug === selectedCol.slug || String(s.colg_cd) === String(targetColCd) || String(s.college_code) === String(targetColCd)) &&
      (!firstDept || s.department_id === firstDept.id || s.department_code === firstDept.code || s.branch_cd === firstDept.branch_cd)
    );

    setFormData(prev => ({
      ...prev,
      college_id: targetColCd,
      college_slug: targetColSlug,
      departmentId: firstDept?.id || firstDept?.code || firstDept?.branch_cd || '',
      subjectId: matchingSubs[0]?.id || matchingSubs[0]?.code || '',
    }));
  };

  // Handle Department change in Modal Form
  const handleDepartmentChangeInForm = (deptId: string) => {
    const chosenDept = departments.find(d => d.id === deptId || d.code === deptId || d.branch_cd === deptId);
    const matchingSubs = subjects.filter(s =>
      !deptId ||
      s.department_id === deptId ||
      s.department_code === deptId ||
      s.branch_cd === deptId ||
      (chosenDept && (s.department_id === chosenDept.id || s.department_code === chosenDept.code || s.branch_cd === chosenDept.branch_cd))
    );
    const isCurrentSubValid = matchingSubs.some(s => s.id === formData.subjectId || s.code === formData.subjectId);

    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      subjectId: isCurrentSubValid ? prev.subjectId : (matchingSubs[0]?.id || ''),
    }));
  };

  const handleDesignationSelect = (option: string) => {
    setSelectedDesignationOption(option);
    if (option === 'Other / Custom') {
      setFormData(prev => ({ ...prev, designation: customDesignationText }));
    } else {
      setFormData(prev => ({ ...prev, designation: option }));
    }
  };

  const handleCustomDesignationChange = (text: string) => {
    setCustomDesignationText(text);
    setFormData(prev => ({ ...prev, designation: text }));
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setPhotoPreview(null);
    setSelectedDesignationOption('Assistant Professor');
    setCustomDesignationText('');

    const targetCol = (selectedCollegeFilter !== 'all' ? colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter) : null) || colleges[0];
    const targetColCd = targetCol?.code || targetCol?.id || '1';
    const targetColSlug = targetCol?.slug || '';

    const matchingDepts = departments.filter(d =>
      !targetCol ||
      d.college_id === targetCol.id ||
      d.college_slug === targetCol.slug ||
      String(d.colg_cd) === String(targetColCd) ||
      String(d.college_code) === String(targetColCd)
    );
    const firstDept = matchingDepts[0];

    const matchingSubs = subjects.filter(s =>
      (!targetCol || s.college_id === targetCol.id || s.college_slug === targetCol.slug || String(s.colg_cd) === String(targetColCd) || String(s.college_code) === String(targetColCd)) &&
      (!firstDept || s.department_id === firstDept.id || s.department_code === firstDept.code || s.branch_cd === firstDept.branch_cd)
    );

    setFormData({
      college_id: targetColCd,
      college_slug: targetColSlug,
      empId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      email: '',
      password: '',
      phone: '',
      designation: 'Assistant Professor',
      departmentId: firstDept?.id || firstDept?.code || firstDept?.branch_cd || '',
      subjectId: matchingSubs[0]?.id || matchingSubs[0]?.code || '',
      gender: 'Male',
      experience: '2 Years',
      staffType: 'Faculty',
      photoUrl: '',
      isActive: true,
      qualification: '',
      dateOfBirth: '',
      dateOfJoining: '',
      bloodGroup: '',
      fatherName: '',
      spouseName: '',
      address: '',
      city: 'Bareilly',
      state: 'Uttar Pradesh',
      caste: 'General',
      panNo: '',
      aadhaarNo: '',
      salgrade: 'Standard',
      currentBasic: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Faculty) => {
    setEditingItem(item);
    setPhotoPreview(item.photo_url || null);

    const isStd = STANDARD_DESIGNATIONS.includes(item.designation);
    if (isStd) {
      setSelectedDesignationOption(item.designation);
      setCustomDesignationText('');
    } else if (item.designation) {
      setSelectedDesignationOption('Other / Custom');
      setCustomDesignationText(item.designation);
    } else {
      setSelectedDesignationOption('Assistant Professor');
      setCustomDesignationText('');
    }

    const matchedCol = colleges.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || colleges[0];

    // Format ISO date strings to YYYY-MM-DD for standard date inputs
    const formatDateForInput = (d?: string) => {
      if (!d) return '';
      try {
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return d;
        return dateObj.toISOString().split('T')[0];
      } catch {
        return d;
      }
    };

    setFormData({
      college_id: matchedCol?.code || matchedCol?.id || item.college_id || '1',
      college_slug: matchedCol?.slug || item.college_slug || '',
      empId: item.emp_id || '',
      name: item.name || '',
      email: item.email || '',
      password: '',
      phone: item.phone || '',
      designation: item.designation || 'Assistant Professor',
      departmentId: item.department_id || item.department_code || '',
      subjectId: item.subject_id || item.subject_code || '',
      gender: item.gender || 'Male',
      experience: item.experience || '',
      staffType: item.staff_type || 'Faculty',
      photoUrl: item.photo_url || '',
      isActive: item.is_active !== false,
      qualification: item.qualification || item.highest_education || '',
      dateOfBirth: formatDateForInput(item.date_of_birth),
      dateOfJoining: formatDateForInput(item.date_of_joining || item.joining_date),
      bloodGroup: item.blood_group || '',
      fatherName: item.father_name || '',
      spouseName: item.spouse_name || '',
      address: item.address || item.perm_addr || '',
      city: item.city || 'Bareilly',
      state: item.state || 'Uttar Pradesh',
      caste: item.caste || 'General',
      panNo: item.pan_no || '',
      aadhaarNo: item.aadhaar_no || '',
      salgrade: item.salgrade || 'Standard',
      currentBasic: item.current_basic || 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string, itemCollegeSlug?: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This will remove their user account.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const targetCol = colleges.find(c => c.slug === itemCollegeSlug || String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter));
      const slug = itemCollegeSlug || targetCol?.slug || (selectedCollegeFilter !== 'all' ? selectedCollegeFilter : 'srms-cet-bareilly');

      const res = await fetch(`${API_BASE}/users/faculty/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        showAlert('success', 'Staff member deleted successfully from PostgreSQL!');
        fetchFaculties(selectedCollegeFilter);
      } else {
        const json = await res.json();
        showAlert('error', json.message || 'Failed to delete staff member');
      }
    } catch (err) {
      showAlert('error', 'Network error while deleting staff member');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleMapping: Record<string, string> = {
      'Faculty': 'FACULTY',
      'HOD': 'HOD',
      'Admin': 'COLLEGE_ADMIN',
      'Administrator': 'COLLEGE_ADMIN',
      'COLLEGE_ADMIN': 'COLLEGE_ADMIN',
      'ADMIN': 'COLLEGE_ADMIN',
      'CLERK': 'CLERK',
      'Clerk': 'CLERK',
      'EXECUTIVE': 'FACULTY',
      'TUTOR': 'FACULTY',
      'PG': 'FACULTY',
    };

    const isEdit = !!editingItem;
    if (!isEdit && (!formData.password || formData.password.length < 8)) {
      showAlert('error', 'Account password must be at least 8 characters long.');
      return;
    }

    const targetCol = colleges.find(c => String(c.code) === String(formData.college_id) || String(c.id) === String(formData.college_id) || c.slug === formData.college_slug) || colleges[0];
    const slug = targetCol?.slug || formData.college_slug || 'srms-cet-bareilly';

    const url = isEdit
      ? `${API_BASE}/users/faculty/${editingItem.id}?tenant=${slug}`
      : `${API_BASE}/users/faculty?tenant=${slug}`;
    const method = isEdit ? 'PUT' : 'POST';

    const finalDesignation = selectedDesignationOption === 'Other / Custom'
      ? customDesignationText
      : selectedDesignationOption;

    const body: Record<string, any> = {
      ...formData,
      photoUrl: photoPreview || formData.photoUrl || undefined,
      dateOfBirth: formData.dateOfBirth?.trim() || undefined,
      dateOfJoining: formData.dateOfJoining?.trim() || undefined,
      college_id: targetCol?.code || targetCol?.id || formData.college_id,
      college_slug: slug,
      departmentId: formData.departmentId || undefined,
      subjectId: formData.subjectId || undefined,
      designation: finalDesignation,
      role: roleMapping[formData.staffType] || 'FACULTY',
    };

    if (isEdit) {
      delete body.password;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
          'x-tenant': slug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok) {
        showAlert('success', `Staff member record ${isEdit ? 'updated' : 'registered'} in PostgreSQL successfully!`);
        setIsModalOpen(false);

        // Optimistically update local faculty state with updated fields
        if (isEdit) {
          const updatedItem = json.data || json;
          if (updatedItem && updatedItem.id) {
            setFaculties(prev => prev.map(f => f.id === editingItem.id ? { ...f, ...updatedItem, photo_url: updatedItem.photo_url || body.photoUrl } : f));
            if (detailFaculty && detailFaculty.id === editingItem.id) {
              setDetailFaculty(prev => prev ? { ...prev, ...updatedItem, photo_url: updatedItem.photo_url || body.photoUrl } : null);
            }
          }
        }

        fetchFaculties(selectedCollegeFilter);
      } else {
        const displayError = Array.isArray(json.message) ? json.message.join(', ') : json.message;
        showAlert('error', displayError || `Failed to ${isEdit ? 'update' : 'create'} staff record.`);
      }
    } catch (err) {
      showAlert('error', 'Network error during save operation.');
    }
  };

  // Grant Administrator Rights to any staff member
  const handleGrantAdminRights = async (faculty: Faculty) => {
    const confirmText = `Are you sure you want to grant full Administrator Rights to ${faculty.name} (${faculty.emp_id})?`;
    if (!confirm(confirmText)) return;

    try {
      const targetSlug = faculty.college_slug || selectedCollegeFilter || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`/api/users/staff/${faculty.id}/grant-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: 'COLLEGE_ADMIN' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to grant admin rights');

      showAlert('success', `🛡️ Full Administrator Rights successfully granted to ${faculty.name}!`);
      fetchFaculties(selectedCollegeFilter);
    } catch (e: any) {
      showAlert('error', e.message || 'Could not grant admin rights');
    }
  };

  // Revoke Administrator Rights from staff member and revert to default Faculty
  const handleRevokeAdminRights = async (faculty: Faculty) => {
    const confirmText = `Are you sure you want to remove Administrator rights from ${faculty.name} (${faculty.emp_id}) and revert back to default Faculty?`;
    if (!confirm(confirmText)) return;

    try {
      const targetSlug = faculty.college_slug || selectedCollegeFilter || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`/api/users/staff/${faculty.id}/revoke-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to revoke admin rights');

      showAlert('success', `✓ Administrator rights removed from ${faculty.name}. Reverted to default Faculty.`);
      fetchFaculties(selectedCollegeFilter);
    } catch (e: any) {
      showAlert('error', e.message || 'Could not revoke admin rights');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedDeptFilter('all');
    setSelectedStaffTypeFilter('all');
    setSelectedStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const isFilterActive = selectedDeptFilter !== 'all' || selectedStaffTypeFilter !== 'all' || selectedStatusFilter !== 'all' || searchTerm !== '';

  // Filter faculties locally
  const filteredFaculties = useMemo(() => {
    const rawList = faculties.filter((fac: Faculty) => {
      if (userRole === 'SUPER_ADMIN' && selectedCollegeFilter !== 'all') {
        const targetCol = colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter);
        const targetColCode = targetCol?.code || selectedCollegeFilter;
        const targetColSlug = targetCol?.slug || selectedCollegeFilter;
        const targetColId = targetCol?.id || selectedCollegeFilter;

        const facColMatch =
          String(fac.college_code) === String(targetColCode) ||
          fac.college_slug === targetColSlug ||
          fac.college_id === targetColId ||
          (targetCol && (fac.college_id === targetCol.id || fac.college_slug === targetCol.slug || String(fac.college_code) === String(targetCol.code)));
        if (!facColMatch && (fac.college_code || fac.college_slug || fac.college_id)) return false;
      }

      if (selectedDeptFilter !== 'all') {
        const chosenDept = departments.find(d => d.id === selectedDeptFilter || d.code === selectedDeptFilter || d.branch_cd === selectedDeptFilter);
        const deptMatch =
          fac.department_id === selectedDeptFilter ||
          fac.department_code === selectedDeptFilter ||
          (chosenDept && (
            fac.department_id === chosenDept.id ||
            fac.department_code === chosenDept.code ||
            (fac.department_name && chosenDept.name && fac.department_name.toLowerCase() === chosenDept.name.toLowerCase())
          ));
        if (!deptMatch) return false;
      }

      if (selectedStaffTypeFilter !== 'all') {
        if (fac.staff_type?.toLowerCase() !== selectedStaffTypeFilter.toLowerCase()) return false;
      }

      if (selectedStatusFilter !== 'all') {
        const reqActive = selectedStatusFilter === 'active';
        if (fac.is_active !== reqActive) return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          fac.name?.toLowerCase().includes(term) ||
          fac.emp_id?.toLowerCase().includes(term) ||
          fac.email?.toLowerCase().includes(term) ||
          fac.phone?.toLowerCase().includes(term) ||
          (fac.designation && fac.designation.toLowerCase().includes(term)) ||
          (fac.department_name && fac.department_name.toLowerCase().includes(term)) ||
          (fac.subject_name && fac.subject_name.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      return true;
    });

    const seen = new Set<string>();
    return rawList.filter((f: Faculty) => {
      const key = f.emp_id || f.id || f.email;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [faculties, selectedCollegeFilter, selectedDeptFilter, selectedStaffTypeFilter, selectedStatusFilter, searchTerm, colleges, departments]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFaculties.length / ITEMS_PER_PAGE));
  const paginatedFaculties = filteredFaculties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role={userRole.toLowerCase() === 'clerk' ? 'clerk' : userRole.toLowerCase() === 'super_admin' ? 'superadmin' : 'admin'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty & Staff Directory" />
        <main className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 min-w-0 max-w-full overflow-x-hidden bg-[#F6F8FC] dark:bg-[#0F172A]">

          {/* Flash Alert */}
          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-md flex items-center justify-between gap-2 ${alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              }`}>
              <div className="flex items-center gap-2">
                <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{alert.message}</span>
              </div>
              <button onClick={() => setAlert(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Top Banner Stats adhering to Theme.md */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-[#7867FF] tracking-wider">Total Staff Registered</p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white mt-1">{faculties.length}</h3>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center text-lg sm:text-xl font-bold">
                👥
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-emerald-600 tracking-wider">Active Faculty</p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white mt-1">
                  {faculties.filter(f => f.is_active && (f.staff_type || '').toLowerCase() === 'faculty').length}
                </h3>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg sm:text-xl font-bold">
                🎓
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-[#F36C21] tracking-wider">Non-Teaching & Staff</p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white mt-1">
                  {faculties.filter(f => (f.staff_type || '').toLowerCase() !== 'faculty').length}
                </h3>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F36C21]/10 text-[#F36C21] flex items-center justify-center text-lg sm:text-xl font-bold">
                🏢
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-indigo-600 tracking-wider">SRMS HR Sync Status</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected API
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-lg sm:text-xl font-bold">
                ⚡
              </div>
            </div>
          </div>

          {/* ─── PREMIUM UNIFIED FILTER & ACTION CONTROL BAR ─── */}
          <div className="p-4 sm:p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
            
            {/* Top Tier: Search Bar + Primary Action Buttons */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
              
              {/* Search Box */}
              <div className="relative flex-1 max-w-2xl">
                <input
                  type="text"
                  placeholder="Search by Employee Code, Name, Designation, Email, Phone, Department..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 px-4 pl-10 pr-10 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium transition-all shadow-inner"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons: Sample Download + Import Excel/CSV + Sync HR + Register New Staff */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0 w-full lg:w-auto">
                
                {/* Download Sample Format Button */}
                <button
                  onClick={handleDownloadSampleFormat}
                  className="flex-1 sm:flex-none h-11 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  title="Download pre-formatted Excel / CSV template for bulk staff registration"
                >
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Sample Format</span>
                </button>

                {/* Import Excel / CSV Button */}
                <button
                  onClick={() => {
                    setIsImportModalOpen(true);
                    setImportParsedRows([]);
                    setImportFileName('');
                    setImportResult(null);
                    setImportTargetCollege(selectedCollegeFilter !== 'all' ? selectedCollegeFilter : userTenantSlug);
                  }}
                  className="flex-1 sm:flex-none h-11 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  title="Import faculty and non-teaching staff from Excel / CSV into selected college"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span>Import Excel / CSV</span>
                </button>

                {/* Sync from SRMS HR Button */}
                <button
                  onClick={() => { setIsSyncModalOpen(true); setSyncResult(null); }}
                  className="flex-1 sm:flex-none h-11 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF8C42] hover:from-[#E05C12] hover:to-[#F36C21] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  title="Synchronize employee records from live SRMS HR API"
                >
                  <svg className="w-4 h-4 animate-spin-reverse" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>Sync HR</span>
                </button>

                {/* Register New Staff Button */}
                <button
                  onClick={handleOpenAddModal}
                  className="flex-1 sm:flex-none h-11 px-4 sm:px-5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#5B4BFF]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Register Staff</span>
                </button>
              </div>

            </div>

            {/* Bottom Tier: Uniform Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E7EAF3] dark:border-slate-800">
              
              {/* 1. College Selector */}
              <div className="relative flex items-center">
                <select
                  value={selectedCollegeFilter}
                  disabled={userRole !== 'SUPER_ADMIN'}
                  onChange={(e) => { setSelectedCollegeFilter(e.target.value); setSelectedDeptFilter('all'); setCurrentPage(1); }}
                  className="w-full h-11 px-3.5 pr-8 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm disabled:cursor-not-allowed appearance-none cursor-pointer truncate"
                >
                  {userRole === 'SUPER_ADMIN' && <option value="all">🏛️ All Colleges ({colleges.length})</option>}
                  {colleges.map((col) => (
                    <option key={col.id} value={col.code || col.id}>
                      🏛️ [#{col.code || col.id}] {col.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none flex items-center gap-1">
                  {userRole !== 'SUPER_ADMIN' ? (
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      🔒
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  )}
                </div>
              </div>

              {/* 2. Department Selector */}
              <div className="relative flex items-center">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 px-3.5 pr-8 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm appearance-none cursor-pointer truncate"
                >
                  <option value="all">🏢 All Departments ({availableFilterDepartments.length})</option>
                  {availableFilterDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id || dept.code}>
                      🏢 {dept.name} ({dept.code || dept.branch_cd || 'N/A'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* 3. Staff Type Selector */}
              <div className="relative flex items-center">
                <select
                  value={selectedStaffTypeFilter}
                  onChange={(e) => { setSelectedStaffTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 px-3.5 pr-8 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">👤 All Staff Types</option>
                  {['Faculty', 'HOD', 'ADMIN', 'CLERK', 'EXECUTIVE', 'TUTOR', 'PG', 'Staff', 'Admin'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* 4. Status Filter + Quick Reset */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full h-11 px-3.5 pr-8 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="all">⚡ All Statuses</option>
                    <option value="active">🟢 Active Only</option>
                    <option value="inactive">🔴 Inactive Only</option>
                  </select>
                  <div className="absolute right-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all shrink-0 cursor-pointer"
                    title="Clear all active filters"
                  >
                    Reset
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* ─── STAFF ROSTER TABLE CARD ─── */}
          <div className="bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50/80 dark:bg-slate-800/60">
                    <th className="pl-6 py-4">Staff Member</th>
                    <th className="py-4">Staff Code</th>
                    <th className="py-4">College</th>
                    <th className="py-4">Role & Type</th>
                    <th className="py-4">Department & Subject</th>
                    <th className="py-4">Contact & Exp</th>
                    <th className="py-4">Status</th>
                    <th className="pr-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                  {loading ? (
                    [...Array(6)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse bg-slate-50/50 dark:bg-slate-900/20">
                        <td className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                            <div className="space-y-2">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                              <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded w-16"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-14"></div></td>
                        <td className="py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div></td>
                        <td className="pr-6 py-4 text-right"><div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : paginatedFaculties.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-orange-500/10 text-[#F36C21] flex items-center justify-center text-xl font-bold">
                            🔍
                          </div>
                          <p className="text-sm font-bold text-[#1B1E28] dark:text-white">
                            {faculties.length > 0
                              ? 'No staff records match the active filter criteria.'
                              : 'No staff records found in PostgreSQL database.'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                            {faculties.length > 0
                              ? `There are ${faculties.length} total staff records loaded. Try clearing the search query or resetting the Department / Type filters.`
                              : 'Click "Sync from SRMS HR" above to fetch and import all live employee profiles into the system.'}
                          </p>
                          {faculties.length > 0 && isFilterActive && (
                            <button
                              onClick={handleResetFilters}
                              className="mt-2 px-4 py-2 text-xs font-extrabold rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white shadow-md shadow-[#5B4BFF]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Reset All Filters (Show All {faculties.length} Staff)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedFaculties.map((fac: Faculty) => {
                      const matchedCol = colleges.find(c => c.id === fac.college_id || c.code === fac.college_code || c.slug === fac.college_slug);
                      const displayColName = matchedCol?.name || fac.college_name || 'SRMS CET';
                      const displayColCode = matchedCol?.code || fac.college_code || '1';

                      return (
                        <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                          <td className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => setDetailFaculty(fac)}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-0.5 cursor-pointer hover:ring-2 hover:ring-[#5B4BFF] transition-all"
                                title="Click to view full profile details"
                              >
                                {fac.photo_url ? (
                                  <img
                                    src={fac.photo_url}
                                    alt={fac.name}
                                    onError={(e: any) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fac.name)}&background=5B4BFF&color=fff&bold=true`;
                                    }}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="font-extrabold text-[#5B4BFF] text-xs">
                                    {fac.name ? fac.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
                                  </span>
                                )}
                              </div>
                              <div className="cursor-pointer" onClick={() => setDetailFaculty(fac)}>
                                <p className="font-bold text-slate-900 dark:text-white tracking-tight text-sm hover:text-[#5B4BFF] transition-colors">{fac.name}</p>
                                <p className="text-[11px] text-[#5B4BFF] font-semibold">{fac.designation || 'Staff Member'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                              {fac.emp_id}
                            </span>
                          </td>

                          <td className="py-4">
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-[#F36C21] border border-orange-500/20 font-bold text-[10px] inline-flex items-center gap-1 truncate max-w-[170px]" title={`#${displayColCode} ${displayColName}`}>
                              🏛️ #{displayColCode} {displayColName}
                            </span>
                          </td>

                          <td className="py-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20 font-bold uppercase text-[9px] tracking-wider inline-block">
                                {fac.staff_type}
                              </span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[160px]">{fac.email}</p>
                            </div>
                          </td>

                          <td className="py-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px] inline-block truncate max-w-[180px]">
                                🏢 {fac.department_name || 'General Dept'}
                              </span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {fac.qualification ? `🎓 ${fac.qualification}` : (fac.subject_name ? `📚 ${fac.subject_name}` : 'Specialty: N/A')}
                              </p>
                            </div>
                          </td>

                          <td className="py-4">
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{fac.phone || 'No Mobile'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{fac.experience ? `${fac.experience} Exp.` : 'Exp: N/A'}</p>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[9px] tracking-wide inline-block ${fac.is_active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                              {fac.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="pr-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setDetailFaculty(fac)}
                                className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all border border-indigo-500/30 shadow-sm cursor-pointer"
                                title="View Comprehensive Profile"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              {fac.role === 'COLLEGE_ADMIN' || fac.role === 'ADMIN' || (fac.designation && fac.designation.toLowerCase().includes('admin')) ? (
                                <button
                                  onClick={() => handleRevokeAdminRights(fac)}
                                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-500/30 shadow-sm cursor-pointer"
                                  title={`Remove Administrator Rights from ${fac.name} (Revert to Faculty)`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleGrantAdminRights(fac)}
                                  className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white transition-all border border-amber-500/30 shadow-sm cursor-pointer"
                                  title={`Grant Administrator Rights to ${fac.name}`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(fac)}
                                className="p-2 rounded-xl bg-[#5B4BFF]/10 hover:bg-[#5B4BFF] text-[#5B4BFF] hover:text-white transition-all border border-[#5B4BFF]/30 shadow-sm cursor-pointer"
                                title="Edit Staff Member"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(fac.id, fac.college_slug)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-500/30 shadow-sm cursor-pointer"
                                title="Delete Staff Member"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-[#E7EAF3] dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFaculties.length)} of {filteredFaculties.length} staff records
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-bold disabled:opacity-40 transition-all text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-bold disabled:opacity-40 transition-all text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── LIVE SRMS HR SYNC MODAL ─── */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden shadow-2xl rounded-3xl bg-white dark:bg-[#1B1E28] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col">
            
            {/* Modal Header Ribbon */}
            <div className="bg-[#11141A] dark:bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl border border-white/20">
                  ⚡
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-wide uppercase">
                    Sync Staff with SRMS HR Portal API
                  </h2>
                  <p className="text-[11px] text-white/80 font-medium">
                    Fetch live employee records from GETEMPPROFILEDTL, update photo URLs, clean names, and set default login password.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-rose-500/80 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Endpoint Information Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-900 dark:text-indigo-300 uppercase text-[10px] tracking-wider">
                    API Endpoint Specifications
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                    POST Live Proxy
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold">URL: <span className="text-slate-700 dark:text-slate-300">https://myportal.srms.ac.in/HR/HR/GETEMPPROFILEDTL</span></p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">Payload: <span className="text-emerald-600 dark:text-emerald-400 font-bold">&#123; &quot;locid&quot;: &quot;{syncLocId}&quot; &#125;</span></p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-black">Password</span>
                    <span className="font-bold text-[#5B4BFF] font-mono">12345678</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-black">Photo URLs</span>
                    <span className="font-bold text-emerald-600">Auto Linked</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-black">Name Casing</span>
                    <span className="font-bold text-[#F36C21]">Title Case</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-black">Storage</span>
                    <span className="font-bold text-indigo-600">PostgreSQL</span>
                  </div>
                </div>
              </div>

              {/* Choose Location */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  Target Institution / Firm Location (locid):
                </label>
                <select
                  value={syncLocId}
                  onChange={(e) => setSyncLocId(e.target.value)}
                  disabled={syncing}
                  className="w-full h-11 px-4 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-900 dark:text-white"
                >
                  {SRMS_FIRM_OPTIONS.map((opt) => (
                    <option key={opt.locid} value={opt.locid}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sync Result Box if completed */}
              {syncResult && (
                <div className={`p-4.5 rounded-2xl border ${syncResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{syncResult.success ? '🎉' : '❌'}</span>
                    <h4 className={`text-xs font-black ${syncResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {syncResult.message}
                    </h4>
                  </div>
                  {syncResult.success && (
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
                        <span className="block text-[9px] text-slate-400 uppercase font-black">Total Synced</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">{syncResult.count}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
                        <span className="block text-[9px] text-slate-400 uppercase font-black">Teaching Faculty</span>
                        <span className="font-black text-emerald-600 text-sm">{syncResult.teachingCount || 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
                        <span className="block text-[9px] text-slate-400 uppercase font-black">Staff & Admin</span>
                        <span className="font-black text-[#F36C21] text-sm">{syncResult.nonTeachingCount || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7EAF3] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  disabled={syncing}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  disabled={syncing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF8C42] hover:from-[#E05C12] hover:to-[#F36C21] text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {syncing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Syncing with SRMS Portal...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Start Sync Process</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── DETAILED STAFF PROFILE DRAWER / MODAL ─── */}
      {detailFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl overflow-hidden shadow-2xl rounded-3xl bg-white dark:bg-[#1B1E28] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">
            
            {/* Modal Header Ribbon */}
            <div className="bg-[#11141A] dark:bg-slate-900 text-white px-7 py-5 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 p-1 border border-white/20 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                  {detailFaculty.photo_url ? (
                    <img
                      src={detailFaculty.photo_url}
                      alt={detailFaculty.name}
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(detailFaculty.name)}&background=5B4BFF&color=fff&bold=true`;
                      }}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="font-black text-lg text-white">
                      {detailFaculty.name ? detailFaculty.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-black tracking-wide text-white">
                      {detailFaculty.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {detailFaculty.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 font-bold mt-1">
                    {detailFaculty.designation || 'Staff Member'} • <span className="font-mono bg-white/15 px-2 py-0.5 rounded-md text-white">{detailFaculty.emp_id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailFaculty(null)}
                className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-rose-500/80 transition-all cursor-pointer"
                title="Close modal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Content Body */}
            <div className="p-7 overflow-y-auto space-y-6 text-xs bg-[#F6F8FC] dark:bg-[#111827]/60">
              
              {/* Quick Info Top Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-extrabold text-[#5B4BFF] tracking-wider flex items-center gap-1">
                    <span>🏛️</span> College
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5 truncate" title={detailFaculty.college_name || 'SRMS CET'}>
                    {detailFaculty.college_name || 'SRMS CET'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-extrabold text-[#F36C21] tracking-wider flex items-center gap-1">
                    <span>🏢</span> Department
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5 truncate" title={detailFaculty.department_name || 'General'}>
                    {detailFaculty.department_name || 'General'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-extrabold text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1">
                    <span>🎓</span> Staff Type
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5">
                    {detailFaculty.staff_type || 'Faculty'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                    <span>⏳</span> Experience
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5">
                    {detailFaculty.experience || 'Not Stated'}
                  </p>
                </div>
              </div>

              {/* 1. Academic & Employment Profile Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#5B4BFF] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center text-xs">🎓</span>
                    Academic & Employment Profile
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Section 1 of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Employee ID</span>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.emp_id}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Designation</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.designation || 'Staff Member'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Highest Qualification</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.qualification || detailFaculty.highest_education || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Date of Joining</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      {detailFaculty.date_of_joining || detailFaculty.joining_date
                        ? new Date(detailFaculty.date_of_joining || detailFaculty.joining_date || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Employment Category</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.category || detailFaculty.payroll_category || 'TEACHING'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Salary Grade</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.salgrade || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Personal & Demographics Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#F36C21] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#F36C21]/10 text-[#F36C21] flex items-center justify-center text-xs">👤</span>
                    Personal & Demographics
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Section 2 of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Gender</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.gender || 'Male'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Date of Birth</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      {detailFaculty.date_of_birth
                        ? new Date(detailFaculty.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Blood Group</span>
                    <span className="font-black text-xs text-rose-600 dark:text-rose-400">{detailFaculty.blood_group || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Father&apos;s Name</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.father_name || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Spouse&apos;s Name</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.spouse_name || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Caste Category</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.caste || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Contact & Residential Address Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">📍</span>
                    Contact & Residential Address
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Section 3 of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Official Email</span>
                    <span className="font-mono font-bold text-xs text-[#5B4BFF]">{detailFaculty.email}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Mobile Phone</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{detailFaculty.phone || 'No Phone Registered'}</span>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Current Residential Address</span>
                    <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
                      {detailFaculty.address || 'Address not registered'}, {detailFaculty.city || 'Bareilly'}, {detailFaculty.state || 'Uttar Pradesh'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Portal Access Credentials Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs">🔑</span>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      Portal Access Credentials
                    </h4>
                  </div>
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Login Identifier:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {detailFaculty.emp_id}
                    </span>
                    <span className="text-slate-400">or</span>
                    <span className="font-mono text-[#5B4BFF]">{detailFaculty.email}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    Default sync password: <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">12345678</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    const target = detailFaculty;
                    setDetailFaculty(null);
                    handleOpenEditModal(target);
                  }}
                  className="h-11 px-6 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs transition-all shadow-md shadow-[#5B4BFF]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  <span>Edit Record</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── DUAL-MODE MODAL FOR ADD / EDIT STAFF RECORD ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-5xl overflow-hidden shadow-2xl rounded-3xl bg-white dark:bg-[#1B1E28] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">

            {/* Header Ribbon */}
            <div className="bg-[#11141A] dark:bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl border border-white/20">
                  {editingItem ? '✏️' : '➕'}
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-wide uppercase">
                    {editingItem ? `Edit Staff Record — ${formData.name || formData.empId}` : 'Register New Staff Member'}
                  </h2>
                  <p className="text-[11px] text-white/80 font-medium">
                    {editingItem ? 'Update academic links, designations, contact details, demographics and status.' : 'Provide college affiliation, department links, specialty subjects, and administrative credentials.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-rose-500/80 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Split Form Layout */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col lg:flex-row">

              {/* Left Column: Live Profile Card & Photo Upload */}
              <div className="w-full lg:w-80 border-r border-[#E7EAF3] dark:border-slate-800 p-6 flex flex-col justify-between bg-slate-50/70 dark:bg-slate-900/40 space-y-5 overflow-y-auto">

                {/* Live Card Preview */}
                <div className="w-full space-y-3">
                  <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">Live Profile Card</span>

                  <div className="w-full rounded-[22px] bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center text-center space-y-3 relative overflow-hidden shadow-sm">

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${formData.isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Image Avatar */}
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#5B4BFF] via-[#7867FF] to-[#F36C21] shadow-md relative group mt-2">
                      <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center relative">
                        {photoPreview ? (
                          <>
                            <img src={photoPreview} alt="Staff Preview" className="w-full h-full object-cover rounded-full" />
                            <button
                              type="button"
                              onClick={clearPhoto}
                              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-extrabold uppercase tracking-wider transition-opacity cursor-pointer"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                            <svg className="w-8 h-8 text-[#5B4BFF] mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">No Photo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full space-y-0.5">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                        {formData.name || 'Full Name'}
                      </h4>
                      <p className="text-[11px] text-[#5B4BFF] font-bold uppercase tracking-wider">
                        {formData.designation || 'Designation'}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tracking-widest mt-1 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-block">
                        {formData.empId || 'EMPCODE'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 w-full flex flex-col items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20 font-extrabold uppercase text-[9px] tracking-wider">
                        {formData.staffType} ({formData.gender})
                      </span>
                      {formData.college_id && (
                        <span className="text-[10px] text-[#F36C21] font-bold truncate max-w-[220px]">
                          🏛️ {colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug)?.name || 'College Selected'}
                        </span>
                      )}
                      {formData.departmentId && (
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold truncate max-w-[220px]">
                          🏢 {departments.find(d => d.id === formData.departmentId || d.code === formData.departmentId)?.name || 'Department Assigned'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Photo Widget */}
                <div className="w-full space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">Upload / Link Photo</span>
                  <input
                    type="text"
                    placeholder="Or enter Image URL"
                    value={formData.photoUrl}
                    onChange={(e) => { setFormData({ ...formData, photoUrl: e.target.value }); setPhotoPreview(e.target.value); }}
                    className="w-full h-9 px-3 text-[11px] rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#5B4BFF]"
                  />
                  <label className="flex flex-col items-center justify-center w-full h-18 border-2 border-dashed border-[#5B4BFF]/30 hover:border-[#5B4BFF] rounded-2xl cursor-pointer bg-white dark:bg-slate-900/40 hover:bg-[#5B4BFF]/5 transition-all p-2 text-center group">
                    <svg className="w-5 h-5 text-[#5B4BFF] mb-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                    <span className="text-[10px] text-slate-700 dark:text-slate-200 font-bold">Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Complete Form Inputs */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white dark:bg-[#1B1E28]">

                {/* 1. College & Department Links */}
                <div className="space-y-3 p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1.5">
                    <span>🏛️</span> 1. Institutional & Department Affiliation *
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {/* Choose College */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        College *
                      </label>
                      <select
                        required
                        value={formData.college_id}
                        onChange={(e) => handleCollegeChangeInForm(e.target.value)}
                        className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] cursor-pointer"
                      >
                        {colleges.map((c) => (
                          <option key={c.id} value={c.code || c.id}>
                            🏛️ [#{c.code || c.id}] {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Department */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        Department * ({modalAvailableDepartments.length})
                      </label>
                      <select
                        required
                        value={formData.departmentId}
                        onChange={(e) => handleDepartmentChangeInForm(e.target.value)}
                        className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] cursor-pointer"
                      >
                        <option value="">-- Choose Department --</option>
                        {modalAvailableDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id || dept.code}>
                            🏢 {dept.name} ({dept.code || dept.branch_cd || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Specialty Subject */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        Specialty Subject ({modalAvailableSubjects.length})
                      </label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] cursor-pointer"
                      >
                        <option value="">No specialty subject</option>
                        {modalAvailableSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id || sub.code}>
                            📚 {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* 2. Account Credentials & Identity */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>🔑</span> 2. Primary Identity & Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">

                    {/* Staff Code */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Staff Code *</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingItem}
                        value={formData.empId}
                        onChange={(e) => setFormData({ ...formData, empId: e.target.value.toUpperCase() })}
                        placeholder="e.g. EMP1004"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    {/* Faculty Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Sarah Sharma"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. sarah.sharma@srms.edu"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Mobile Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        {editingItem ? 'Password' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        required={!editingItem}
                        disabled={!!editingItem}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingItem ? '•••••••• (12345678 default)' : 'Min 8 chars'}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Professional Designation & Roles */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>🩺</span> 3. Designation, Academic Profile & Experience
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">

                    {/* Staff Type */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Staff Type *</label>
                      <select
                        value={formData.staffType}
                        onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold cursor-pointer"
                      >
                        {['Faculty', 'HOD', 'ADMIN', 'CLERK', 'EXECUTIVE', 'TUTOR', 'PG', 'Staff', 'Admin'].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Designation */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Designation *</label>
                      <select
                        value={selectedDesignationOption}
                        onChange={(e) => handleDesignationSelect(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold cursor-pointer"
                      >
                        {STANDARD_DESIGNATIONS.map((desig) => (
                          <option key={desig} value={desig}>{desig}</option>
                        ))}
                      </select>
                    </div>

                    {/* Highest Qualification */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Highest Qualification</label>
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. M.Tech / Ph.D / MBBS"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Experience */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Experience</label>
                      <input
                        type="text"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 7 Years 1 Mo"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Date of Joining */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Date of Joining</label>
                      <input
                        type="date"
                        value={formData.dateOfJoining}
                        onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Custom Designation field */}
                    {selectedDesignationOption === 'Other / Custom' && (
                      <div className="space-y-1 sm:col-span-3">
                        <label className="text-[10px] font-extrabold uppercase text-[#5B4BFF] tracking-wider">Custom Designation Title *</label>
                        <input
                          type="text"
                          required
                          value={customDesignationText}
                          onChange={(e) => handleCustomDesignationChange(e.target.value)}
                          placeholder="e.g. Senior Medical Scientist / Dean Academics"
                          className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#5B4BFF]/50 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Demographics & Family */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>👤</span> 4. Personal Demographics & Family
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Blood Group</label>
                      <input
                        type="text"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value.toUpperCase() })}
                        placeholder="e.g. B+, O+, AB-"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Father&apos;s Name</label>
                      <input
                        type="text"
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="e.g. Mr. Ram Kumar"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Spouse&apos;s Name</label>
                      <input
                        type="text"
                        value={formData.spouseName}
                        onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                        placeholder="e.g. Mrs. Sunita Sharma"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Residential Address */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>📍</span> 5. Residential Address
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="House No, Street, Landmark"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Bareilly"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Access Toggle & Form Action Buttons */}
                <div className="flex items-center justify-between pt-5 border-t border-[#E7EAF3] dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="isActiveToggle" className="text-xs font-extrabold uppercase text-slate-800 dark:text-white tracking-wider cursor-pointer select-none">
                      Grant System Access (Is Active)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-11 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all shadow-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-11 px-6 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs shadow-lg shadow-[#5B4BFF]/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                    >
                      <span>💾</span>
                      <span>{editingItem ? 'Save Updates' : 'Register Profile'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EXCEL / CSV BULK STAFF IMPORT MODAL ─── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 rounded-[28px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Ribbon */}
            <div className="p-6 border-b border-[#E7EAF3] dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-600/30">
                  📊
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1B1E28] dark:text-white tracking-tight">
                    Bulk Staff Excel / CSV Import
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Upload faculty and non-teaching employee spreadsheets directly into any chosen college schema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* College Destination Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-[#1B1E28] dark:text-white tracking-wider">
                      1. Target College / Institution Destination *
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      All staff rows in this spreadsheet will be created in this selected college's isolated PostgreSQL database schema.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleFormat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-300 dark:border-emerald-700 shrink-0 transition-all cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Download Sample Template</span>
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={importTargetCollege}
                    onChange={(e) => setImportTargetCollege(e.target.value)}
                    className="w-full h-11 px-4 pr-10 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white shadow-sm appearance-none cursor-pointer"
                  >
                    {colleges.map((col) => (
                      <option key={col.id} value={col.slug || col.code || col.id}>
                        🏛️ [#{col.code || col.id}] {col.name} ({col.slug})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* File Dropzone Area */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-[#1B1E28] dark:text-white tracking-wider">
                  2. Select Spreadsheet File (.csv / .xlsx / .xls)
                </label>

                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-900/30">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
                      📁
                    </div>
                    {importFileName ? (
                      <div>
                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          Selected File: {importFileName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {importParsedRows.length} employee records parsed and ready for verification
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Click to browse or drag & drop your Excel/CSV file here
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                          Supported columns: emp_id, name, email, phone, designation, staff_type, department_code, qualification, experience, pan, aadhaar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview of Parsed Rows */}
              {importParsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase text-[#1B1E28] dark:text-white tracking-wider">
                        3. Records Preview ({importParsedRows.length} Rows)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        ✓ {importParsedRows.filter((r) => r.isValid).length} Valid
                      </span>
                      {importParsedRows.some((r) => !r.isValid) && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px]">
                          ✕ {importParsedRows.filter((r) => !r.isValid).length} Missing Fields
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Showing up to first 20 records
                    </span>
                  </div>

                  <div className="border border-[#E7EAF3] dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 sticky top-0 font-bold uppercase text-[9px] tracking-wider">
                        <tr>
                          <th className="p-2.5 pl-4">Emp ID</th>
                          <th className="p-2.5">Staff Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Designation</th>
                          <th className="p-2.5">Dept Code</th>
                          <th className="p-2.5">Type & Role</th>
                          <th className="p-2.5 pr-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                        {importParsedRows.slice(0, 20).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 pl-4 font-mono font-bold text-slate-800 dark:text-white">
                              {r.empId || <span className="text-red-500">Missing</span>}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                              {r.name || <span className="text-red-500">Missing</span>}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {r.email || <span className="text-red-500">Missing</span>}
                            </td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300">{r.designation}</td>
                            <td className="p-2.5 font-mono text-purple-600 dark:text-purple-400 font-bold">
                              {r.departmentCode || 'General'}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">
                                {r.staffType} [{r.role}]
                              </span>
                            </td>
                            <td className="p-2.5 pr-4 text-right">
                              {r.isValid ? (
                                <span className="text-emerald-600 font-bold text-[10px]">🟢 Ready</span>
                              ) : (
                                <span className="text-red-600 font-bold text-[10px]">🔴 Incomplete</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Banner */}
              {importResult && (
                <div
                  className={`p-4 rounded-2xl border ${
                    importResult.success
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  } space-y-2`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{importResult.success ? '🎉' : '⚠️'}</span>
                    <h4
                      className={`font-black text-sm ${
                        importResult.success
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : 'text-red-900 dark:text-red-200'
                      }`}
                    >
                      {importResult.success
                        ? 'Staff Import Successfully Executed!'
                        : 'Import Process Encountered Errors'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Created: <strong className="text-emerald-600">{importResult.createdCount}</strong> records | Updated:{' '}
                    <strong className="text-indigo-600">{importResult.updatedCount}</strong> records | Failed:{' '}
                    <strong className="text-red-600">{importResult.failedCount}</strong> records
                  </p>
                  {importResult.failedItems && importResult.failedItems.length > 0 && (
                    <div className="mt-2 text-[11px] text-red-600 font-mono max-h-24 overflow-y-auto space-y-1">
                      {importResult.failedItems.map((f, idx) => (
                        <div key={idx}>
                          • [{f.empId}] {f.name}: {f.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-[#E7EAF3] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadSampleFormat}
                  className="h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📥</span>
                  <span>Sample Format</span>
                </button>

                <button
                  type="button"
                  disabled={importing || importParsedRows.length === 0}
                  onClick={handleExecuteImport}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  {importing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Importing Staff Records...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>
                        Import {importParsedRows.length > 0 ? `(${importParsedRows.length}) Staff` : 'Records'} to Selected College
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
