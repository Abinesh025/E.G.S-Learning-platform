import React, { useState } from 'react';
import MetaData from '../../components/layout/MetaData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  Mail, Phone, MapPin, Linkedin, Github, ExternalLink, FileText, X,
  ZoomIn, ZoomOut, RotateCcw, Info, Eye, AlertTriangle, Sparkles, Globe
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 1,
    name: "Professional",
    category: "Professional",
    description: "A clean professional template suitable for campus placements and corporate applications.",
    tagline: "Standard placement layout"
  },
  {
    id: 2,
    name: "Modern",
    category: "Modern",
    description: "A modern layout with clear sections and strong visual hierarchy.",
    tagline: "Two-column accent layout"
  },
  {
    id: 3,
    name: "Minimal",
    category: "Minimal",
    description: "A simple ATS-friendly layout focused on readability and relevant information.",
    tagline: "Text-focused ATS layout"
  },
  {
    id: 4,
    name: "Technical",
    category: "Technical",
    description: "A technical resume layout highlighting skills, projects, education, and experience.",
    tagline: "Developer-focused badge layout"
  },
  {
    id: 5,
    name: "Deedy CV",
    category: "Technical",
    description: "A classic two-column high-density layout inspired by the popular LaTeX Deedy CV.",
    tagline: "Asymmetric two-column layout"
  }
];

const RESUME_DEMO_DATA = {
  personal: {
    name: "XXXXX X",
    title: "Full Stack Developer",
    email: "xxx.xxx@egs.edu.in",
    phone: "+91 95864 18231",
    location: "XXXXXX, TN",
    linkedin: "linkedin.com/in/xxxxx-s",
    github: "github.com/xxxxx-s",
    summary: "Computer Science undergraduate dedicated to engineering scalable web architectures, full-stack tools, and role-based placement platforms. Strong foundations in DSA, REST APIs, and database modeling."
  },
  education: [
    {
      degree: "B.Tech in Computer Science and Engineering",
      college: "E.G.S. Pillay Engineering College",
      university: "Anna University",
      duration: "2023 - 2027",
      grade: "CGPA: 8.45/10"
    },
    {
      degree: "HSC (12th Grade) - Bio-Maths",
      college: "E.G.S. Pillay Matriculation School",
      university: "State Board",
      duration: "2021 - 2023",
      grade: "Percentage: 91.2%"
    }
  ],
  skills: [
    { category: "Languages", items: ["Java", "JavaScript", "Python", "SQL", "HTML/CSS"] },
    { category: "Frameworks & Libs", items: ["React.js", "Node.js", "Express.js", "Tailwind CSS"] },
    { category: "Databases & Cloud", items: ["MongoDB", "MySQL", "Firebase"] },
    { category: "Tools & OS", items: ["Git", "GitHub", "VS Code", "Postman", "Linux"] }
  ],
  experience: [
    {
      company: "XXXXXX Tech Hub",
      role: "Full Stack Intern",
      duration: "June 2025 - July 2025",
      location: "XXXXXX, TN",
      description: [
        "Developed responsive frontend dashboards using React.js and styled CSS variables.",
        "Coded secure REST API endpoints mapping MongoDB queries to display real-time placement stats.",
        "Optimized client-side rendering times by 15% using React lazy loading and memoization."
      ]
    }
  ],
  projects: [
    {
      name: "XXXXXX Project Portal",
      tech: "React.js, Node.js, Express.js, MongoDB",
      link: "github.com/xxxxx-s/xxxx-portal",
      description: [
        "Designed a role-based authentication layout permitting secure student and staff logins.",
        "Integrated file upload systems allowing educators to share materials with target branches.",
        "Implemented real-time notifications using WebSockets for placement updates."
      ]
    }
  ],
  certifications: [
    {
      name: "Meta Front-End Developer Professional Certificate",
      issuer: "Coursera / Meta",
      date: "Nov 2024"
    },
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "Jan 2025"
    }
  ]
};

