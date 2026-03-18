import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, Award, PlayCircle, Zap, ShieldCheck } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink-950 transition-colors duration-300">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-lime-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl text-center space-y-8 z-10 my-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-900 border border-ink-800 text-lime-300 text-sm font-display font-500 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-lime-300 animate-pulse" />
            Welcome to the Future of Learning
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-800 text-ink-50 leading-tight tracking-tight animate-fade-up animate-delay-100">
            Empower Your Journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">EduPortal</span>
          </h1>
          
          <p className="text-lg md:text-xl text-ink-400 max-w-2xl mx-auto leading-relaxed animate-fade-up animate-delay-200">
            A comprehensive self-learning ecosystem designed for students and staff. Discover materials, take smart assessments, and track your progress in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-up animate-delay-300">
            <Link to="/register" className="btn-primary w-full sm:w-auto text-lg px-8 py-3.5 shadow-lg shadow-lime-300/20">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-outline w-full sm:w-auto text-lg px-8 py-3.5 bg-ink-900/50 hover:bg-ink-800 backdrop-blur-sm">
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full my-16 z-10 animate-fade-up animate-delay-300">
          {[
            { icon: BookOpen, title: "Rich Learning Materials", desc: "Access notes, presentations, and resources instantly." },
            { icon: Zap, title: "Smart Assessments", desc: "Test your knowledge with dynamic online exams." },
            { icon: ShieldCheck, title: "Real-time Tracking", desc: "Monitor your academic progress through detailed dashboards." },
          ].map((feature, i) => (
            <div key={i} className="card p-6 border border-ink-800 bg-ink-900/50 backdrop-blur-sm hover:border-lime-300/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-ink-800 flex items-center justify-center mb-4 text-lime-300">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-display font-600 text-ink-100 mb-2">{feature.title}</h3>
              <p className="text-ink-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
