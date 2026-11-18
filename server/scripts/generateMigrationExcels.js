const fs = require('fs')
const path = require('path')
const XLSX = require('../node_modules/xlsx')

const outputDir = path.join(__dirname, '../../migration_templates')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// -----------------------------------------------------------------------------
// 1. Materials Migration Excel
// -----------------------------------------------------------------------------
const materialsData = [
  {
    Title: 'TCP/IP Protocol Suite & Layer Architecture',
    Subject: 'Computer Networks',
    SubjectName: 'Advanced Computer Networks',
    Unit: 'Unit 1',
    FileType: 'pdf',
    FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/tcp-ip-unit1.pdf',
    Department: 'Computer Science and Engineering',
    Semester: 5,
    Course: 'CS3501',
    StaffRegnum: 'EGSP001',
    StaffName: 'Praveen Kumar',
  },
  {
    Title: 'Relational Algebra & Normalization (1NF to BCNF)',
    Subject: 'Database Management Systems',
    SubjectName: 'Database Management Systems',
    Unit: 'Unit 2',
    FileType: 'pdf',
    FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/dbms-unit2.pdf',
    Department: 'Computer Science and Business Systems',
    Semester: 4,
    Course: 'CB3402',
    StaffRegnum: 'EGSP001',
    StaffName: 'Praveen Kumar',
  },
  {
    Title: 'Machine Learning Supervised Algorithms: Regression & Classification',
    Subject: 'Machine Learning',
    SubjectName: 'Applied Machine Learning',
    Unit: 'Unit 3',
    FileType: 'docx',
    FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/ml-unit3.docx',
    Department: 'Artificial Intelligence and Data Science',
    Semester: 6,
    Course: 'AD3601',
    StaffRegnum: 'EGSP001',
    StaffName: 'Praveen Kumar',
  },
  {
    Title: 'Cloud Computing Infrastructure & Virtualization',
    Subject: 'Cloud Computing',
    SubjectName: 'Cloud Services and Architecture',
    Unit: 'Unit 1',
    FileType: 'pdf',
    FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/cloud-unit1.pdf',
    Department: 'Information Technology',
    Semester: 7,
    Course: 'IT3701',
    StaffRegnum: 'EGSP001',
    StaffName: 'Praveen Kumar',
  },
  {
    Title: 'Digital Signal Processing: FFT & DFT Transforms',
    Subject: 'Digital Signal Processing',
    SubjectName: 'Digital Signal Processing & Applications',
    Unit: 'Unit 2',
    FileType: 'pdf',
    FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/dsp-unit2.pdf',
    Department: 'Electronics and Communication Engineering',
    Semester: 5,
    Course: 'EC3503',
    StaffRegnum: 'EGSP001',
    StaffName: 'Praveen Kumar',
  },
  {
    Title: 'Thermodynamics & Heat Transfer Principles',
    Subject: 'Thermal Engineering',
    SubjectName: 'Applied Thermal Engineering',
    Unit: 'Unit 1',
    FileType: 'pptx',
    FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/thermal-unit1.pptx',
    Department: 'Mechanical Engineering',
    Semester: 4,
    Course: 'ME3401',
    StaffRegnum: 'EGSP001',
    StaffName: 'Praveen Kumar',
  },
]

const materialsWs = XLSX.utils.json_to_sheet(materialsData)
const materialsWb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(materialsWb, materialsWs, 'Materials')
const materialsPath = path.join(outputDir, 'materials_migration.xlsx')
XLSX.writeFile(materialsWb, materialsPath)
console.log('✅ Generated:', materialsPath)

