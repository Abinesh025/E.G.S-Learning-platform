const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  margin: 50,
  size: 'A4',
  bufferPages: true
});

const outputPath = path.join(__dirname, '../project_status_report.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Define colors
const COLORS = {
  primary: '#1E3A8A',     // Navy Blue
  secondary: '#0F172A',   // Slate Dark
  text: '#334155',        // Charcoal Slate
  muted: '#64748B',       // Muted Gray
  border: '#E2E8F0',      // Border Light Gray
  bgLight: '#F8FAFC',     // Background Slate Light
  success: '#059669',     // Green
  warning: '#D97706',     // Amber
  danger: '#DC2626'       // Red
};

// Document title
doc.fillColor(COLORS.primary)
   .fontSize(22)
   .font('Helvetica-Bold')
   .text('PROJECT STATUS REPORT', 50, 50);

doc.fillColor(COLORS.muted)
   .fontSize(12)
   .font('Helvetica-Oblique')
   .text('E.G.S Learning Platform (Academic Hub)', 50, 75);

// Header Info Box
doc.rect(50, 100, 495, 70)
   .fillColor(COLORS.bgLight)
   .fill();

doc.fillColor(COLORS.secondary)
   .fontSize(10)
   .font('Helvetica-Bold')
   .text('Reporting Period:', 65, 115)
   .font('Helvetica')
   .text('May – August 2026', 160, 115)
   .font('Helvetica-Bold')
   .text('Prepared For:', 65, 132)
   .font('Helvetica')
   .text('E.G.S. Institution Stakeholders & Team', 160, 132)
   .font('Helvetica-Bold')
   .text('Project Status:', 65, 149)
   .font('Helvetica-Bold')
   .fillColor(COLORS.success)
   .text('ON TRACK (with minor database risks)', 160, 149);

let currentY = 190;

function drawSectionHeader(title) {
  // Check if we need to add a page
  if (currentY > 660) {
    doc.addPage();
    currentY = 50;
  }
  
  doc.fillColor(COLORS.primary)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(title, 50, currentY);
     
  currentY += 18;
  
  doc.moveTo(50, currentY)
     .lineTo(545, currentY)
     .strokeColor(COLORS.primary)
     .lineWidth(1)
     .stroke();
     
  currentY += 12;
}

// 1. Overall Summary
drawSectionHeader('1. OVERALL SUMMARY');
doc.fillColor(COLORS.text)
   .fontSize(10)
   .font('Helvetica')
   .text('The E.G.S Learning Platform (Academic Hub) is on track, with the core multi-role portal (Student/Staff/Admin), study materials, online assessments, and chat system fully operational. The current focus has successfully shifted to rolling out a comprehensive Placement Preparation Module for students. Development is progressing smoothly, though database validation rules need synchronization to handle recently added departments.', 50, currentY, { width: 495, align: 'justify', lineGap: 3 });

currentY += 70;

// 2. Current Progress
drawSectionHeader('2. CURRENT PROGRESS');

const progressItems = [
  {
    title: 'Milestone A: Core Platform Foundation & Security (Completed)',
    desc: '• Implemented multi-role RBAC for Student, Staff, and Administrator portals.\n• Deployed a 15-minute inactivity session auto-logout policy for admins in App.jsx.\n• Created screens for editing profiles, passwords, and custom settings.'
  },
  {
    title: 'Milestone B: Academic Portal & Department Content (Completed)',
    desc: '• Designed curricula/workflow boards for AI, EEE, Mech, and Civil Engineering.\n• Set up study materials database schemas, Multer-Cloudinary uplinks, and folder structures.\n• Created quiz portals where staff create assessments and student test records are scored.'
  },
  {
    title: 'Milestone C: Real-Time Services & Notifications (Completed)',
    desc: '• Programmed peer-to-peer and group chat lines using Socket.io.\n• Built in-app alerts and integrated an external SMS dispatch utility (sendSms.js).'
  },
  {
    title: 'Milestone D: Placement Prep Phase 1 (Completed & Staged)',
    desc: '• Created Off-Campus Dashboard (PlacementOffCampus.jsx) with application templates.\n• Built On-Campus Aptitude sheet (PlacementOnCampus.jsx) with formulas & external links.\n• Built Student Resume Templates (Resume.jsx) with 5 ATS layouts (Deedy, Modern, etc.).\n• Developed Registration Guide (RegisterRounds.jsx) with dynamic validation checklists.'
  }
];

progressItems.forEach(item => {
  if (currentY > 640) {
    doc.addPage();
    currentY = 50;
  }
  
  doc.fillColor(COLORS.secondary)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text(item.title, 50, currentY);
     
  currentY += 14;
  
  doc.fillColor(COLORS.text)
     .fontSize(9.5)
     .font('Helvetica')
     .text(item.desc, 60, currentY, { width: 485, lineGap: 2 });
     
  // calculate text height approx
  const lines = item.desc.split('\n').length;
  currentY += lines * 13 + 8;
});

// 3. Work In Progress
drawSectionHeader('3. WORK IN PROGRESS');

const wipItems = [
  {
    title: 'Dashboard Integration & Placement Hub Routing',
    owner: 'Abinesh (Lead Developer)',
    date: 'August 21, 2026',
    desc: 'Integrating the main placement landing view (Rounds.jsx) and the new Resume templates into the student dashboard. Currently in staging before commit.'
  },
  {
    title: 'Aptitude Formula Data Integrations',
    owner: 'Abinesh (Lead Developer)',
    date: 'August 24, 2026',
    desc: 'Finalizing local mock test datasets (quantsData.js and logicalData.js) to support in-app mock aptitude tests.'
  }
];

wipItems.forEach(item => {
  if (currentY > 640) {
    doc.addPage();
    currentY = 50;
  }
  
  doc.fillColor(COLORS.secondary)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text(item.title, 50, currentY);
     
  currentY += 13;
  
  doc.fillColor(COLORS.muted)
     .fontSize(9.0)
     .font('Helvetica-Bold')
     .text(`Owner: `, 60, currentY)
     .font('Helvetica')
     .text(`${item.owner}   |   Target Date: ${item.date}`, 100, currentY);
     
  currentY += 12;
  
  doc.fillColor(COLORS.text)
     .fontSize(9.5)
     .font('Helvetica')
     .text(item.desc, 60, currentY, { width: 485, lineGap: 2 });
     
  currentY += 32;
});

// 4. Upcoming Work
drawSectionHeader('4. UPCOMING WORK');

const upcoming = [
  '1. Implement Missing Placement Phase Routes (Group Discussion, Coding Rounds, Technical/Managerial/HR Interview Guides) in App.jsx.',
  '2. Harmonize Mongoose Schemas (Material.js) with newly introduced department enum values.',
  '3. End-to-End Stress testing of socket chat rooms and test submissions during mock drives.'
];

upcoming.forEach(text => {
  if (currentY > 660) {
    doc.addPage();
    currentY = 50;
  }
  doc.fillColor(COLORS.text)
     .fontSize(9.5)
     .font('Helvetica')
     .text(text, 50, currentY, { width: 495, lineGap: 2 });
  currentY += 22;
});

currentY += 10;

// 5. Blockers/Risks
drawSectionHeader('5. BLOCKERS / RISKS');
if (currentY > 640) {
  doc.addPage();
  currentY = 50;
}

// Callout Box
doc.rect(50, currentY, 495, 75)
   .fillColor('#FEF2F2')
   .strokeColor('#FCA5A5')
   .lineWidth(1)
   .fillAndStroke();

doc.fillColor(COLORS.danger)
   .fontSize(10)
   .font('Helvetica-Bold')
   .text('WARNING: Database Schema Enum Discrepancy', 65, currentY + 12);

doc.fillColor(COLORS.text)
   .fontSize(9)
   .font('Helvetica')
   .text('• Issue: error_log.txt flags "ValidationError: Material validation failed: department: ... is not a valid enum value".\n• Impact: Staff members are blocked from uploading study materials for newly introduced departments (e.g. "Computer Science and Business Systems") due to strict backend enum validation filters.\n• Mitigation: Align the validation enum in server/models/Material.js with the frontend department selections.', 65, currentY + 26, { lineGap: 2 });

currentY += 95;

// 6. Plan to Completion
drawSectionHeader('6. PLAN TO COMPLETION');
if (currentY > 640) {
  doc.addPage();
  currentY = 50;
}

const planItems = [
  { phase: 'Milestone 1', title: 'Fix Database Schema & Staging of Placement Phase 1', date: 'August 22, 2026' },
  { phase: 'Milestone 2', title: 'Placement Phase 2 (Group Discussion & Coding Rounds)', date: 'August 30, 2026' },
  { phase: 'Milestone 3', title: 'Placement Phase 3 (Mock Interview Guides & Templates)', date: 'September 06, 2026' },
  { phase: 'Milestone 4', title: 'Staging Deployment & User Acceptance Testing (UAT)', date: 'September 12, 2026' }
];

planItems.forEach(item => {
  doc.fillColor(COLORS.secondary)
     .fontSize(9.5)
     .font('Helvetica-Bold')
     .text(item.phase + ':', 50, currentY)
     .font('Helvetica')
     .text(item.title, 120, currentY)
     .font('Helvetica-Bold')
     .text(item.date, 450, currentY, { width: 95, align: 'right' });
  currentY += 20;
});

currentY += 15;

// 7. Action Items
drawSectionHeader('7. ACTION ITEMS');
if (currentY > 640) {
  doc.addPage();
  currentY = 50;
}

// Table Header
doc.rect(50, currentY, 495, 20)
   .fillColor(COLORS.primary)
   .fill();

doc.fillColor('#FFFFFF')
   .fontSize(9)
   .font('Helvetica-Bold')
   .text('Action Item', 55, currentY + 6)
   .text('Owner', 330, currentY + 6)
   .text('Deadline', 410, currentY + 6)
   .text('Status', 485, currentY + 6);

currentY += 20;

const actions = [
  { desc: 'Sync Mongoose Department Enums in Material.js', owner: 'Abinesh', date: 'Aug 20, 2026', status: 'Pending' },
  { desc: 'Stage & Commit Untracked Files (Resume, Rounds)', owner: 'Abinesh', date: 'Aug 21, 2026', status: 'Pending' },
  { desc: 'Register Placement Prep routes in App.jsx', owner: 'Abinesh', date: 'Aug 23, 2026', status: 'Pending' },
  { desc: 'Configure Environment Secrets on Render Staging', owner: 'Admin', date: 'Sep 10, 2026', status: 'Pending' }
];

actions.forEach((act, idx) => {
  // Alternate row coloring
  if (idx % 2 === 1) {
    doc.rect(50, currentY, 495, 22)
       .fillColor(COLORS.bgLight)
       .fill();
  }
  
  doc.fillColor(COLORS.text)
     .fontSize(8.5)
     .font('Helvetica')
     .text(act.desc, 55, currentY + 6, { width: 270 })
     .text(act.owner, 330, currentY + 6)
     .text(act.date, 410, currentY + 6)
     .font('Helvetica-Bold')
     .text(act.status, 485, currentY + 6);
     
  // Border line below row
  doc.moveTo(50, currentY + 22)
     .lineTo(545, currentY + 22)
     .strokeColor(COLORS.border)
     .lineWidth(0.5)
     .stroke();
     
  currentY += 22;
});

// Add Footer with Page Numbers
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.fillColor(COLORS.muted)
     .fontSize(8)
     .font('Helvetica')
     .text(`Page ${i + 1} of ${pages.count}`, 50, 790, { align: 'center' });
}

doc.end();
console.log('PDF successfully generated.');
