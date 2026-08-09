import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { EmergencyHeader } from './components/layout/EmergencyHeader';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { LoginPage } from './pages/LoginPage';
import { BookingPage } from './pages/BookingPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { GeminiHospitalBotModal } from './components/GeminiHospitalBotModal';
import { Doctor } from './types';
import { Bot, Sparkles, X } from 'lucide-react';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');
  const [aiBotOpen, setAiBotOpen] = useState<boolean>(false);

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSelectedDepartment(doc.department);
  };

  const handleSelectDepartment = (deptName: string) => {
    setSelectedDepartment(deptName);
  };

  const handleSearchDoctors = (query: string) => {
    setDoctorSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      <div>
        <EmergencyHeader />
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onOpenAiBot={() => setAiBotOpen(true)} />

        <main>
          {activeTab === 'home' && (
            <HomePage
              setActiveTab={setActiveTab}
              onSearchDoctors={handleSearchDoctors}
              onSelectDoctor={handleSelectDoctor}
              onSelectDepartment={handleSelectDepartment}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentsPage
              setActiveTab={setActiveTab}
              onSelectDepartment={handleSelectDepartment}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorsPage
              setActiveTab={setActiveTab}
              onSelectDoctor={handleSelectDoctor}
              initialSearchQuery={doctorSearchQuery}
            />
          )}

          {activeTab === 'login' && (
            <LoginPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'booking' && (
            <BookingPage
              setActiveTab={setActiveTab}
              preselectedDoctor={selectedDoctor}
              preselectedDepartment={selectedDepartment}
            />
          )}

          {activeTab === 'dashboard' && (
            <PatientDashboardPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'doctor_panel' && (
            <DoctorDashboardPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'admin' && (
            <AdminDashboardPage />
          )}
        </main>
      </div>

      {activeTab !== 'admin' && <Footer setActiveTab={setActiveTab} />}

      {/* ================= FLOATING AI ASSISTANT CHATBOT BUTTON ================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
        <button
          onClick={() => setAiBotOpen(true)}
          className="relative px-4 py-3.5 rounded-full bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white font-extrabold text-xs shadow-2xl border-2 border-emerald-400/50 hover:border-emerald-300 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-2.5"
          title="Open 24/7 AI Health Assistant Desk"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>

          <div className="p-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
            <Bot className="w-5 h-5 text-emerald-300 animate-bounce" />
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-[11px] font-black tracking-wide text-white flex items-center gap-1">
              AI Desk Assistant <Sparkles className="w-3 h-3 text-amber-300" />
            </div>
            <div className="text-[9px] text-emerald-200 font-medium">Ask OPD, Charges & Care</div>
          </div>
        </button>
      </div>

      {/* GLOBAL AI BOT MODAL */}
      <GeminiHospitalBotModal
        isOpen={aiBotOpen}
        onClose={() => setAiBotOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
