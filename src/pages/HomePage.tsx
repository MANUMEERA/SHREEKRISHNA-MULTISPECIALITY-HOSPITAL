import React from 'react';
import { HeroBanner } from '../components/home/HeroBanner';
import { QuickActionCards } from '../components/home/QuickActionCards';
import { StatsTicker } from '../components/home/StatsTicker';
import { FeaturedDepartments } from '../components/home/FeaturedDepartments';
import { AvailableFacilitiesBrochure } from '../components/home/AvailableFacilitiesBrochure';
import { TopDoctors } from '../components/home/TopDoctors';
import { FacilitiesSection } from '../components/home/FacilitiesSection';
import { EmergencyBanner } from '../components/home/EmergencyBanner';
import { Doctor } from '../types';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  onSearchDoctors?: (query: string) => void;
  onSelectDoctor?: (doc: Doctor) => void;
  onSelectDepartment?: (deptName: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActiveTab,
  onSearchDoctors,
  onSelectDoctor,
  onSelectDepartment
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <HeroBanner setActiveTab={setActiveTab} onSearch={onSearchDoctors || (() => {})} />
      <QuickActionCards setActiveTab={setActiveTab} />
      <div className="mt-12">
        <StatsTicker />
      </div>
      <FeaturedDepartments setActiveTab={setActiveTab} onSelectDepartment={onSelectDepartment} />
      
      {/* Official Printed Brochure "Available Facilities" Section */}
      <AvailableFacilitiesBrochure />

      {/* Photo Gallery Component */}
      <FacilitiesSection />

      <TopDoctors setActiveTab={setActiveTab} onSelectDoctor={onSelectDoctor} />
      <EmergencyBanner setActiveTab={setActiveTab} />
    </div>
  );
};