const DEPARTMENT_KEYWORDS = {
  "Computer Science & IT": {
    languages: "Java, Python, C++, SQL, JavaScript, TypeScript, HTML5, CSS3",
    frameworks: "React.js, Node.js, Express.js, MongoDB, REST APIs, Next.js",
    concepts: "Data Structures & Algorithms (DSA), OOPs, DBMS, Operating Systems, Computer Networks",
    tools: "Git, GitHub, Postman, Docker, AWS, Agile, SDLC, Unit Testing"
  },
  "Electronics & Communication (ECE)": {
    languages: "Embedded C, Verilog, VHDL, Assembly Language, Python, MATLAB",
    frameworks: "RTOS, DSP Algorithms, VLSI Design Flows, Circuit Schematics",
    concepts: "Embedded Systems, VLSI, Digital Signal Processing, Analog & Digital Electronics, IoT Protocols",
    tools: "Keil uVision, Proteus, Arduino IDE, Xilinx Vivado, Multisim, PCB Design Tools"
  },
  "Electrical & Electronics (EEE)": {
    languages: "MATLAB/Simulink, PLC Programming, Ladder Logic, Embedded C, Python",
    frameworks: "PLC & SCADA, Power Grid Simulations, Circuit design, Control Algorithms",
    concepts: "Power Systems, Electrical Machines, Power Electronics, Control Systems, Smart Grids",
    tools: "AutoCAD Electrical, Multisim, LabVIEW, PSPICE, Arduino, Dialux"
  },
  "Mechanical Engineering (MECH)": {
    languages: "G-Code & M-Code (CNC), Python (Data Analysis), MATLAB, LISP (AutoCAD)",
    frameworks: "Finite Element Analysis (FEA), Computational Fluid Dynamics (CFD), DFM",
    concepts: "Thermodynamics, Fluid Mechanics, Strength of Materials, Kinematics, GD&T, Lean Manufacturing",
    tools: "AutoCAD, SolidWorks, CATIA, ANSYS, Creo, Fusion 360, CNC Tools"
  },
  "Civil Engineering (CIVIL)": {
    languages: "SQL (Geographic databases), Python (GIS scripting), R (Statistical analysis)",
    frameworks: "Building Information Modeling (BIM), Structural Design Codes, Primavera Planner",
    concepts: "Structural Analysis, Geotechnical Engineering, Estimation & Costing, Surveying, GIS, Concrete Tech",
    tools: "AutoCAD, Revit, STAAD.Pro, ETABS, Primavera, MS Project, ArcGIS, QGIS"
  }
};

