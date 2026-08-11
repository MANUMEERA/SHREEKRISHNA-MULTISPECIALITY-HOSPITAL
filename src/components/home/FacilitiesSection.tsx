import React, { useState } from 'react';
import { Cpu, CheckCircle2, ShieldCheck, Zap, Activity, HeartPulse, Building2, Stethoscope, Microscope, Sparkles, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, Maximize2, Layers } from 'lucide-react';

export interface HospitalFacilityItem {
  id: string;
  label: string;
  title: string;
  category: 'Infrastructure' | 'Clinical Care' | 'Inpatient Rooms' | 'Advanced Surgery';
  description: string;
  specs: string[];
  image: string;
  badge: string;
}

export const FacilitiesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brochure9' | 'highlights' | 'grid'>('brochure9');
  const [selectedImageModal, setSelectedImageModal] = useState<HospitalFacilityItem | null>(null);
  const [activeBrochureIndex, setActiveBrochureIndex] = useState(0);

  // The 9 Exact Brochure Facilities from the Official Printed Catalog
  const brochureFacilities: HospitalFacilityItem[] = [
    {
      id: 'building',
      label: 'HOSPITAL BUILDING',
      title: 'Shree Krishna Multispeciality Hospital Building',
      category: 'Infrastructure',
      badge: '35 Bedded Facility • Silvassa',
      description: 'Modern multi-story medical facility with 24x7 Emergency entrance, dedicated diagnostic labs, surgical suites, and ample parking on Kilvani Road, Silvassa.',
      specs: ['35 Bedded Capacity', '24x7 Emergency Entry', 'Cashless Insurance Helpdesk', 'Centralized Pharmacy'],
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'reception',
      label: 'RECEPTION',
      title: 'Hospital Main Reception & Foyer',
      category: 'Infrastructure',
      badge: 'Zero Wait OPD Queue',
      description: 'Clean, air-conditioned patient reception counter and waiting lounge with digital queue management, inquiry desk, and quick admission processing.',
      specs: ['Digital Token Display', 'Air-Conditioned Waiting Hall', 'Cashless TPA Desk', '24x7 Help Desk'],
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'nursing-station',
      label: 'ROOM NURSING STATION',
      title: 'Inpatient Room Nursing Station',
      category: 'Clinical Care',
      badge: '24x7 Continuous Care',
      description: 'Dedicated nursing desk stationed directly on inpatient floors for immediate patient response, doctor rounding coordination, and medicine administration.',
      specs: ['Round-the-clock Staffing', 'Emergency Call Button System', 'Vital Monitoring Stations', 'Medication Storage'],
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'icu',
      label: 'ICU',
      title: '24x7 Surgical Intensive Care Unit (ICU)',
      category: 'Clinical Care',
      badge: 'Critical Care Unit',
      description: 'Equipped with multipara vital sign monitors, central oxygen supply, ventilator support, and continuous intensive nursing supervision for critical trauma & post-op patients.',
      specs: ['Multipara Vital Monitors', 'Central Oxygen Supply', 'Defibrillators & Syringe Pumps', 'Zero-Infection Protocol'],
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'operation-theatre',
      label: 'OPERATION THEATRE',
      title: 'Modular Operation Theatre (OT)',
      category: 'Advanced Surgery',
      badge: 'C-Arm Image Intensifier',
      description: 'State-of-the-art sterile modular OT equipped with High Frequency C-Arm Image Intensifier, scialytic surgical lights, and laminar airflow for Ortho, Spine & Gynae procedures.',
      specs: ['High Frequency C-Arm', 'Laminar Airflow Sterilization', 'Electro-Hydraulic OT Table', 'Anesthesia Workstation'],
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'general-ward',
      label: 'GENERAL WARD',
      title: 'Clean Inpatient General Ward',
      category: 'Inpatient Rooms',
      badge: 'Spacious & Well Ventilated',
      description: 'Spacious multi-bed general ward with individual privacy curtains, adjustable patient beds, individual locker units, and IV line supports.',
      specs: ['Privacy Curtain Dividers', 'Adjustable Hospital Beds', 'Attendant Stool & Locker', 'Daily Sanatization'],
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'special-room',
      label: 'SPECIAL ROOM',
      title: 'Private Special Patient Room',
      category: 'Inpatient Rooms',
      badge: 'Private AC Accomodation',
      description: 'Comfortable single-occupancy special room featuring patient bed, television, attached private bathroom, air conditioning, and guest seating.',
      specs: ['Air Conditioned', 'LED TV & Free Wi-Fi', 'Attached Washroom', 'Attendant Couch'],
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'deluxe-room',
      label: 'DELUXE ROOM',
      title: 'Premium Deluxe Inpatient Suite',
      category: 'Inpatient Rooms',
      badge: 'Executive Comfort',
      description: 'Luxury deluxe suite with premium wooden interior finishes, motorized patient bed, dedicated attendant sofa bed, smart TV, refrigerator, and room service.',
      specs: ['Motorized ICU Grade Bed', 'Dedicated Sofa Bed for Attendant', 'Refrigerator & Smart TV', 'Ensuite Bathroom'],
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=90&w=1200'
    },
    {
      id: 'storz-laparoscopy',
      label: 'LATEST STORZ LAPAROSCOPIC UNIT',
      title: 'Latest Storz Laparoscopic Surgery Unit',
      category: 'Advanced Surgery',
      badge: 'Keyhole Laparoscopy',
      description: 'High-definition KARL STORZ endoscopic video tower unit for minimally invasive keyhole surgeries in Gynaecology, Infertility, Appendectomy, and Hernia repairs.',
      specs: ['KARL STORZ HD Camera System', 'Cold LED Light Source', 'CO2 High Flow Insufflator', 'Precision Laparoscopic Tools'],
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=90&w=1200'
    }
  ];

  const mainHighlights = [
    {
      title: 'Robotic & VR Physiotherapy Clinic',
      subtitle: 'Innovative Rehabilitation in South Gujarat',
      desc: 'Equipped with the latest Robotic Equipment & VR Machine for superior pre & post-operative care, neurological rehab, and pain management.',
      tag: 'Robotic & VR Rehab',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=90&w=800'
    },
    {
      title: '3D 4D Voluson USG & Storz Laparoscopy',
      subtitle: 'Advanced Diagnostic & Keyhole Surgery',
      desc: '3D 4D Voluson ultrasound for fetal anomaly imaging, Non-Stress Test (NST) monitor, and Latest Storz Laparoscopic unit for precision surgery.',
      tag: 'Sonography & Laparoscopy',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=90&w=800'
    },
    {
      title: 'High Frequency Image Intensifier OT',
      subtitle: 'Orthopedic Trauma, Spine & Joint Surgery',
      desc: 'Modern Operation Theatre equipped with High Frequency Image Intensifier delivering high-resolution X-ray imaging during Joint Replacement, Trauma, Spine & Ilizarov procedures.',
      tag: 'Modular OT',
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=90&w=800'
    },
    {
      title: 'High Power Class-IV Laser Unit',
      subtitle: 'Non-Invasive Deep Tissue Therapy',
      desc: 'Class-IV High Power Laser treatment for accelerated cellular healing, joint inflammation relief, and non-surgical pain management.',
      tag: 'Laser Therapy',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=90&w=800'
    }
  ];

  const availableFacilities = [
    { name: 'Orthopaedic Surgeon', desc: 'Joint Replacement & Trauma' },
    { name: 'Obs & Gynae, Infertility Specialist', desc: '3D/4D Voluson Scans & Delivery' },
    { name: 'Urologist', desc: 'Kidney & Urinary Tract Care' },
    { name: '3D & 4D Sonography', desc: 'Voluson USG & NST Monitoring' },
    { name: 'General & Laparoscopic Surgeon', desc: 'Minimally Invasive Surgeries' },
    { name: 'Plastic Surgeon', desc: 'Reconstructive & Cosmetic' },
    { name: 'Physiotherapist', desc: 'Robotic & VR Rehab Center' },
    { name: 'Laparoscopy', desc: 'Latest Storz Laparoscope Unit' },
    { name: 'General Physician', desc: 'Internal Medicine & OPD' },
    { name: 'Operation Theatre', desc: 'High Frequency Image Intensifier' },
    { name: 'Neurosurgeon', desc: 'Brain & Nervous System' },
    { name: 'Spine Surgeon', desc: 'Complex Spine & Ilizarov' },
    { name: 'Pathology', desc: '24*7 Diagnostic Blood Lab' },
    { name: 'Labour Room', desc: 'Dedicated Maternity Suite' },
    { name: 'Surgical ICU', desc: '24*7 Intensive Monitoring' },
    { name: '24*7 Digital DR X-Ray', desc: 'Instant High-Res Radiography' },
    { name: '24*7 Pharmacy', desc: 'On-site Emergency Medicines' },
    { name: '24*7 Emergency Services', desc: 'Immediate Trauma Response' },
    { name: 'Cashless Mediclaim Facilities', desc: 'All Major Insurance TPA' }
  ];

  const nextBrochure = () => {
    setActiveBrochureIndex((prev) => (prev + 1) % brochureFacilities.length);
  };

  const prevBrochure = () => {
    setActiveBrochureIndex((prev) => (prev - 1 + brochureFacilities.length) % brochureFacilities.length);
  };

  const currentBrochureItem = brochureFacilities[activeBrochureIndex];

  return (
    <section className="py-16 sm:py-20 bg-slate-950 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Hospital Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            PHOTO GALLERY
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            High resolution photographs of hospital facilities including Main Building, Reception, ICU, OT, Special Rooms, and Storz Laparoscopy Unit.
          </p>

          {/* View Toggle Tabs */}
          <div className="mt-8 inline-flex p-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex-wrap justify-center gap-1">
            <button
              onClick={() => setActiveTab('brochure9')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'brochure9'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Official 9 Brochure Photos
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'highlights'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Key Medical Tech
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'grid'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> All 19 Services
            </button>
          </div>
        </div>

        {/* Tab 1: Official 9 Brochure Facilities (Photo Cards & Swipe Slider) */}
        {activeTab === 'brochure9' && (
          <div className="space-y-12">
            
            {/* Featured Hero Swipe Card for Selected Facility */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative">
              
              {/* Image Side */}
              <div className="lg:col-span-7 relative h-[320px] sm:h-[420px] overflow-hidden bg-black">
                <img
                  src={currentBrochureItem.image}
                  alt={currentBrochureItem.title}
                  className="w-full h-full object-cover filter brightness-95 hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                
                {/* Badge Tag */}
                <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg">
                  {currentBrochureItem.label}
                </div>

                {/* Fullscreen view button */}
                <button
                  onClick={() => setSelectedImageModal(currentBrochureItem)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/80 hover:bg-emerald-500 text-white transition-colors border border-slate-700 shadow-lg flex items-center gap-1.5 text-xs font-bold"
                >
                  <Maximize2 className="w-4 h-4" /> High-Res View
                </button>

                {/* Arrow Navigation */}
                <button
                  onClick={prevBrochure}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white border border-slate-700 transition-all shadow-xl"
                  aria-label="Previous Facility"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextBrochure}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white border border-slate-700 transition-all shadow-xl"
                  aria-label="Next Facility"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Text Side */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">
                    <span>{currentBrochureItem.category}</span>
                    <span>•</span>
                    <span>Facility {activeBrochureIndex + 1} of 9</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {currentBrochureItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                    {currentBrochureItem.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Key Equipment & Specs:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentBrochureItem.specs.map((spec, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Thumbnails Strip */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {currentBrochureItem.badge}
                  </span>
                  <button
                    onClick={() => setSelectedImageModal(currentBrochureItem)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Resolution
                  </button>
                </div>
              </div>

            </div>

            {/* Grid of All 9 Brochure Facilities */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  FACILITY PHOTOGRAPHS
                </h3>
                <span className="text-xs text-slate-400">9 High Resolution Photographs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {brochureFacilities.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveBrochureIndex(idx);
                      setSelectedImageModal(item);
                    }}
                    className={`group bg-slate-900 rounded-2xl overflow-hidden border transition-all cursor-pointer hover:shadow-2xl ${
                      idx === activeBrochureIndex
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative h-48 overflow-hidden bg-black">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover filter brightness-90 group-hover:scale-108 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-emerald-300 border border-emerald-700/80 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                        {item.label}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-bold">
                        <span className="truncate max-w-[200px]">{item.title}</span>
                        <span className="p-1.5 rounded-full bg-emerald-500 text-slate-950">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-slate-800/80">
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                        <span>{item.badge}</span>
                        <span className="group-hover:translate-x-1 transition-transform">View Details →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Key Medical Tech */}
        {activeTab === 'highlights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainHighlights.map((fac, idx) => (
              <div key={idx} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="h-44 overflow-hidden relative bg-black">
                    <img
                      src={fac.image}
                      alt={fac.title}
                      className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-950/90 text-emerald-300 border border-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {fac.tag}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base text-white mb-1 leading-snug">{fac.title}</h3>
                    <p className="text-xs font-semibold text-emerald-400 mb-2.5">{fac.subtitle}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{fac.desc}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-800/80 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Available at Shree Krishna Hospital
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Available Facilities Grid */}
        {activeTab === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableFacilities.map((item, idx) => (
              <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Lightbox High-Res Image Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl space-y-4">
            <div className="relative h-[420px] bg-black">
              <img
                src={selectedImageModal.image}
                alt={selectedImageModal.title}
                className="w-full h-full object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-slate-950/90 text-white font-bold text-xs hover:bg-rose-600 transition-colors border border-slate-700"
              >
                ✕ Close
              </button>
              <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full">
                {selectedImageModal.label}
              </div>
            </div>

            <div className="p-6 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{selectedImageModal.title}</h3>
                <span className="text-xs text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
                  {selectedImageModal.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedImageModal.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedImageModal.specs.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

