import React from 'react'
import { Link } from 'react-router-dom'
import { 
  UserPlus, 
  FileSearch, 
  Brain, 
  Users, 
  Code, 
  Briefcase, 
  MessageCircle, 
  ChevronRight,
  Code2
} from 'lucide-react'

export default function Rounds() {
  const placementRounds = [
    {
      title: 'Registration',
      description: 'Get registered for the on-campus recruitment drive.',
      route: '/student/placement/registration',
      icon: UserPlus,
      colorClass: 'text-lime-300 bg-lime-300/10 border-lime-300/20'
    },
    {
      title: 'Resume Screening',
      description: 'Craft a tailored resume and pass initial scanning.',
      route: '/student/resume',
      icon: FileSearch,
      colorClass: 'text-sky-300 bg-sky-300/10 border-sky-300/20'
    },
    {
      title: 'Online Aptitude Test',
      description: 'Solve quantitative, logical reasoning, and verbal assessments.',
      route: '/student/placement/aptitude-test',
      icon: Brain,
      colorClass: 'text-purple-300 bg-purple-300/10 border-purple-300/20'
    },
    {
      title: 'Group Discussion',
      description: 'Express ideas confidently and collaborate in structured discussions.',
      route: '/student/placement/group-discussion',
      icon: Users,
      colorClass: 'text-amber-300 bg-amber-300/10 border-amber-300/20'
    },
{
  title: 'Coding Rounds',
  description: 'Solve coding problems to demonstrate your programming and problem-solving skills.',
  route: '/student/placement/coding-rounds',
  icon: Code2,
  colorClass: 'text-amber-300 bg-amber-300/10 border-amber-300/20'
},
    {
      title: 'Technical Interview',
      description: 'Solve coding challenges and explain core CSE/ECE concepts.',
      route: '/student/placement/technical-interview',
      icon: Code,
      colorClass: 'text-indigo-300 bg-indigo-300/10 border-indigo-300/20'
    },
    {
      title: 'Managerial Interview',
      description: 'Discuss real-world scenarios, case studies, and team coordination.',
      route: '/student/placement/managerial-interview',
      icon: Briefcase,
      colorClass: 'text-rose-400 bg-rose-400/10 border-rose-400/20'
    },
    {
      title: 'HR Interview',
      description: 'Showcase personality, cultural fit, strengths, and goals.',
      route: '/student/placement/hr-interview',
      icon: MessageCircle,
      colorClass: 'text-teal-300 bg-teal-300/10 border-teal-300/20'
    }
  ]

  return (
    <div className="p-6 max-w-none w-full space-y-6 animate-fade-up">
      {/* Breadcrumb */}
      <nav className="text-xs font-500 text-ink-400 flex items-center gap-2 mb-2">
        <Link to="/student" className="hover:text-lime-300 transition-colors">Dashboard</Link>
        <span className="text-ink-600">/</span>
        <span className="text-ink-500">Placement Preparation</span>
        <span className="text-ink-600">/</span>
        <span className="text-ink-200">Placement Rounds</span>
      </nav>

      {/* Page Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-800 pb-4">
        <div>
          <h1 className="page-title text-2xl md:text-3xl">On-Campus Placement Rounds</h1>
          <p className="text-ink-400 mt-1 max-w-2xl text-sm">
            Select a placement round to learn about its process, preparation strategy, common questions, and tips.
          </p>
        </div>
      </div>

      {/* Grid of Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placementRounds.map((round, index) => {
          const IconComponent = round.icon
          return (
            <Link
              key={index}
              to={round.route}
              className="group card p-6 flex flex-col justify-between hover:scale-[1.02] hover:border-lime-300/50 hover:shadow-lg hover:shadow-lime-300/5 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden"
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-lime-300/0 via-lime-300/0 to-lime-300/0 group-hover:to-lime-300/[0.02] transition-colors duration-300" />
              
              <div className="space-y-4 relative z-10">
                {/* Round Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${round.colorClass}`}>
                  <IconComponent size={22} />
                </div>
                
                {/* Title & Description */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-ink-50 group-hover:text-lime-300 transition-colors">
                    {round.title}
                  </h3>
                  <p className="text-xs text-ink-400 line-clamp-2 leading-relaxed">
                    {round.description}
                  </p>
                </div>
              </div>

              {/* View Details Button */}
              <div className="pt-6 flex items-center text-xs font-600 text-lime-300 group-hover:text-lime-200 transition-colors mt-auto relative z-10">
                <span>View Details</span>
                <ChevronRight size={14} className="ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
