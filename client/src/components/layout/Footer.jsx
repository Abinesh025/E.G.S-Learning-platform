import React from "react";
import egs from '../../assets/egs.png';
import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
  const { isLight } = useTheme();

  return (
    <footer className="px-6 md:px-16 lg:px-24 xl:px-32 pt-8 w-full bg-ink-950 border-t border-ink-800 text-ink-300 transition-colors duration-300">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16 border-b border-ink-800 pb-10">

        {/* College Info */}
        <div className="md:col-span-2 lg:col-span-5 text-center md:text-left">
          <div className="flex justify-center md:justify-start mb-4">
              <a href="/" className="shrink-0 flex items-center">
                  <div className={!isLight ? "bg-white p-1.5 rounded-lg inline-block" : "inline-block"}>
                      <img
                          src={egs}
                          alt="EGS Logo"
                          className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-all duration-300"
                      />
                  </div>
              </a>
          </div>
          
          <p className="mt-2 text-xl text-ink-50 font-bold font-display">
            E.G.S Pillay Engineering College
          </p>

          <p className="text-sm mt-2 font-500">
            Autonomous Institution | Affiliated to Anna University
          </p>

          <p className="text-sm">
            Accredited by NBA & NAAC with Grade "A++"
          </p>

          <p className="text-sm mt-2 text-ink-400">
            Nagapattinam, Tamil Nadu - 611002
          </p>
        </div>

        {/* Social Links */}
        <div className="lg:col-span-3 text-center md:text-left">
          <h2 className="font-semibold mb-4 text-ink-100 font-display">Social Links</h2>

          <ul className="text-sm space-y-3 text-ink-400">
            <li>
              <a href="#" className="hover:text-lime-300 transition-colors">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-lime-300 transition-colors">
                Facebook
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-lime-300 transition-colors">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-lime-300 transition-colors">
                Instagram
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="lg:col-span-4 text-center md:text-left">
          <h2 className="font-semibold mb-4 text-ink-100 font-display">Contact</h2>

          <div className="text-sm space-y-2 text-ink-400">
            <p className="font-semibold text-ink-100">
              R. Ramanan M.E., (Ph.D)
            </p>
            <p>
              Project Associate - EGS Pillay Group of Institutions
            </p>
            <p>
              Assistant Professor | Department of EEE
            </p>
            <p className="pt-1">
              Domains: IoT | Artificial Intelligence | Robotics | Automation
            </p>
            <p>
              Focus: Student Project Mentoring | Research & Innovation
            </p>
            <p className="pt-1">
              Nagapattinam, Tamil Nadu - 611002
            </p>
            <p className="text-lime-300 font-500 pt-1">
               +91 73733 36959
            </p>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <p className="pt-4 text-center text-xs md:text-sm pb-5 text-ink-500">
        &copy; {new Date().getFullYear()} EGS Pillay Group of Institutions. All Rights Reserved.
      </p>

    </footer>
  );
}
