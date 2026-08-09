import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, PhoneCall, ShieldCheck, Activity, Heart, Award, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';
import { HospitalLogo, HospitalLogoIcon } from '../common/HospitalLogo';

interface HeroBannerProps {
  setActiveTab: (tab: string) => void;
  onSearch: (query: string) => void;
}

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  image: string;
  location: string;
  beds: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ setActiveTab, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedFullscreenImg, setSelectedFullscreenImg] = useState<string | null>(null);

  const slides: HeroSlide[] = [
    {
      id: 'main-building',
      badge: 'Silvassa Campus • 35 Bedded Facility',
      title: 'Shree Krishna',
      highlight: 'Multispeciality Hospital',
      subtitle: 'Advanced Care with Compassion',
      description: 'Premier multispecialty hospital in Silvassa featuring Orthopedics, Obstetrics & Gynaecology, Infertility Care, Robotic Physiotherapy, Storz Laparoscopy, 3D/4D Voluson USG, 24x7 Digital DR X-Ray, Surgical ICU, and Cashless Mediclaim.',
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=90&w=1600',
      location: 'Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa',
      beds: '35 Beds • 24x7 Emergency'
    },
    {
      id: 'reception-lobby',
      badge: 'Modern Infrastructure • Patient Care',
      title: 'Hospital Reception',
      highlight: '& Nursing Station',
      subtitle: 'Seamless Zero-Wait Consultation',
      description: 'Equipped with digital patient registration desks, spacious waiting lounge, continuous nursing care stations, and dedicated emergency admission counters.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=90&w=1600',
      location: 'Ground Floor Foyer • Silvassa',
      beds: 'Digital Queue & Token System'
    },
    {
      id: 'storz-ot',
      badge: 'Latest Storz Laparoscopic Unit',
      title: 'Modular Operation Theatre',
      highlight: '& Keyhole Surgery',
      subtitle: 'High Frequency Image Intensifier',
      description: 'State-of-the-art surgical suites with Latest Storz Laparoscope, C-Arm High Frequency Radiography, Voluson 3D/4D Sonography, and High Power Class-IV Laser Unit.',
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=90&w=1600',
      location: 'Surgical Wing • Floor 2',
      beds: 'Ultra-Clean Laminar OT'
    },
    {
      id: 'icu-wards',
      badge: '24x7 Intensive Care • Emergency',
      title: 'Surgical ICU',
      highlight: '& Deluxe Patient Rooms',
      subtitle: '24x7 Vital Monitoring & Nursing Care',
      description: '35 bedded multi-tier accommodation including Surgical ICU, General Wards, Special Rooms, and Deluxe AC suites with private attendant facilities.',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=90&w=1600',
      location: 'Critical Care Unit • Floor 1',
      beds: 'Multipara Monitors & Ventilators'
    },
    {
      id: 'robotic-rehab',
      badge: 'First in South Gujarat',
      title: 'Robotic & VR',
      highlight: 'Physiotherapy Center',
      subtitle: 'Advanced Neurological & Ortho Rehab',
      description: 'Equipped with Virtual Reality rehabilitation machines, robotic gait trainers, laser therapy, and personalized physical recovery protocols.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=90&w=1600',
      location: 'Physiotherapy Wing • Floor 1',
      beds: 'Robotic & VR Equipment'
    }
  ];

  // Auto-slide timer
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoplay, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch Swipe gesture handlers
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setActiveTab('doctors');
    }
  };

  const slide = slides[currentSlide];

  return (
    <div 
      className="relative bg-slate-950 text-white overflow-hidden min-h-[620px] sm:min-h-[680px] flex items-center select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Background Media & Dynamic Image Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
            }`}
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover filter brightness-[0.38] contrast-110"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
        
        {/* Dark Emerald & Teal Gradient Overlays */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        <div className="absolute inset-0 z-20 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Decorative Floating Medical Pulse Graphics */}
      <div className="absolute top-12 right-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-20" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-20" />

      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Text & Search */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-600/80 text-emerald-300 text-xs font-bold uppercase tracking-widest shadow-md">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{slide.badge}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl hidden sm:block flex-shrink-0">
                <HospitalLogoIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                  {slide.title} <br />
                  <span className="text-emerald-400 drop-shadow-sm">
                    {slide.highlight}
                  </span>
                </h1>
                <p className="text-base sm:text-xl font-bold text-emerald-300 mt-2 tracking-wide">
                  {slide.subtitle}
                </p>
              </div>
            </div>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-xl font-normal transition-all duration-300">
              {slide.description}
            </p>

            {/* Quick Doctor Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-1 max-w-lg">
              <div className="bg-slate-900/90 p-2 rounded-2xl border border-slate-700/90 shadow-2xl backdrop-blur-xl flex items-center gap-2">
                <div className="pl-3 text-emerald-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search doctor, specialty (e.g. Orthopedics, Gynaecology)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none py-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-emerald-600/30"
                >
                  Find Doctor
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('booking')}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4" /> Book Appointment Now
              </button>

              <a
                href="tel:+919099057219"
                className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/90 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 hover:border-emerald-500/50"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" /> +91 90990 57219
              </a>
            </div>

            {/* Quick Guarantees */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-[11px] sm:text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cashless Mediclaim
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> 24x7 Emergency OPD
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-400" /> Storz Laparoscopy
              </div>
            </div>

          </div>

          {/* Right Column: SWIPE / CAROUSEL HOSPITAL IMAGE SHOWCASE */}
          <div className="lg:col-span-6">
            <div className="relative group">
              
              {/* Glowing Ambient Backdrop */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-3xl blur-xl opacity-35 group-hover:opacity-55 transition duration-500" />

              {/* Main Image Slider Frame */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 shadow-2xl">
                
                {/* Main Slide Image */}
                <div className="relative h-[340px] sm:h-[420px] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 filter brightness-95 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Image Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Top Left Tag */}
                  <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{slide.badge}</span>
                  </div>

                  {/* Top Right Controls: Autoplay Toggle & Fullscreen Expand */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoplay(!isAutoplay)}
                      className="p-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-emerald-400 hover:bg-slate-900 transition-colors shadow-md"
                      title={isAutoplay ? 'Pause Auto-Swipe' : 'Start Auto-Swipe'}
                    >
                      {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setSelectedFullscreenImg(slide.image)}
                      className="p-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-white hover:bg-slate-900 transition-colors shadow-md"
                      title="View High Resolution Photo"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Navigation Swipe Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white border border-slate-700/80 transition-all shadow-xl hover:scale-110 active:scale-95"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white border border-slate-700/80 transition-all shadow-xl hover:scale-110 active:scale-95"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Bottom Info Ribbon */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                          {slide.title} {slide.highlight}
                          {slide.id === 'main-building' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                              MAIN BUILDING
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">
                          📍 {slide.location}
                        </p>
                      </div>
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                        {slide.beds}
                      </span>
                    </div>

                    {/* Slide Dots Indicator */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        {slides.map((s, idx) => (
                          <button
                            key={s.id}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentSlide
                                ? 'w-7 bg-emerald-400 shadow-sm shadow-emerald-400/50'
                                : 'w-2 bg-slate-700 hover:bg-slate-500'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Swipe / Slide {currentSlide + 1} of {slides.length}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Thumbnail Strip */}
                <div className="p-2 bg-slate-950 grid grid-cols-5 gap-1.5 border-t border-slate-800/90">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setCurrentSlide(idx)}
                      className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                        idx === currentSlide
                          ? 'border-emerald-400 opacity-100 ring-2 ring-emerald-400/30'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img
                        src={s.image}
                        alt={s.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen High-Res Image Modal */}
      {selectedFullscreenImg && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <button
              onClick={() => setSelectedFullscreenImg(null)}
              className="absolute top-4 right-4 z-10 px-3.5 py-1.5 rounded-full bg-slate-950/80 text-white font-bold text-xs hover:bg-rose-600 transition-colors"
            >
              ✕ Close Preview
            </button>
            <img
              src={selectedFullscreenImg}
              alt="Shree Krishna Hospital Facility"
              className="w-full max-h-[85vh] object-contain mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
};
