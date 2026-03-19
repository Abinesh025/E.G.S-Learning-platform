import React from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Link } from 'react-router-dom'
import landImage from '../assets/land1.png'
import gg from "../assets/gg2.jpg"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink-950 transition-colors duration-300">
      <Navbar />

      {/* Full-screen hero image */}
     



    <div className="font-sans text-gray-800">
      {/* HERO SECTION */}
      <section
        className="h-screen bg-cover bg-center flex items-center justify-center text-white relative"
        style={{ backgroundImage: `url(${landImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 p-10 rounded-2xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">E.G.S. Pillay Academic Hub</h1>
          <p className="mb-6 font-bold text-lg">Excellence in Education</p>
          <div className="flex gap-4 justify-center">
           <Link to="/register" > <button className="px-6 py-3 bg-rose-600 font-semibold rounded-xl">Get Started</button></Link>
           <Link to="/login" ><button className="px-6 py-3 btn-primary font-semibold ext-black rounded-xl">Login</button></Link> 
          </div>
        </div>
      </section> 
    </div>
  <Footer />
    </div>
  )
}
