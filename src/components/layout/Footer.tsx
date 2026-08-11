import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, HeartPulse, Award, Users, Eye, Share2, ChevronRight, ExternalLink } from 'lucide-react';
import { HospitalLogo } from '../common/HospitalLogo';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const [visitorCount, setVisitorCount] = useState<number>(148592);

  useEffect(() => {
    // Increment visitor count on initial load
    const saved = localStorage.getItem('shree_krishna_visitor_count');
    let count = saved ? parseInt(saved, 10) : 148592;
    count += 1;
    localStorage.setItem('shree_krishna_visitor_count', count.toString());
    setVisitorCount(count);
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-10 border-t border-slate-800/80 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Col 1: About, Contacts & Socials (Width: 3.5 cols on LG) */}
          <div className="lg:col-span-3 space-y-5">
            <HospitalLogo size="md" variant="full" theme="dark" />

            <p className="text-xs text-slate-400 leading-relaxed">
              35 Bedded Well-Equipped Multispeciality Hospital in Silvassa featuring 24/7 Digital DR X-Ray, 3D/4D Voluson USG, Storz Laparoscopy, Robotic Physiotherapy, and Cashless Mediclaim.
            </p>

            {/* Direct Contact Cards */}
            <div className="space-y-2 pt-1 text-xs">
              <a
                href="tel:+919099057219"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 group-hover:scale-110 transition-transform">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Appointment & Emergency</div>
                  <div className="font-bold text-white text-xs">+91 90990 57219</div>
                </div>
              </a>

              <a
                href="mailto:shreekrishnamultispeciality.sil@gmail.com"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 group-hover:scale-110 transition-transform">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Email Inquiries</div>
                  <div className="font-medium text-slate-300 text-xs">shreekrishnamultispeciality.sil@gmail.com</div>
                </div>
              </a>
            </div>

            {/* Social Connect Icons */}
            <div className="pt-2">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Connect With Us
              </div>
              <div className="flex items-center gap-2">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-sm hover:scale-105"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-sm hover:scale-105"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/919099057219"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-sm hover:scale-105"
                  aria-label="WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                </a>

                {/* Twitter / X */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-sm hover:scale-105"
                  aria-label="Twitter X"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all shadow-sm hover:scale-105"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* VISITORS COUNT DISPLAY BADGE - MOVED HERE UNDER SOCIAL ICONS */}
            <div className="pt-2">
              <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-emerald-800/80 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
                    <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-400" /> VISITORS COUNT
                    </div>
                    <div className="text-base font-black text-white font-mono tracking-wider">
                      {visitorCount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Navigation (Width: 2.5 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {[
                { label: 'Hospital Overview & Photos', tab: 'home' },
                { label: 'Medical Specialties', tab: 'departments' },
                { label: 'Specialist Consultants', tab: 'doctors' },
                { label: 'Book Appointment', tab: 'booking' },
                { label: 'Patient Portal & Reports', tab: 'dashboard' },
                { label: '24x7 Emergency Services', tab: 'booking' }
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActiveTab(item.tab)}
                    className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-all hover:translate-x-1 group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/70 group-hover:text-emerald-400" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Accreditation Badges */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>NABH Accredited Standard</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>Cashless TPA & Mediclaim</span>
              </div>
            </div>
          </div>

          {/* Col 3: Key Medical Specialties (Width: 2.5 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Key Specialties
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {[
                'Orthopedic Surgery (Joints & Trauma)',
                'Obs & Gynae, Infertility Clinic',
                'General & Laparoscopic Surgery',
                'Robotic & VR Physiotherapy Center',
                '3D & 4D Sonography (Voluson USG)',
                '24x7 Digital DR X-Ray & Pathology',
                'Surgical ICU & Labour Room',
                'Cashless Mediclaim Desk'
              ].map((spec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Location, Hours & Map (Width: 3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Hospital Location
            </h4>

            {/* Address */}
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa, Dadra & Nagar Haveli- 396230 (UT)
              </p>
            </div>

            {/* Google Map Embedded Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-md bg-slate-900 group relative">
              <iframe
                title="Shree Krishna Hospital Silvassa Location Map"
                src="https://maps.google.com/maps?q=Opp.+Horizon+tower,+Kilvani+Road,+Mitu+Apartment,+C/o+-+Gulabbhai+Patel,+Amli,+Silvassa,+Dadra+%26+Nagar+Haveli-+396230&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="130"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-32 filter contrast-105 brightness-90 group-hover:brightness-100 transition-all"
              />
              <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  Kilvani Road, Amli, Silvassa
                </span>
                <a
                  href="https://maps.google.com/?q=Opp.+Horizon+tower,+Kilvani+Road,+Mitu+Apartment,+C/o+-+Gulabbhai+Patel,+Amli,+Silvassa,+Dadra+%26+Nagar+Haveli-+396230"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors flex items-center gap-1 shadow-sm"
                >
                  Get Directions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Consultation Hours */}
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-white">Consultation Hours:</p>
                <p className="text-slate-400">Mon - Sat: 10:00 AM - 08:00 PM</p>
                <p className="text-emerald-400 font-semibold">Sun: 24x7 Emergency Only</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with DESIGNED & DEVELOPED BY : FUSION FORGE CREATIONS */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p className="text-slate-400 text-center md:text-left">
            © 2026 Shree Krishna Multispeciality Hospital. All rights reserved.
          </p>
          
          {/* DESIGNED & DEVELOPED BY : FUSION FORGE CREATIONS */}
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-900/80 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              DESIGNED & DEVELOPED BY : <span className="text-emerald-400 font-black underline decoration-emerald-500/50 underline-offset-2">FUSION FORGE CREATIONS</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Patients Charter</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