// 1. Professional Template Component
function ProfessionalTemplate({ data = {} }) {
  const personal = data.personal || {};
  const education = data.education || [];
  const skills = data.skills || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  return (
    <div className="font-sans text-slate-800 p-8 bg-white h-full overflow-y-auto no-scrollbar text-left">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide uppercase">{personal.name || ''}</h1>
        <p className="text-sm font-semibold text-slate-600 mt-1">{personal.title || ''}</p>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2 font-mono">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && (
            <>
              <span>•</span>
              <span>{personal.phone}</span>
            </>
          )}
          {personal.location && (
            <>
              <span>•</span>
              <span>{personal.location}</span>
            </>
          )}
          {personal.linkedin && (
            <>
              <span>•</span>
              <span className="underline">{personal.linkedin}</span>
            </>
          )}
          {personal.github && (
            <>
              <span>•</span>
              <span className="underline">{personal.github}</span>
            </>
          )}
        </div>
      </div>

      {personal.summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-700 pb-0.5 mb-2">Professional Summary</h2>
          <p className="text-xs text-slate-605 leading-relaxed">{personal.summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-700 pb-0.5 mb-2">Work Experience</h2>
          {experience.map((exp, idx) => (
            <div key={idx} className="mb-3 animate-fade-in">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>{exp.role || ''} - {exp.company || ''}</span>
                <span className="font-medium text-slate-500 font-mono">{exp.duration || ''}</span>
              </div>
              <p className="text-[10px] italic text-slate-500 mb-1">{exp.location || ''}</p>
              {Array.isArray(exp.description) && (
                <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5">
                  {exp.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-700 pb-0.5 mb-2">Academic & Personal Projects</h2>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>{proj.name || ''} ({proj.tech || ''})</span>
                <span className="font-normal text-slate-500 underline text-[10px] font-mono">{proj.link || ''}</span>
              </div>
              {Array.isArray(proj.description) && (
                <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5 mt-1">
                  {proj.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-700 pb-0.5 mb-2">Skills & Competencies</h2>
          <div className="space-y-1">
            {skills.map((skill, idx) => (
              <div key={idx} className="text-xs text-slate-600">
                <span className="font-bold text-slate-700">{skill.category || 'Skills'}: </span>
                <span>{Array.isArray(skill.items) ? skill.items.join(', ') : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-700 pb-0.5 mb-2">Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} className="flex justify-between text-xs mb-2">
              <div>
                <div className="font-bold text-slate-800">{edu.degree || ''}</div>
                <div className="text-slate-600">{edu.college || ''} {edu.university ? `(${edu.university})` : ''}</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-medium text-slate-505">{edu.duration || ''}</div>
                <div className="font-semibold text-slate-700">{edu.grade || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-700 pb-0.5 mb-2">Certifications</h2>
          <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5">
            {certifications.map((cert, idx) => (
              <li key={idx}>
                <span className="font-semibold">{cert.name || ''}</span> {cert.issuer ? `- ${cert.issuer}` : ''} {cert.date ? `(${cert.date})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 2. Modern Template Component
function ModernTemplate({ data = {} }) {
  const personal = data.personal || {};
  const education = data.education || [];
  const skills = data.skills || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  return (
    <div className="font-sans text-slate-800 bg-white h-full flex overflow-y-auto no-scrollbar text-left">
      {/* Sidebar */}
      <div className="w-[35%] bg-slate-900 text-slate-100 p-5 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="mb-6">
            <h1 className="text-lg font-bold text-white tracking-wide leading-tight">{personal.name || ''}</h1>
            <p className="text-[10px] text-indigo-400 font-semibold mt-1 uppercase tracking-wider">{personal.title || ''}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-1 mb-2.5">Contact</h2>
            <div className="space-y-2 text-[10px] text-slate-355 font-mono">
              {personal.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={10} className="text-indigo-400 shrink-0" />
                  <span className="break-all">{personal.email}</span>
                </div>
              )}
              {personal.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={10} className="text-indigo-400 shrink-0" />
                  <span>{personal.phone}</span>
                </div>
              )}
              {personal.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className="text-indigo-400 shrink-0" />
                  <span>{personal.location}</span>
                </div>
              )}
              {personal.linkedin && (
                <div className="flex items-center gap-1.5">
                  <Linkedin size={10} className="text-indigo-400 shrink-0" />
                  <span className="break-all text-[9px]">{personal.linkedin}</span>
                </div>
              )}
              {personal.github && (
                <div className="flex items-center gap-1.5">
                  <Github size={10} className="text-indigo-400 shrink-0" />
                  <span className="break-all text-[9px]">{personal.github}</span>
                </div>
              )}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-1 mb-2.5">Skills</h2>
              <div className="space-y-2.5">
                {skills.map((skill, idx) => (
                  <div key={idx}>
                    <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">{skill.category || 'Skills'}</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(skill.items) && skill.items.map((item, i) => (
                        <span key={i} className="text-[9px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-200 font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[65%] p-5 flex flex-col justify-between">
        <div>
          {personal.summary && (
            <div className="mb-4">
              <h2 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-150 pb-0.5 mb-1.5">Profile Summary</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{personal.summary}</p>
            </div>
          )}

          {experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-150 pb-0.5 mb-2 flex items-center justify-between">Professional Experience</h2>
              {experience.map((exp, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{exp.role || ''}</span>
                    <span className="font-semibold text-indigo-650 text-[10px] font-mono">{exp.duration || ''}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mb-1">{exp.company || ''} {exp.location ? `| ${exp.location}` : ''}</div>
                  {Array.isArray(exp.description) && (
                    <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5">
                      {exp.description.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-155 pb-0.5 mb-2">Key Projects</h2>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{proj.name || ''}</span>
                    <span className="font-normal text-[9px] text-slate-400 font-mono">{proj.link || ''}</span>
                  </div>
                  <div className="text-[9px] text-indigo-650 font-semibold mb-1">Tech: {proj.tech || ''}</div>
                  {Array.isArray(proj.description) && (
                    <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5">
                      {proj.description.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-155 pb-0.5 mb-2">Education</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-2 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{edu.degree || ''}</span>
                    <span className="font-medium text-slate-500 font-mono">{edu.duration || ''}</span>
                  </div>
                  <div className="text-slate-600">{edu.college || ''} {edu.university ? `(${edu.university})` : ''}</div>
                  <div className="text-indigo-600 font-semibold text-[9px] mt-0.5 font-mono">{edu.grade || ''}</div>
                </div>
              ))}
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-150 pb-0.5 mb-2">Certifications</h2>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-1.5 rounded">
                    <div className="font-bold text-slate-800 leading-tight text-[10px]">{cert.name || ''}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{cert.issuer || ''} {cert.date ? `• ${cert.date}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Minimal Template Component
function MinimalTemplate({ data = {} }) {
  const personal = data.personal || {};
  const education = data.education || [];
  const skills = data.skills || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  return (
    <div className="font-mono text-black p-6 bg-white h-full overflow-y-auto no-scrollbar leading-normal text-left">
      <div className="border-b border-black pb-2 mb-4">
        <h1 className="text-lg font-bold uppercase">{personal.name || ''}</h1>
        <p className="text-xs uppercase font-semibold">{personal.title || ''}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] mt-2 text-neutral-600 font-mono">
          {personal.email && <span>EMAIL: {personal.email}</span>}
          {personal.phone && <span>PHONE: {personal.phone}</span>}
          {personal.location && <span>LOC: {personal.location}</span>}
          {personal.linkedin && <span>LI: {personal.linkedin}</span>}
          {personal.github && <span>GH: {personal.github}</span>}
        </div>
      </div>

      {personal.summary && (
        <div className="mb-4 text-[11px]">
          <div className="font-bold uppercase mb-1">// SUMMARY</div>
          <p className="text-neutral-700 leading-relaxed">{personal.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-4 text-[11px]">
          <div className="font-bold uppercase mb-1">// TECHNICAL SKILLS</div>
          <div className="space-y-0.5">
            {skills.map((skill, idx) => (
              <div key={idx}>
                <span className="font-bold">{skill.category || 'Skills'}:</span> {Array.isArray(skill.items) ? skill.items.join(', ') : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-4 text-[11px]">
          <div className="font-bold uppercase mb-2">// EXPERIENCE</div>
          {experience.map((exp, idx) => (
            <div key={idx} className="mb-2.5">
              <div className="flex justify-between font-bold">
                <span>{exp.role || ''} -- {exp.company || ''}</span>
                <span className="font-mono">{exp.duration || ''}</span>
              </div>
              <div className="text-[9px] text-neutral-500 uppercase mb-1">{exp.location || ''}</div>
              {Array.isArray(exp.description) && (
                <ul className="list-inside list-disc pl-1 space-y-0.5 text-neutral-700">
                  {exp.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-4 text-[11px]">
          <div className="font-bold uppercase mb-2">// PROJECTS</div>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-2.5">
              <div className="flex justify-between font-bold">
                <span>{proj.name || ''} [Tech: {proj.tech || ''}]</span>
                <span className="font-normal underline text-[9px] font-mono">{proj.link || ''}</span>
              </div>
              {Array.isArray(proj.description) && (
                <ul className="list-inside list-disc pl-1 space-y-0.5 mt-1 text-neutral-700">
                  {proj.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-4 text-[11px]">
          <div className="font-bold uppercase mb-2">// EDUCATION</div>
          {education.map((edu, idx) => (
            <div key={idx} className="mb-1.5">
              <div className="flex justify-between font-bold">
                <span>{edu.degree || ''} - {edu.college || ''}</span>
                <span className="font-mono">{edu.duration || ''}</span>
              </div>
              <div className="flex justify-between text-neutral-550 text-[9px] font-mono">
                <span>Univ: {edu.university || ''}</span>
                <span className="font-bold text-black">{edu.grade || ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div className="text-[11px]">
          <div className="font-bold uppercase mb-1">// CERTIFICATIONS</div>
          <ul className="list-disc pl-4 space-y-0.5 text-neutral-700">
            {certifications.map((cert, idx) => (
              <li key={idx} className="font-mono">
                {cert.name || ''} {cert.issuer ? `- ${cert.issuer}` : ''} {cert.date ? `(${cert.date})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 4. Technical Template Component
function TechnicalTemplate({ data = {} }) {
  const personal = data.personal || {};
  const education = data.education || [];
  const skills = data.skills || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  return (
    <div className="font-sans text-slate-800 p-6 bg-slate-50 h-full overflow-y-auto no-scrollbar text-left">
      <div className="bg-slate-900 text-white rounded-lg p-4 mb-4 border border-slate-800">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">{personal.name || ''}</h1>
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5">&gt;_ {personal.title || ''}</p>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-300 font-mono">
            {personal.email && (
              <div className="flex items-center gap-1">
                <Mail size={9} className="text-emerald-400" />
                <span>{personal.email}</span>
              </div>
            )}
            {personal.phone && (
              <div className="flex items-center gap-1">
                <Phone size={9} className="text-emerald-400" />
                <span>{personal.phone}</span>
              </div>
            )}
            {personal.location && (
              <div className="flex items-center gap-1">
                <MapPin size={9} className="text-emerald-400" />
                <span>{personal.location}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4 text-[10px] font-mono mt-2.5 pt-2.5 border-t border-slate-800 text-slate-400">
          {personal.linkedin && <span className="underline">{personal.linkedin}</span>}
          {personal.github && <span className="underline">{personal.github}</span>}
        </div>
      </div>

      {personal.summary && (
        <div className="bg-white rounded-lg p-3.5 mb-3.5 border border-slate-200">
          <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <span className="text-emerald-600">[01]</span> SUMMARY
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">{personal.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="bg-white rounded-lg p-3.5 mb-3.5 border border-slate-200">
          <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1">
            <span className="text-emerald-600">[02]</span> TECH STACK & SKILLS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {skills.map((skill, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-[9px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">{skill.category || 'Skills'}</div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(skill.items) && skill.items.map((item, i) => (
                    <span key={i} className="text-[9px] font-mono bg-white border border-slate-300 text-emerald-700 px-1.5 py-0.5 rounded shadow-xs font-semibold">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div className="bg-white rounded-lg p-3.5 mb-3.5 border border-slate-200">
          <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <span className="text-emerald-600">[03]</span> WORK EXPERIENCE
          </h2>
          {experience.map((exp, idx) => (
            <div key={idx} className="border-l border-emerald-500 pl-3 mb-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>{exp.role || ''} <span className="font-normal text-slate-500">at</span> {exp.company || ''}</span>
                <span className="text-[9px] font-mono bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded">{exp.duration || ''}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5 mb-1">{exp.location || ''}</p>
              {Array.isArray(exp.description) && (
                <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5">
                  {exp.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="bg-white rounded-lg p-3.5 mb-3.5 border border-slate-200">
          <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <span className="text-emerald-600">[04]</span> REPOS & PROJECTS
          </h2>
          {projects.map((proj, idx) => (
            <div key={idx} className="border-l border-emerald-500 pl-3 mb-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>{proj.name || ''}</span>
                <span className="text-[9px] font-mono text-emerald-650 underline">{proj.link || ''}</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-0.5">Stack: {proj.tech || ''}</div>
              {Array.isArray(proj.description) && (
                <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5 mt-1">
                  {proj.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {education.length > 0 && (
          <div className="bg-white rounded-lg p-3.5 border border-slate-200">
            <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="text-emerald-600">[05]</span> EDUCATION
            </h2>
            {education.map((edu, idx) => (
              <div key={idx} className="mb-2 text-[10px] last:mb-0">
                <div className="font-bold text-slate-800">{edu.degree || ''}</div>
                <div className="text-slate-605 leading-snug">{edu.college || ''}</div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
                  <span>{edu.duration || ''}</span>
                  <span className="font-bold text-emerald-600">{edu.grade || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {certifications.length > 0 && (
          <div className="bg-white rounded-lg p-3.5 border border-slate-200">
            <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="text-emerald-600">[06]</span> CERTIFICATIONS
            </h2>
            <div className="space-y-1.5 text-[10px]">
              {certifications.map((cert, idx) => (
                <div key={idx} className="pb-1.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="font-bold text-slate-800 leading-tight">{cert.name || ''}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{cert.issuer || ''} {cert.date ? `• ${cert.date}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 5. Deedy CV (DDCV) Template Component
function DeedyCVTemplate({ data = {} }) {
  const personal = data.personal || {};
  const education = data.education || [];
  const skills = data.skills || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  // Parse name into first and last parts for Deedy style header (e.g. "Abinesh S")
  const fullName = personal.name || '';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="font-sans text-slate-800 p-8 bg-white h-full overflow-y-auto no-scrollbar flex flex-col justify-between leading-normal text-left">
      {/* Header Namesection */}
      <div className="text-center border-b border-slate-200 pb-4">
        <h1 className="text-3xl tracking-tight text-slate-900 uppercase">
          <span className="font-bold text-indigo-600">{firstName}</span>{' '}
          <span className="font-light text-slate-500">{lastName}</span>
        </h1>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 font-mono mt-1.5">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>| {personal.phone}</span>}
          {personal.location && <span>| {personal.location}</span>}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex gap-6 mt-4 flex-1">
        
        {/* Left Column (Sidebar - 33%) */}
        <div className="w-[33%] border-r border-slate-100 pr-4 space-y-5 text-left">
          
          {/* Education */}
          {education.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Education</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3 last:mb-0 text-[10px]">
                  <div className="font-bold text-slate-800 leading-tight">{edu.college || ''}</div>
                  <div className="text-slate-600 mt-0.5">{edu.degree || ''}</div>
                  <div className="text-slate-505 italic mt-0.5 font-mono">{edu.duration || ''}</div>
                  <div className="text-indigo-600 font-semibold font-mono mt-0.5">{edu.grade || ''}</div>
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {(personal.linkedin || personal.github) && (
            <div>
              <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Links</h2>
              <div className="space-y-1 text-[10px] font-mono text-slate-600">
                {personal.github && (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-400">Github:</span>
                    <span className="underline truncate">{personal.github}</span>
                  </div>
                )}
                {personal.linkedin && (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-400">LinkedIn:</span>
                    <span className="underline truncate">{personal.linkedin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coursework */}
          <div>
            <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Coursework</h2>
            <div className="grid grid-cols-1 gap-1 text-[9px] font-medium text-slate-600 leading-tight">
              <span>• Data Structures & Algorithms</span>
              <span>• Database Management Systems</span>
              <span>• Operating Systems</span>
              <span>• Computer Networks</span>
              <span>• Object Oriented Programming</span>
              <span>• Web Technology</span>
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Skills</h2>
              <div className="space-y-2.5">
                {skills.map((skill, idx) => (
                  <div key={idx} className="text-[10px]">
                    <div className="font-bold text-slate-700 uppercase tracking-wider mb-0.5">{skill.category || 'Skills'}</div>
                    <div className="text-slate-600 leading-normal">
                      {Array.isArray(skill.items) ? skill.items.join(', ') : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Main - 67%) */}
        <div className="w-[67%] space-y-5 text-left">
          
          {/* Summary / Objective */}
          {personal.summary && (
            <div>
              <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-800 pb-0.5 mb-2">Summary</h2>
              <p className="text-[10px] text-slate-600 leading-relaxed">{personal.summary}</p>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-slate-805 uppercase tracking-wider border-b-2 border-slate-800 pb-0.5 mb-2">Experience</h2>
              {experience.map((exp, idx) => (
                <div key={idx} className="mb-3.5 last:mb-0">
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-slate-800">
                    <span>{exp.role || ''}</span>
                    <span className="font-normal text-[9px] text-slate-500 font-mono">{exp.duration || ''}</span>
                  </div>
                  <div className="text-[9px] text-indigo-600 font-semibold mb-1">
                    {exp.company || ''} | <span className="font-normal text-slate-400 italic">{exp.location || ''}</span>
                  </div>
                  {Array.isArray(exp.description) && (
                    <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-1 mt-1">
                      {exp.description.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-slate-805 uppercase tracking-wider border-b-2 border-slate-800 pb-0.5 mb-2">Projects</h2>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-3.5 last:mb-0">
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-slate-800">
                    <span>{proj.name || ''}</span>
                    <span className="font-normal text-[9px] text-indigo-600 font-mono underline">{proj.link || ''}</span>
                  </div>
                  <div className="text-[9px] text-slate-505 font-medium mb-1">Tech Stack: {proj.tech || ''}</div>
                  {Array.isArray(proj.description) && (
                    <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-1">
                      {proj.description.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-slate-805 uppercase tracking-wider border-b-2 border-slate-800 pb-0.5 mb-2">Certifications</h2>
              <div className="space-y-2 text-[10px] text-slate-600">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-slate-700">{cert.name || ''}</span> - {cert.issuer || ''}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-2">{cert.date || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Main Selector Component
function TemplatePreviewRenderer({ templateId, data }) {
  switch (templateId) {
    case 1:
      return <ProfessionalTemplate data={data} />;
    case 2:
      return <ModernTemplate data={data} />;
    case 3:
      return <MinimalTemplate data={data} />;
    case 4:
      return <TechnicalTemplate data={data} />;
    case 5:
      return <DeedyCVTemplate data={data} />;
    default:
      return <ProfessionalTemplate data={data} />;
  }
}

export default function ResumeBuilder() {
  const { isLight } = useTheme();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [zoom, setZoom] = useState(0.85);

  const getInitialDept = () => {
    const dept = user?.department;
    if (!dept) return "Computer Science & IT";
    if (dept.includes("Computer") || dept.includes("Artificial") || dept.includes("Information")) {
      return "Computer Science & IT";
    }
    if (dept.includes("Electronics") || dept.includes("Communication")) {
      return "Electronics & Communication (ECE)";
    }
    if (dept.includes("Electrical")) {
      return "Electrical & Electronics (EEE)";
    }
    if (dept.includes("Mechanical")) {
      return "Mechanical Engineering (MECH)";
    }
    if (dept.includes("Civil")) {
      return "Civil Engineering (CIVIL)";
    }
    return "Computer Science & IT";
  };

  const [activeDeptKeywords, setActiveDeptKeywords] = useState(getInitialDept);

  const categories = ["All", "Professional", "Modern", "Minimal", "Technical"];

  const filteredTemplates = selectedCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.5));
  const handleZoomReset = () => setZoom(0.85);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <MetaData title="Resume Templates" />

      {/* Header Info */}
      <div className={`p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border border-gray-200 shadow-xs' : 'bg-glass-panel border border-glass-border shadow-md'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FileText size={20} />
            </div>
            <h1 className={`text-xl font-bold font-display ${isLight ? 'text-gray-900' : 'text-white'}`}>Resume Templates</h1>
          </div>
          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-ink-400'}`}>
            Explore professional resume templates suitable for different career paths and placement applications.
          </p>
        </div>
      </div>

      {/* Categories / Filters */}
      <div className={`flex flex-wrap gap-2 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-glass-border'}`}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : isLight
                  ? 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  : 'bg-glass-panel border border-glass-border text-ink-300 hover:bg-glass-panel-hover hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`group rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between ${
              isLight ? 'bg-white border border-gray-200 shadow-xs' : 'bg-glass-panel border border-glass-border'
            }`}
          >
            {/* Template Card Preview Frame */}
            <div className={`w-full h-72 border-b overflow-hidden relative bg-white select-none ${
              isLight ? 'border-gray-200' : 'border-glass-border'
            }`}>
              {/* Scaled-down rendering of the A4 layout (scaled 0.35 to fit card) */}
              <div 
                className="absolute origin-top-left pointer-events-none" 
                style={{ 
                  transform: 'scale(0.35)', 
                  width: '285.7%', 
                  height: '285.7%',
                  top: '0',
                  left: '0'
                }}
              >
                <TemplatePreviewRenderer templateId={template.id} data={RESUME_DEMO_DATA} />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-all duration-300"></div>
            </div>

            {/* Info details */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className={`font-display font-semibold text-sm group-hover:text-indigo-400 transition-colors duration-150 ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>
                    {template.name}
                  </h3>
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase">
                    {template.category}
                  </span>
                </div>
                <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isLight ? 'text-gray-550' : 'text-slate-400'}`}>
                  {template.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTemplate(template);
                  setZoom(0.85); // Reset zoom on open
                }}
                className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  isLight 
                    ? 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white' 
                    : 'bg-glass-panel border border-glass-border text-white hover:bg-indigo-600 hover:border-indigo-600'
                }`}
              >
                <Eye size={14} />
                View Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Recommended ATS Keywords Section */}
      <div className={`p-6 rounded-2xl space-y-4 ${
        isLight ? 'bg-white border border-gray-200 shadow-xs' : 'bg-glass-panel border border-glass-border shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles size={18} />
              <h2 className={`font-display font-semibold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Recommended ATS Keywords by Department
              </h2>
            </div>
            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              Integrate these core technical concepts, programming languages, and industry tools to optimize your resume parsing score.
            </p>
          </div>

          {/* Department Tab Controls */}
          <div className={`flex flex-wrap gap-1.5 p-1 rounded-lg border ${
            isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/20 border-glass-border'
          }`}>
            {Object.keys(DEPARTMENT_KEYWORDS).map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDeptKeywords(dept)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  activeDeptKeywords === dept
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLight
                      ? 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      : 'text-ink-400 hover:bg-glass-panel-hover hover:text-white'
                }`}
              >
                {dept.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { title: "Languages & Scripts", key: "languages", iconColor: "text-indigo-400" },
            { title: "Frameworks & Tech", key: "frameworks", iconColor: "text-sky-400" },
            { title: "Core Design Concepts", key: "concepts", iconColor: "text-emerald-400" },
            { title: "Tools & Environments", key: "tools", iconColor: "text-amber-400" }
          ].map((cat) => (
            <div key={cat.key} className={`p-4 rounded-xl space-y-2 border ${
              isLight ? 'bg-gray-50 border-gray-150' : 'bg-slate-950/30 border-glass-border'
            }`}>
              <h3 className={`text-xs font-bold ${isLight ? 'text-gray-800' : 'text-slate-350'}`}>
                {cat.title}
              </h3>
              <p className={`text-[10px] font-mono leading-relaxed leading-5 ${
                isLight ? 'text-gray-700 font-medium' : 'text-indigo-200'
              }`}>
                {DEPARTMENT_KEYWORDS[activeDeptKeywords][cat.key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ATS Anti-Patterns Checklist Section */}
      <div className={`p-6 rounded-2xl space-y-4 ${
        isLight ? 'bg-white border border-gray-200 shadow-xs' : 'bg-glass-panel border border-glass-border shadow-md'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />
            <h2 className={`font-display font-semibold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
              ATS Anti-Patterns: Avoid
            </h2>
          </div>
          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Many automated tracking platforms fail to read visual indicators. Avoid these formatting traps to pass initial scans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {[
            {
              title: "No Skill Gauges",
              desc: "Progress bars, circles, stars, and scale indicators cannot be read by text scanners."
            },
            {
              title: "No Photo Uploads",
              desc: "Unless explicitly requested, images and photos confuse text flow coordinates."
            },
            {
              title: "No Nested Tables",
              desc: "Parsing paths read cells sequentially, causing text fragments to scramble."
            },
            {
              title: "Standard Fonts Only",
              desc: "Stick to Arial, Calibri, or Times New Roman. Fancy custom fonts cause layout decoding failures."
            },
            {
              title: "Use Active Verbs",
              desc: "Avoid blocky paragraphs. Use short, high-impact bullet list tags starting with action terms."
            }
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl space-y-2 border ${
              isLight ? 'bg-gray-50 border-gray-150' : 'bg-slate-950/30 border-glass-border'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="text-red-400 text-xs">❌</span>
                <h4 className={`text-xs font-bold ${isLight ? 'text-gray-800' : 'text-slate-200'}`}>
                  {item.title}
                </h4>
              </div>
              <p className={`text-[10px] leading-relaxed ${isLight ? 'text-gray-650' : 'text-slate-400'}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ATS Score Checker Tools Section */}
      <div className={`p-6 rounded-2xl space-y-4 ${
        isLight ? 'bg-white border border-gray-200 shadow-xs' : 'bg-glass-panel border border-glass-border shadow-md'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <Globe size={18} />
            <h2 className={`font-display font-semibold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
              ATS Score Verification Checkers
            </h2>
          </div>
          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Upload your drafted resume to these free platforms to test parser readability and check keyword match rates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { name: "Resume Worded", desc: "Checks structural layout and general parser readability.", url: "https://resumeworded.com" },
            { name: "Jobscan", desc: "Compares and matches your resume keywords against specific job descriptions.", url: "https://www.jobscan.co" },
            { name: "Rezi AI Resume Checker", desc: "Scans for formatting issues, bullet points density, and gives a graded score.", url: "https://www.rezi.ai" },
            { name: "Novoresume Scanner", desc: "Analyzes design layout alignment, font sizes, and structural compliance.", url: "https://novoresume.com" }
          ].map((site, index) => (
            <a
              key={index}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block border p-4 rounded-xl transition-all duration-150 group ${
                isLight 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-emerald-500/30 shadow-xs' 
                  : 'bg-slate-950/30 border-glass-border hover:bg-slate-950/60 hover:border-emerald-500/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-bold transition-colors ${
                  isLight ? 'text-gray-900 group-hover:text-emerald-600' : 'text-white group-hover:text-emerald-400'
                }`}>
                  {site.name}
                </span>
                <ExternalLink size={12} className={`transition-colors ${
                  isLight ? 'text-gray-400 group-hover:text-emerald-650' : 'text-slate-400 group-hover:text-emerald-400'
                } shrink-0`} />
              </div>
              <p className={`text-[10px] mt-1 leading-relaxed ${isLight ? 'text-gray-550' : 'text-slate-400'}`}>
                {site.desc}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-glass-panel border border-glass-border max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-glass-border flex justify-between items-center bg-slate-900/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-wide">{(activeTemplate?.name) || ''} Resume</h2>
                  <span className="text-[9px] bg-indigo-500/25 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/40">
                    READ-ONLY PREVIEW
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{(activeTemplate?.tagline) || ''}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-slate-950/40 border border-glass-border rounded-lg p-1">
                  <button 
                    onClick={handleZoomOut} 
                    title="Zoom Out"
                    className="p-1 hover:bg-glass-panel rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono w-10 text-center select-none">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={handleZoomIn} 
                    title="Zoom In"
                    className="p-1 hover:bg-glass-panel rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button 
                    onClick={handleZoomReset} 
                    title="Reset Zoom"
                    className="p-1 hover:bg-glass-panel rounded text-slate-400 hover:text-white transition-colors border-l border-glass-border pl-1.5"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveTemplate(null)}
                  className="p-1.5 bg-slate-950/40 hover:bg-red-500/20 border border-glass-border hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-150"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body / Preview Canvas */}
            <div className="flex-1 overflow-auto bg-slate-950/50 p-6 flex justify-center items-start">
              {/* Interactive page wrapper scaled by the zoom level */}
              <div 
                className="bg-white text-black shadow-2xl transition-transform duration-100 ease-out border border-slate-200"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  marginBottom: `${(zoom - 1) * 1123}px` // Adjust scroll container size dynamically for zoom out margins
                }}
              >
                <TemplatePreviewRenderer templateId={activeTemplate.id} data={RESUME_DEMO_DATA} />
              </div>
            </div>

            {/* Modal Info Footer */}
            <div className="p-3 border-t border-glass-border bg-slate-950/40 flex items-center gap-2 justify-center text-[11px] text-indigo-400 font-medium">
              <Info size={12} />
              <span>This page displays static previews of standard placement templates. Edit options are disabled.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
