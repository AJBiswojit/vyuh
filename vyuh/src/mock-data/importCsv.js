/**
 * Phase 8 fixtures: the CSV import contract and two sample sheets.
 *
 * `clean` is the school's own export: seven canonical columns, every row valid.
 * `messy` is what actually arrives from the office — renamed headers, a missing
 * name, a truncated email, a duplicate roll, an unknown batch and a date that
 * does not exist. The wizard has to survive it.
 *
 * @typedef {import('../contracts/admin.js').ImportField} ImportField
 */

/** @type {ImportField[]} */
export const IMPORT_FIELDS = [
  { key: 'rollNumber', label: 'Roll number', required: true, hint: 'Format VY-YY-NNNN. Must be unique across the institution.' },
  { key: 'name', label: 'Full name', required: true, hint: 'As it appears on the board register.' },
  { key: 'email', label: 'Email', required: true, hint: 'The sign-in address. Must be unique.' },
  { key: 'phone', label: 'Phone', required: false, hint: 'Ten digits, optionally with +91.' },
  { key: 'role', label: 'Role', required: false, hint: 'student or faculty. Defaults to student.' },
  { key: 'batch', label: 'Batch', required: false, hint: 'Batch name or id. Required for students.' },
  { key: 'joinedAt', label: 'Joined on', required: false, hint: 'YYYY-MM-DD. Defaults to today.' },
]

export const IMPORT_MAX_ROWS = 200

/** Header spellings the mapping step recognises without help. */
export const IMPORT_HEADER_ALIASES = {
  rollNumber: ['roll number', 'roll no', 'roll', 'rollno', 'admission no'],
  name: ['full name', 'student name', 'name', 'candidate name'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  phone: ['phone', 'contact', 'mobile', 'phone number'],
  role: ['role', 'account type', 'type'],
  batch: ['batch', 'batch name', 'class'],
  joinedAt: ['joined on', 'joined', 'admission date', 'date of joining', 'joining date'],
}

export const importSampleFileName = 'vyuh-students-import-sample.csv'

const cleanRows = [
  'VY-26-4101,Rakesh Dalai,rakesh.dalai4101@vidyutacademy.in,9876543210,student,Prayas JEE 2027 — Morning,2026-10-01',
  'VY-26-4102,Zoya Kar,zoya.kar4102@vidyutacademy.in,9876543211,student,Prayas JEE 2027 — Morning,2026-10-01',
  'VY-26-4103,Trisha Panda,trisha.panda4103@vidyutacademy.in,9876543212,student,Aarambh JEE 2026 — Evening,2026-10-02',
  'VY-26-4104,Aditya Nayak,aditya.nayak4104@vidyutacademy.in,9876543213,student,Aarambh JEE 2026 — Evening,2026-10-02',
  'VY-26-4105,Bhavya Sahu,bhavya.sahu4105@vidyutacademy.in,9876543214,student,Aarogyam NEET 2026 — Morning,2026-10-04',
  'VY-26-4106,Niharika Jena,niharika.jena4106@vidyutacademy.in,9876543215,student,Aarogyam NEET 2026 — Morning,2026-10-04',
  'VY-26-4107,Kavya Patnaik,kavya.patnaik4107@vidyutacademy.in,9876543216,student,Shikhar Droppers — Full day,2026-10-06',
  'VY-26-4108,Yash Bhoi,yash.bhoi4108@vidyutacademy.in,9876543217,student,Shikhar Droppers — Full day,2026-10-06',
  'VY-26-4109,Dyuti Mishra,dyuti.mishra4109@vidyutacademy.in,9876543218,faculty,,2026-10-08',
  'VY-26-4110,Snigdha Hota,snigdha.hota4110@vidyutacademy.in,9876543219,student,Aarogyam NEET 2027 — Afternoon,2026-10-09',
]

/** The sample the wizard offers when someone clicks "use the clean sample". */
export const importSamples = {
  clean: {
    label: 'Sample · office export',
    fileName: importSampleFileName,
    description: '10 rows, seven canonical columns, every row valid.',
    csv: ['Roll number,Full name,Email,Phone,Role,Batch,Joined on', ...cleanRows].join('\n'),
  },
  messy: {
    label: 'Sample · what actually arrives',
    fileName: 'office-walkin-roster-oct.csv',
    description: 'Renamed headers, 7 rows with problems and 4 that will import.',
    csv: [
      'Roll No,Student name,Email,Contact,Role,Batch,Admission date',
      'VY-26-4201,Pranav Behera,pranav.behera4201@vidyutacademy.in,9876500001,student,Prayas JEE 2027 — Morning,2026-10-01',
      'VY-26-4202,,rita.mohanty4202@vidyutacademy.in,9876500002,student,Prayas JEE 2027 — Morning,2026-10-01',
      'VY-26-4203,Zoya Kar,zoya.kar@,9876500003,student,Prayas JEE 2027 — Morning,2026-10-02',
      'VY-26-4204,Trisha Panda,trisha.panda4204@vidyutacademy.in,98765,student,Aarambh JEE 2026 — Evening,2026-10-02',
      'VY-26-4205,Aditya Nayak,aditya.nayak4205@vidyutacademy.in,9876500005,student,bat-moon-9,2026-10-03',
      'VY-26-4206,Bhavya Sahu,bhavya.sahu4206@vidyutacademy.in,9876500006,student,Aarambh JEE 2026 — Evening,2026-02-31',
      'VY-26-4207,Niharika Jena,niharika.jena4207@vidyutacademy.in,9876500007,admin,Aarogyam NEET 2026 — Morning,2026-10-04',
      'VY-26-4201,Pranav Behera,pranav.behera4201@vidyutacademy.in,9876500001,student,Prayas JEE 2027 — Morning,2026-10-01',
      'VY-26-4209,Kavya Patnaik,pranav.behera4201@vidyutacademy.in,9876500009,student,Shikhar Droppers — Full day,2026-10-06',
      'VY-26-4210,Dyuti Mishra,dyuti.mishra4210@vidyutacademy.in,9876500010,faculty,,2026-10-08',
      'VY-26-4211,Yash Bhoi,yash.bhoi4211@vidyutacademy.in,9876500011,student,Shikhar Droppers — Full day,2026-10-10',
    ].join('\n'),
  },
}