// -----------------------------------------------------------------------------
// 2. Tests Migration Excel (Test + Questions + Options)
// -----------------------------------------------------------------------------
const testsData = [
  {
    TestTitle: 'Computer Networks Unit 1 Assessment',
    Subject: 'Computer Networks',
    Department: 'Computer Science and Engineering',
    DurationMinutes: 30,
    StaffRegnum: 'EGSP001',
    QuestionOrder: 1,
    QuestionText: 'Which layer in the OSI model is responsible for end-to-end communication and port addressing?',
    OptionA: 'Physical Layer',
    OptionB: 'Data Link Layer',
    OptionC: 'Network Layer',
    OptionD: 'Transport Layer',
    CorrectOption: 'D',
  },
  {
    TestTitle: 'Computer Networks Unit 1 Assessment',
    Subject: 'Computer Networks',
    Department: 'Computer Science and Engineering',
    DurationMinutes: 30,
    StaffRegnum: 'EGSP001',
    QuestionOrder: 2,
    QuestionText: 'What is the default port number used by HTTPS?',
    OptionA: '80',
    OptionB: '443',
    OptionC: '8080',
    OptionD: '22',
    CorrectOption: 'B',
  },
  {
    TestTitle: 'Computer Networks Unit 1 Assessment',
    Subject: 'Computer Networks',
    Department: 'Computer Science and Engineering',
    DurationMinutes: 30,
    StaffRegnum: 'EGSP001',
    QuestionOrder: 3,
    QuestionText: 'Which protocol is connectionless and does not guarantee packet delivery?',
    OptionA: 'TCP',
    OptionB: 'FTP',
    OptionC: 'UDP',
    OptionD: 'BGP',
    CorrectOption: 'C',
  },
  {
    TestTitle: 'Database Management Systems Quiz 1',
    Subject: 'Database Management Systems',
    Department: 'Computer Science and Business Systems',
    DurationMinutes: 20,
    StaffRegnum: 'EGSP001',
    QuestionOrder: 1,
    QuestionText: 'Which normal form eliminates partial functional dependencies on candidate keys?',
    OptionA: '1NF',
    OptionB: '2NF',
    OptionC: '3NF',
    OptionD: 'BCNF',
    CorrectOption: 'B',
  },
  {
    TestTitle: 'Database Management Systems Quiz 1',
    Subject: 'Database Management Systems',
    Department: 'Computer Science and Business Systems',
    DurationMinutes: 20,
    StaffRegnum: 'EGSP001',
    QuestionOrder: 2,
    QuestionText: 'What property in ACID guarantees that transactions are all-or-nothing?',
    OptionA: 'Atomicity',
    OptionB: 'Consistency',
    OptionC: 'Isolation',
    OptionD: 'Durability',
    CorrectOption: 'A',
  },
  {
    TestTitle: 'Artificial Intelligence Basics',
    Subject: 'Machine Learning',
    Department: 'Artificial Intelligence and Data Science',
    DurationMinutes: 25,
    StaffRegnum: 'EGSP001',
    QuestionOrder: 1,
    QuestionText: 'Which algorithm is a supervised classification technique based on Bayes theorem?',
    OptionA: 'K-Means',
    OptionB: 'Naive Bayes',
    OptionC: 'DBSCAN',
    OptionD: 'PCA',
    CorrectOption: 'B',
  },
]

const testsWs = XLSX.utils.json_to_sheet(testsData)
const testsWb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(testsWb, testsWs, 'Tests')
const testsPath = path.join(outputDir, 'tests_migration.xlsx')
XLSX.writeFile(testsWb, testsPath)
console.log('✅ Generated:', testsPath)

// -----------------------------------------------------------------------------
// 3. Results Migration Excel
// -----------------------------------------------------------------------------
const resultsData = [
  {
    StudentRegnum: '8208E26ADR061',
    StudentId: 'ADR001',
    StudentName: 'Vaishnavi Nair',
    Department: 'Artificial Intelligence and Data Science',
    TestTitle: 'Artificial Intelligence Basics',
    Subject: 'Machine Learning',
    Score: 18.0,
    TotalMarks: 20.0,
    Percentage: 90.0,
    TotalQuestions: 20,
    SmsStatus: 'sent',
    SubmissionDate: '2026-11-18 10:30:00',
  },
  {
    StudentRegnum: '8208E26ADR061',
    StudentId: 'ADR001',
    StudentName: 'Vaishnavi Nair',
    Department: 'Artificial Intelligence and Data Science',
    TestTitle: 'Computer Networks Unit 1 Assessment',
    Subject: 'Computer Networks',
    Score: 27.0,
    TotalMarks: 30.0,
    Percentage: 90.0,
    TotalQuestions: 30,
    SmsStatus: 'sent',
    SubmissionDate: '2026-11-18 14:15:00',
  },
  {
    StudentRegnum: '8208E26CSR001',
    StudentId: 'CSR001',
    StudentName: 'Aravind Swaminathan',
    Department: 'Computer Science and Engineering',
    TestTitle: 'Computer Networks Unit 1 Assessment',
    Subject: 'Computer Networks',
    Score: 25.0,
    TotalMarks: 30.0,
    Percentage: 83.33,
    TotalQuestions: 30,
    SmsStatus: 'sent',
    SubmissionDate: '2026-11-18 14:20:00',
  },
  {
    StudentRegnum: '8208E26BSR001',
    StudentId: 'BSR001',
    StudentName: 'Karthik Raja',
    Department: 'Computer Science and Business Systems',
    TestTitle: 'Database Management Systems Quiz 1',
    Subject: 'Database Management Systems',
    Score: 19.0,
    TotalMarks: 20.0,
    Percentage: 95.0,
    TotalQuestions: 20,
    SmsStatus: 'not_sent',
    SubmissionDate: '2026-11-18 11:00:00',
  },
  {
    StudentRegnum: '8208E26ITR001',
    StudentId: 'ITR001',
    StudentName: 'Deepak Raj',
    Department: 'Information Technology',
    TestTitle: 'Computer Networks Unit 1 Assessment',
    Subject: 'Computer Networks',
    Score: 22.0,
    TotalMarks: 30.0,
    Percentage: 73.33,
    TotalQuestions: 30,
    SmsStatus: 'sent',
    SubmissionDate: '2026-11-18 15:45:00',
  },
]

const resultsWs = XLSX.utils.json_to_sheet(resultsData)
const resultsWb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(resultsWb, resultsWs, 'Results')
const resultsPath = path.join(outputDir, 'results_migration.xlsx')
XLSX.writeFile(resultsWb, resultsPath)
console.log('✅ Generated:', resultsPath)
