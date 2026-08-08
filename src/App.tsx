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
import { Doctor } from './types';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <div>
        <EmergencyHeader />
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
