import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Info, 
  ClipboardCheck, 
  User, 
  GraduationCap, 
  FileText, 
  Cpu, 
  FolderGit2, 
  Building, 
  Award, 
  Globe, 
  Files, 
  CheckSquare, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Bookmark,
  Check
} from 'lucide-react'

export default function RegisterRounds() {
  // Section 12 Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Verify personal details', checked: false },
    { id: 2, text: 'Verify academic details', checked: false },
    { id: 3, text: 'Verify email', checked: false },
    { id: 4, text: 'Verify mobile number', checked: false },
    { id: 5, text: 'Upload correct resume', checked: false },
    { id: 6, text: 'Check uploaded documents', checked: false },
    { id: 7, text: 'Read the complete job description', checked: false },
    { id: 8, text: 'Confirm eligibility', checked: false },
    { id: 9, text: 'Submit only once', checked: false },
  ])

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item))
  }

  const allChecked = checklist.every(item => item.checked)

  // Section 11 Required Documents Data
  const documents = [
    { title: 'Resume', desc: 'Latest version, professional formatting, PDF format.' },
    { title: 'Passport-size Photograph', desc: 'Recent formal photo, clear background, correct dimensions.' },
    { title: 'College ID Card', desc: 'Valid institutional ID card, front and back sides.' },
    { title: 'Government ID Proof', desc: 'Aadhaar Card, PAN Card, or Passport for identity check.' },
    { title: 'Semester Mark Sheets', desc: 'All semester mark sheets consolidated or individual PDFs.' },
    { title: 'Certifications', desc: 'Verifiable course completion certificates mentioned in resume.' },
    { title: 'Company Specific Docs', desc: 'Any additional forms or records requested by the company.' }
  ]

  // Section 13 Common Mistakes Data
  const commonMistakes = [
    { title: 'Unprofessional Email', desc: 'Using emails like "coolboy123@gmail.com" instead of a formal name-based email.' },
    { title: 'Outdated Resume', desc: 'Uploading older files without recent semester grades or projects.' },
    { title: 'Incorrect Academics', desc: 'Mistyping CGPA, backlog counts, or percentage values. This leads to immediate disqualification.' },
    { title: 'Mentioning Fake Skills', desc: 'Adding skills you cannot explain or do not actually possess just to look stronger.' },
    { title: 'Typing Mistakes', desc: 'Spelling errors in your full name, degree name, college name, or mobile number.' },
    { title: 'Incorrect Documents', desc: 'Uploading wrong files (e.g., uploading College ID in place of Passport Photo).' },
    { title: 'Ignoring Eligibility', desc: 'Applying for job profiles for which your department or CGPA does not qualify.' },
    { title: 'Multiple Submissions', desc: 'Registering multiple times for the same company drive, creating duplicate database entries.' },
    { title: 'Missing the Deadline', desc: 'Waiting until the last minute and failing to register due to server loads or network drops.' }
  ]

  // Section 14 Registration Tips Data
  const registrationTips = [
    { title: 'Register Early', desc: 'Complete registration early to avoid last-minute portal crashes or connectivity drops.' },
    { title: 'Read Job Description', desc: 'Carefully read the role description, job location, bond terms, and salary details before registering.' },
    { title: 'Double-Check Fields', desc: 'Review spelling, GPA inputs, and email addresses twice before clicking submit.' },
    { title: 'Update Your Resume', desc: 'Align details in the form exactly with the values inside your uploaded resume.' },
    { title: 'Professional Email', desc: 'Consistently use your official college email or a simple name-based personal email.' },
    { title: 'Maintain Genuine Info', desc: 'Always provide accurate data. Discrepancies during document verification lead to permanent blacklisting.' },
    { title: 'Keep Documents Ready', desc: 'Organize scanned PDFs and photos in a dedicated folder on your device for rapid upload.' },
    { title: 'Final Review', desc: 'Use preview features or read through every input field one last time before final submission.' }
  ]

  return (
    <div className="p-6 max-w-none w-full space-y-8 animate-fade-up">
      
      {/* Breadcrumbs */}
      <nav className="text-xs font-500 text-ink-400 flex items-center gap-2 mb-2">
        <Link to="/student" className="hover:text-lime-300 transition-colors">Dashboard</Link>
        <span className="text-ink-600">/</span>
        <Link to="/student/placement/on-campus" className="hover:text-lime-300 transition-colors">Placement Preparation</Link>
        <span className="text-ink-600">/</span>
        <Link to="/student/placement/on-campus" className="hover:text-lime-300 transition-colors">Placement Rounds</Link>
        <span className="text-ink-600">/</span>
        <span className="text-ink-200">Registration Round</span>
      </nav>

      {/* Back Link */}
      <Link to="/student/placement/on-campus" className="inline-flex items-center gap-2 text-ink-400 hover:text-lime-300 transition-colors mb-2 text-sm font-500">
        <ArrowLeft size={16} /> Back to On-Campus Rounds
      </Link>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-800 pb-4">
        <div>
          <h1 className="page-title text-2xl md:text-3xl">Registration Round</h1>
          <p className="text-ink-400 mt-1 max-w-3xl text-sm">
            Complete your placement registration correctly by following the guidelines below.
          </p>
        </div>
      </div>

      {/* SECTION 1: What is the Registration Round? */}
      <div className="card p-6 border-l-4 border-l-lime-400 bg-ink-900/60">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-lime-400/10 rounded-xl flex items-center justify-center text-lime-400 shrink-0">
            <Info size={20} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-ink-50">1. What is the Registration Round?</h2>
            <p className="text-sm text-ink-300 leading-relaxed max-w-5xl">
              The registration round is the critical first stage of the placement process where students submit their personal, academic, and professional details. This data acts as your primary profile and will be used by recruiters throughout the recruitment cycle. All information submitted must be accurate, verified, and genuine. Discrepancies discovered later will result in immediate disqualification and campus placement suspension.
            </p>
          </div>
        </div>
      </div>

      {/* Grid for Eligibility & Personal Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 2: Eligibility Check */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-400/10 rounded-xl flex items-center justify-center text-sky-400">
                <ClipboardCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">2. Eligibility Check</h2>
            </div>
            <p className="text-xs text-ink-400">
              Ensure you review and check these items on the official recruitment notice before filling out the form:
            </p>
            <ul className="space-y-3">
              {[
                'Verify the specific eligibility criteria detailed by the hiring company.',
                'Verify your CGPA or overall percentage against the minimum requirements.',
                'Check backlog requirements (some companies allow 0 active backlogs, others specify clean history).',
                'Confirm that your academic department is officially eligible for the drive.',
                'Verify your year of graduation matches the targeted cohort.',
                'Read the complete job description (JD) to understand expectations and role nature.',
                'Check the registration deadline and lock in your submission well in advance.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SECTION 3: Personal Information */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-400/10 rounded-xl flex items-center justify-center text-purple-400">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">3. Personal Information</h2>
            </div>
            <p className="text-xs text-ink-400">
              Your contact details are critical for recruiters to share test credentials, scheduling invites, and offers:
            </p>
            <ul className="space-y-3">
              {[
                'Enter your full name exactly as it appears on your 10th mark sheet and official government documents.',
                'Use an active and professional email address (e.g., first.last@gmail.com). Avoid casual aliases.',
                'Enter a valid, active mobile number. Keep it accessible at all times for quick callbacks.',
                'Verify your date of birth format and ensure it matches school records.',
                'Enter the correct temporary and permanent address coordinates.',
                'Carefully check for any spelling mistakes or character omissions before submitting.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Grid for Academic Info & Resume Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 4: Academic Information */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400">
                <GraduationCap size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">4. Academic Information</h2>
            </div>
            <p className="text-xs text-ink-400">
              Double-check all records. Companies compare form inputs against official transcript files:
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs bg-ink-950 p-4 rounded-xl border border-ink-800 text-ink-300">
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Secondary Education</span><strong>10th Percentage/CGPA</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Higher Secondary</span><strong>12th Percentage or Diploma</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Undergraduate</span><strong>Current College CGPA</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Major</span><strong>Department</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Qualification</span><strong>Degree</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">College Name</span><strong>E.G.S. Pillay Engg College</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Affiliation</span><strong>University</strong></div>
              <div className="flex flex-col"><span className="text-[10px] text-ink-500 font-semibold uppercase">Timeline</span><strong>Graduation Year</strong></div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-xs">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>CRITICAL NOTE:</strong> Do not round off CGPA values (e.g. 7.95 to 8.0) or falsify scores. Any mismatch identified during verification will lead to immediate cancellation of your application.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: Resume Upload */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">5. Resume Upload</h2>
            </div>
            <p className="text-xs text-ink-400">
              Your resume is the most important file you will upload during this registration:
            </p>
            <ul className="space-y-3">
              {[
                'Upload only your latest, updated resume which reflects all current projects and certifications.',
                'Use PDF format strictly to preserve formatting, unless the system explicitly requests a Word document.',
                'Use a professional filename structure. Good: "FirstName_LastName_Resume.pdf". Bad: "resume_final_updated2.pdf".',
                'Thoroughly check for spelling and grammar errors. Ask peers or mentors to review.',
                'Ensure all contact links, links to portfolios, or repositories inside the PDF are active and clickable.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Grid for Skills & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 6: Skills */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-400/10 rounded-xl flex items-center justify-center text-rose-400">
                <Cpu size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">6. Professional Skills</h2>
            </div>
            <p className="text-xs text-ink-400">
              Tailor and split your skill list into specific professional categories based on your competency:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'Technical Skills', 'Software Tools', 'Programming Languages', 
                'Design Software', 'CAD/Modeling Tools', 'Analysis Tools', 
                'Laboratory Skills', 'Communication Skills', 'Leadership', 'Teamwork'
              ].map((skill, idx) => (
                <div key={idx} className="bg-ink-950 px-3 py-2 rounded-lg border border-ink-800 text-[11px] text-ink-300 text-center font-500">
                  {skill}
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-400/15 border border-amber-400/20 text-amber-300 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Bookmark size={14} /> Important Note on Authenticity
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-200">
                <li>Only list skills that you actually possess and can explain in depth.</li>
                <li>Do not add buzzwords simply to make your profile look stronger.</li>
                <li>Interviewers will ask specific conceptual and practical questions based on every skill listed on your profile.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 7: Projects */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-400/10 rounded-xl flex items-center justify-center text-teal-300">
                <FolderGit2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">7. Academic & Personal Projects</h2>
            </div>
            <p className="text-xs text-ink-400">
              When describing projects in your resume or registration portal, ensure you include these parameters:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {['Project Title', 'Clear Objective', 'Technologies Used', 'Your Specific Role', 'Core Features', 'Challenges Met', 'Final Outcome'].map((param, idx) => (
                <div key={idx} className="bg-ink-950 p-2.5 rounded border border-ink-800 text-center text-ink-300 font-500">
                  {param}
                </div>
              ))}
            </div>
            <div className="p-3 bg-ink-800/40 border border-ink-800 rounded-xl text-xs text-ink-400">
              <strong>Note:</strong> Project types vary significantly depending on your core department. CS/IT students should focus on software/web apps; ECE/EEE on hardware prototyping and microcontrollers; Mech/Civil on CAD designs, structural analysis, or fabrications.
            </div>
          </div>
        </div>

      </div>

      {/* Grid for Internships, Certifications, and Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SECTION 8: Internships */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-400/10 rounded-xl flex items-center justify-center text-pink-400">
              <Building size={20} />
            </div>
            <h2 className="text-base font-bold text-ink-50">8. Internships</h2>
          </div>
          <p className="text-xs text-ink-400">
            Detail any industrial exposure or internships you completed during your study:
          </p>
          <div className="space-y-2 text-xs">
            {['Company Name', 'Duration & Timeline', 'Job Title/Role', 'Key Responsibilities', 'Skills & Tools Learned'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-ink-950 p-2 rounded border border-ink-800 text-ink-300">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 9: Certifications */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400">
              <Award size={20} />
            </div>
            <h2 className="text-base font-bold text-ink-50">9. Certifications</h2>
          </div>
          <p className="text-xs text-ink-400">
            Mention only valid, verifiable course certifications from standard providers:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-300 font-500">
            {['NPTEL', 'Coursera', 'Udemy', 'TCS iON', 'Microsoft', 'Google', 'AWS', 'Cisco', 'Oracle', 'Core Dept Certs'].map((platform, idx) => (
              <div key={idx} className="bg-ink-950 p-2 rounded border border-ink-800 text-center">
                {platform}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 10: Professional Profiles */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-400/10 rounded-xl flex items-center justify-center text-cyan-400">
              <Globe size={20} />
            </div>
            <h2 className="text-base font-bold text-ink-50">10. Professional Profiles</h2>
          </div>
          <p className="text-xs text-ink-400">
            Maintain updated profiles on primary professional channels to show your public work:
          </p>
          <div className="space-y-2 text-xs">
            {[
              { label: 'LinkedIn', note: 'Essential for networking & background verification.' },
              { label: 'GitHub', note: 'Mandatory for coding/programming portfolios.' },
              { label: 'Portfolio Website', note: 'Highly recommended to showcase personal projects.' },
              { label: 'Behance / Dribbble', note: 'For design, graphics, or UI/UX students.' },
              { label: 'Other Portfolios', note: 'CAD modeling vaults, research logs, etc.' }
            ].map((profile, idx) => (
              <div key={idx} className="bg-ink-950 p-2 rounded border border-ink-800">
                <strong className="text-cyan-300 block text-[11px]">{profile.label}</strong>
                <span className="text-[10px] text-ink-400">{profile.note}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 11: Required Documents */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-400/10 rounded-xl flex items-center justify-center text-sky-400">
            <Files size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-50">11. Required Documents</h2>
            <p className="text-xs text-ink-400">Keep high-quality scanned copies (PDF/JPEG) of these documents ready on your computer:</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {documents.map((doc, idx) => (
            <div key={idx} className="bg-ink-800/40 p-4 rounded-xl border border-ink-800 flex flex-col justify-between hover:border-sky-500/30 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-xs font-bold text-sky-300">{doc.title}</span>
                <p className="text-[11px] text-ink-400 leading-relaxed">{doc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 12: Before Clicking Register (Interactive Checklist) */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-400/10 rounded-xl flex items-center justify-center text-lime-400">
              <CheckSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-50">12. Before Clicking Register</h2>
              <p className="text-xs text-ink-400">Click each checkmark item below to verify your details before submitting:</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="shrink-0 flex items-center gap-3">
            <span className="text-xs text-ink-400 font-500">
              Verified: {checklist.filter(item => item.checked).length} / {checklist.length}
            </span>
            <div className="w-24 h-2 bg-ink-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-lime-400 transition-all duration-300"
                style={{ width: `${(checklist.filter(item => item.checked).length / checklist.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checkbox grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                item.checked 
                  ? 'bg-lime-400/5 border-lime-400/40 text-lime-300 shadow-sm shadow-lime-400/5' 
                  : 'bg-ink-950 border-ink-800 text-ink-300 hover:border-ink-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
                item.checked ? 'bg-lime-400 border-lime-400 text-ink-950' : 'border-ink-600'
              }`}>
                {item.checked && <Check size={14} className="stroke-[3]" />}
              </div>
              <span className="text-xs font-500">{item.text}</span>
            </button>
          ))}
        </div>

        {allChecked && (
          <div className="flex items-center gap-3 p-4 bg-lime-400/10 border border-lime-400/20 text-lime-300 rounded-xl animate-fade-in">
            <CheckCircle2 size={20} className="shrink-0 text-lime-400" />
            <div className="text-xs">
              <strong>All details verified!</strong> You have successfully checked every requirement. Ensure you submit the registration form once and keep a copy of your submission screenshot.
            </div>
          </div>
        )}
      </div>

      {/* SECTION 13: Common Mistakes */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-400/10 rounded-xl flex items-center justify-center text-red-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-50">13. Common Mistakes to Avoid</h2>
            <p className="text-xs text-ink-400">Disqualification happens mostly due to avoidable errors. Stay alert:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {commonMistakes.map((mistake, idx) => (
            <div key={idx} className="bg-ink-950 p-4 rounded-xl border border-red-500/10 flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {mistake.title}
                </span>
                <p className="text-[11px] text-ink-400 leading-relaxed">{mistake.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 14: Registration Tips */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400">
            <Lightbulb size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-50">14. Pro Registration Tips</h2>
            <p className="text-xs text-ink-400">Follow these practices to ensure a smooth, error-free registration:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {registrationTips.map((tip, idx) => (
            <div key={idx} className="bg-ink-950 p-4 rounded-xl border border-emerald-500/10 flex flex-col justify-between hover:border-emerald-500/25 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {tip.title}
                </span>
                <p className="text-[11px] text-ink-400 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION: Highlight Message */}
      <div className="bg-gradient-to-r from-lime-400/10 via-ink-900 to-indigo-500/10 border border-ink-800 p-6 rounded-2xl text-center max-w-5xl mx-auto space-y-2 shadow-xl shadow-lime-400/[0.01]">
        <p className="text-sm font-semibold text-lime-300 tracking-wide uppercase">Your Gateway to Placements</p>
        <p className="text-base font-bold text-ink-50 leading-relaxed italic">
          "Your registration is your first impression during the placement process. Accurate information, a professional resume, and genuine skills increase your chances of progressing to the next round."
        </p>
      </div>

    </div>
  )
}
