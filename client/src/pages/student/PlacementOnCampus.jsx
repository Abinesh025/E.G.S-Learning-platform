import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, BookOpen, Code, FileText, CheckCircle, BrainCircuit, UserCheck, Terminal, HardDrive, ExternalLink, ChevronRight, Code2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { quantitativeTopics } from '../../utils/quantsData'
import {logicalReasoningTopics} from "../../utils/logicalData"
export default function PlacementOnCampus() {
  const { user } = useAuth()


  
  const isCse = user?.department === 'Computer Science and Engineering'
  const isEce = user?.department === 'Electronics and Communication Engineering'

  return (
    <div className="p-6 max-w-none w-full space-y-6 animate-fade-up">
      <Link to="/student/placement/on-campus" className="inline-flex items-center gap-2 text-ink-400 hover:text-lime-300 transition-colors mb-2 text-sm font-500">
        <ArrowLeft size={16} /> Back to On-Campus Rounds
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-800 pb-4">
        <div>
          <h1 className="page-title text-2xl md:text-3xl">On-Campus Placement Preparation</h1>
          <p className="text-ink-400 mt-1">Syllabus, topics, and guide tailored for your department</p>
        </div>
        <div className="shrink-0">
          <span className="tag-lime badge text-sm font-600 px-3 py-1.5 capitalize">{user?.department}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Preparation Material */}
        <div className="lg:col-span-2 space-y-6 ">
          
          {/* Section 1: Aptitude & Logical Reasoning */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center  gap-3 ">
              <div className=" w-10 h-10 bg-lime-400/10 rounded-xl flex items-center justify-center text-lime-400">
                <BrainCircuit size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">1. Quantitative Aptitude & Reasoning</h2>
            </div>
            <p className="text-sm text-ink-400">Essential non-technical topics frequently tested in first-round elimination rounds.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full w-full bg-ink-800/40 p-6 rounded-xl border border-ink-800">
              <h3 className="text-sm font-semibold text-lime-300 mb-4">
            Quantitative Aptitude
            </h3>

            <div className="space-y-4">
              {quantitativeTopics.map((item, index) => (
                <div key={index} className="border-b border-ink-700 pb-3 last:border-none">
                  <h4 className="text-sm font-semibold text-white">
                    {item.title}
                  </h4>

                  <p className="text-xs text-ink-300 mt-1">
                    <span className="font-medium text-lime-300">Topics:</span>{" "}
                    {item.topics.join(", ")}
                  </p>

                  <div className="mt-2">
                    <p className="text-xs font-medium text-cyan-300 mb-1">
                      Important Formulas
                    </p>

                    <ul className="list-disc pl-5 text-xs text-ink-300 space-y-1">
                      {item.formulas.map((formula, formulaIndex) => (
                        <li key={formulaIndex}>{formula}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
                            <div className="col-span-full w-full bg-ink-800/40 p-6 rounded-xl border border-ink-800">
              <h3 className="text-sm font-semibold text-lime-300 mb-4">
            Logical Reasoning
            </h3>

            <div className="space-y-4">
              {logicalReasoningTopics.map((item, index) => (
                <div key={index} className="border-b border-ink-700 pb-3 last:border-none">
                  <h4 className="text-sm font-semibold text-white">
                    {item.title}
                  </h4>

                  <p className="text-xs text-ink-300 mt-1">
                    <span className="font-medium text-lime-300">Topics:</span>{" "}
                    {item.topics.join(", ")}
                  </p>

                  <div className="mt-2">
                    <p className="text-xs font-medium text-cyan-300 mb-1">
                      Important Formulas
                    </p>

                    <ul className="list-disc pl-5 text-xs text-ink-300 space-y-1">
                      {item.formulas.map((formula, formulaIndex) => (
                        <li key={formulaIndex}>{formula}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
            </div>
          </div>

          {/* Section 2: Technical Interview Preparations (Department Specific) */}
          {isCse && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <Terminal size={20} />
                </div>
                <h2 className="text-lg font-bold text-ink-50">2. Technical & Coding Preparation</h2>
              </div>
              <p className="text-sm text-ink-400">Core Computer Science technical concepts and programming round strategies.</p>
              
              <div className="space-y-3">
                {/* Featured DSA Array Module Card */}
                <div className="bg-gradient-to-r from-lime-400/10 via-ink-900 to-ink-950 p-4 rounded-xl border border-lime-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="tag-lime text-[10px] uppercase font-bold px-2 py-0.5">Placement Ready</span>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Code2 size={16} className="text-lime-400" />
                        DSA Array Module & Coding Bank
                      </h4>
                    </div>
                    <p className="text-xs text-ink-300">
                      Theory, memory address formulas, 12 DSA patterns, and 40 curated Easy/Medium/Hard coding questions.
                    </p>
                  </div>
                  <Link
                    to="/student/placement/coding-rounds"
                    className="btn-primary text-xs py-2 px-3.5 shrink-0 inline-flex items-center gap-1.5 justify-center"
                  >
                    <span>Open Module</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="bg-ink-800/40 p-4 rounded-xl border border-ink-800">
                  <h3 className="text-sm font-semibold text-indigo-300 mb-2">Programming & Data Structures</h3>
                  <p className="text-xs text-ink-300 mb-3">Focus on languages like C++, Java, or Python. Study these core structures:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                    <Link
                      to="/student/placement/coding-rounds"
                      className="bg-lime-400/10 hover:bg-lime-400/20 p-2 rounded border border-lime-400/30 text-lime-300 font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Arrays (40 Qs)</span>
                      <ExternalLink size={11} />
                    </Link>
                    <div className="bg-ink-950 p-2 rounded border border-ink-800 text-ink-300">Linked Lists</div>
                    <div className="bg-ink-950 p-2 rounded border border-ink-800 text-ink-300">Stacks & Queues</div>
                    <div className="bg-ink-950 p-2 rounded border border-ink-800 text-ink-300">Trees & Graphs</div>
                  </div>
                </div>

                <div className="bg-ink-800/40 p-4 rounded-xl border border-ink-800">
                  <h3 className="text-sm font-semibold text-indigo-300 mb-2">CS Core Concepts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-ink-300">
                    <div className="bg-ink-950 p-3 rounded border border-ink-800 space-y-1">
                      <span className="font-600 text-lime-300">DBMS</span>
                      <p className="text-[11px] text-ink-400">SQL Queries, Joins, Normalization (1NF to BCNF), ACID Properties, Transactions.</p>
                    </div>
                    <div className="bg-ink-950 p-3 rounded border border-ink-800 space-y-1">
                      <span className="font-600 text-sky-300">Operating Systems</span>
                      <p className="text-[11px] text-ink-400">Process Scheduling, Deadlocks, Semaphores, Paging & Segmentation, Virtual Memory.</p>
                    </div>
                    <div className="bg-ink-950 p-3 rounded border border-ink-800 space-y-1">
                      <span className="font-600 text-amber-300">Computer Networks</span>
                      <p className="text-[11px] text-ink-400">OSI & TCP/IP Layers, IP Addressing, DNS, HTTP/HTTPS, TCP vs UDP handshakes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEce && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <HardDrive size={20} />
                </div>
                <h2 className="text-lg font-bold text-ink-50">2. ECE Core Technical Preparation</h2>
              </div>
              <p className="text-sm text-ink-400">Core Electronics concepts, hardware programming, and circuit analysis for hardware/embedded roles.</p>
              
              <div className="space-y-3">
                <div className="bg-ink-800/40 p-4 rounded-xl border border-ink-800">
                  <h3 className="text-sm font-semibold text-indigo-300 mb-2">Digital Logic & Microcontrollers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-ink-300">
                    <div className="bg-ink-950 p-3 rounded border border-ink-800">
                      <strong className="text-lime-300 block mb-1">Digital Design</strong>
                      Combinational circuits (Multiplexers, Decoders), Sequential circuits (Flip-Flops, Counters, Latches), Finite State Machines (FSMs).
                    </div>
                    <div className="bg-ink-950 p-3 rounded border border-ink-800">
                      <strong className="text-sky-300 block mb-1">Microprocessors & Microcontrollers</strong>
                      8085/8086 Instruction sets, 8051 Microcontroller Architecture, Interrupt handling, Timers, and Memory mapping.
                    </div>
                  </div>
                </div>

                <div className="bg-ink-800/40 p-4 rounded-xl border border-ink-800">
                  <h3 className="text-sm font-semibold text-indigo-300 mb-2">Embedded Systems & Hardware Programming</h3>
                  <ul className="text-xs text-ink-300 space-y-1.5 list-disc pl-4">
                    <li><strong>Embedded C:</strong> Bitwise operators, pointers in hardware registers, volatile and const declarations, memory layouts.</li>
                    <li><strong>Communication Protocols:</strong> UART, SPI, I2C, CAN Bus (speeds, wiring, and synchronization).</li>
                    <li><strong>VLSI Design:</strong> MOS transistor equations, CMOS inverter, Setup & Hold times, static and dynamic power dissipation.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Aptitude Platforms */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-400/10 rounded-xl flex items-center justify-center text-lime-400">
                <BookOpen size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink-50">Aptitude Platforms</h2>
            </div>
            <p className="text-xs text-ink-400">Top online platforms to practice and prepare for aptitude tests.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-800 text-ink-400">
                    <th className="py-2.5 font-semibold">Platform</th>
                    <th className="py-2.5 font-semibold text-right">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/50">
                  <tr className="hover:bg-ink-800/30 transition-colors">
                    <td className="py-3 font-medium text-ink-100">IndiaBIX</td>
                    <td className="py-3 text-right">
                      <a 
                        href="https://www.indiabix.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-lime-300 hover:text-lime-400 hover:underline transition-all"
                      >
                        Visit IndiaBIX <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr className="hover:bg-ink-800/30 transition-colors">
                    <td className="py-3 font-medium text-ink-100">PrepInsta</td>
                    <td className="py-3 text-right">
                      <a 
                        href="https://prepinsta.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-lime-300 hover:text-lime-400 hover:underline transition-all"
                      >
                        Visit PrepInsta <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr className="hover:bg-ink-800/30 transition-colors">
                    <td className="py-3 font-medium text-ink-100">GeeksforGeeks Aptitude</td>
                    <td className="py-3 text-right">
                      <a 
                        href="https://www.geeksforgeeks.org/aptitude-questions-and-answers/" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-lime-300 hover:text-lime-400 hover:underline transition-all"
                      >
                        Visit GeeksforGeeks Aptitude <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr className="hover:bg-ink-800/30 transition-colors">
                    <td className="py-3 font-medium text-ink-100">Testbook</td>
                    <td className="py-3 text-right">
                      <a 
                        href="https://testbook.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-lime-300 hover:text-lime-400 hover:underline transition-all"
                      >
                        Visit Testbook <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr className="hover:bg-ink-800/30 transition-colors">
                    <td className="py-3 font-medium text-ink-100">Practice Aptitude Tests</td>
                    <td className="py-3 text-right">
                      <a 
                        href="https://www.practiceaptitudetests.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-lime-300 hover:text-lime-400 hover:underline transition-all"
                      >
                        Visit Practice Aptitude Tests <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
