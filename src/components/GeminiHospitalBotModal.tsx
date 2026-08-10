import React, { useState, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, PhoneCall, Stethoscope, Clock, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, MessageSquare } from 'lucide-react';
import { Doctor, BotFaqItem } from '../types';
import { api } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const GeminiHospitalBotModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [faqs, setFaqs] = useState<BotFaqItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste! Welcome to Shree Krishna Multispecialty Hospital 24/7 AI Desk. I can provide real-time Doctor Availability Status, OPD Timings, Hospital Charges, and Official Admin Desk Q&As. How may I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getDoctors().then(docs => setDoctors(docs));
      api.getBotFaqs().then(allFaqs => {
        setFaqs(allFaqs.filter(f => f.is_active));
      });
    }
  }, [isOpen]);

  const getStatusFormatted = (status?: string) => {
    switch (status) {
      case 'In OPD':
        return '🔵 In OPD (Consulting Outpatients)';
      case 'In OT / Surgery':
        return '🔴 In OT / Surgery (Procedure in Progress)';
      case 'On Leave':
        return '🟡 On Leave Today';
      case 'Off Duty':
        return '⚪ Off Duty';
      case 'Available':
      default:
        return '🟢 Available (Ready for Consultation)';
    }
  };

  const handleSendQueryText = (textToSend: string, matchedFaqId?: string) => {
    processUserQuery(textToSend, matchedFaqId);
  };

  const processUserQuery = async (userText: string, matchedFaqId?: string) => {
    if (!userText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Refresh live doctor list & FAQs
    let currentDoctors = doctors;
    let currentFaqs = faqs;
    try {
      const [latestDocs, latestFaqs] = await Promise.all([
        api.getDoctors(),
        api.getBotFaqs()
      ]);
      currentDoctors = latestDocs;
      setDoctors(latestDocs);
      currentFaqs = latestFaqs.filter(f => f.is_active);
      setFaqs(currentFaqs);
    } catch (e) {
      console.error("Failed to fetch live data in chatbot", e);
    }

    setTimeout(() => {
      const query = userText.toLowerCase().trim();
      let botAnswer = "";

      // 1. Check if direct FAQ click or keyword match in Admin-Configured Q&A
      let adminFaqMatch: BotFaqItem | undefined = undefined;

      if (matchedFaqId) {
        adminFaqMatch = currentFaqs.find(f => f.id === matchedFaqId);
      }

      if (!adminFaqMatch) {
        // Try exact question or substring question match
        adminFaqMatch = currentFaqs.find(f => 
          f.question.toLowerCase().includes(query) || query.includes(f.question.toLowerCase())
        );
      }

      if (!adminFaqMatch) {
        // Try keyword array match
        adminFaqMatch = currentFaqs.find(f => 
          f.keywords && f.keywords.some(kw => kw.trim().length > 2 && query.includes(kw.toLowerCase().trim()))
        );
      }

      if (adminFaqMatch) {
        // Increment click analytics
        api.incrementBotFaqClick(adminFaqMatch.id);
        botAnswer = `📌 **${adminFaqMatch.question}**\n\n${adminFaqMatch.answer}`;
      }
      else {
        // 2. Check if asking about specific doctor
        const matchedDoctor = currentDoctors.find(doc => 
          query.includes(doc.name.toLowerCase().replace('dr.', '').trim()) ||
          doc.name.toLowerCase().split(' ').some(part => part.length > 3 && query.includes(part))
        );

        if (matchedDoctor) {
          const st = getStatusFormatted(matchedDoctor.availability_status);
          botAnswer = `👨‍⚕️ **${matchedDoctor.name}** (${matchedDoctor.specialization})\n\n` +
            `• **Department:** ${matchedDoctor.department}\n` +
            `• **Live Status:** ${st}\n` +
            `• **OPD Fee:** ₹${matchedDoctor.consultation_fee}\n` +
            `• **OPD Timings:** ${matchedDoctor.opd_timings || 'Mon - Sat (09:00 AM - 08:30 PM)'}\n` +
            `• **Qualification:** ${matchedDoctor.qualification}\n\n` +
            `Would you like to book an appointment with ${matchedDoctor.name}?`;
        } 
        else if (query.includes('availab') || query.includes('doctor') || query.includes('who is') || query.includes('status') || query.includes('schedule') || query.includes('opd status') || query.includes('present')) {
          botAnswer = `🩺 **Live Doctor Availability Status (Synced with Hospital Admin Desk):**\n\n` +
            currentDoctors.map(doc => {
              const st = getStatusFormatted(doc.availability_status);
              return `• **${doc.name}** (${doc.department})\n   Status: ${st} | Fee: ₹${doc.consultation_fee}`;
            }).join('\n\n') +
            `\n\n📌 *All statuses are updated live by the Hospital Administration Desk.*`;
        }
        else if (query.includes('charge') || query.includes('fee') || query.includes('cost') || query.includes('price')) {
          botAnswer = "💰 **Hospital Service Charges & Consultation Fees:**\n\n" +
            "• **OPD Consultation Fee:** ₹400 - ₹500 (Depending on Specialty)\n" +
            "• **Digital DR X-Ray PA View:** ₹450\n" +
            "• **3D/4D Voluson USG Scan:** ₹1,500 - ₹2,200\n" +
            "• **Complete Blood Count (CBC):** ₹350\n" +
            "• **General Ward Bed:** ₹1,200 / day\n" +
            "• **Deluxe AC Room:** ₹2,500 / day\n" +
            "• **Super Deluxe Suite:** ₹4,500 / day\n" +
            "• **ICU Bed Monitoring:** ₹3,500 / day\n\n" +
            "*(Cashless Mediclaim & TPA available for major insurance providers)*";
        }
        else if (query.includes('emergency') || query.includes('phone') || query.includes('contact') || query.includes('help') || query.includes('number') || query.includes('ambulance')) {
          botAnswer = "🚨 **24x7 Emergency & Trauma Helpline:**\n\n" +
            "• **Hospital Emergency Hotline:** +91 90990 57219\n" +
            "• **Landline Reception Desk:** (0260) 264-9999\n" +
            "• **Location:** Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa - 396230\n" +
            "• **24/7 Services:** Surgical ICU, Trauma OT, Digital DR X-Ray, Blood Bank & Emergency Pharmacy.";
        }
        else {
          botAnswer = `Shree Krishna Multispecialty Hospital in Silvassa provides 24x7 Critical Care, Trauma Surgery, Orthopedics, Obstetrics & Gynecology, Robotic Physiotherapy, and Radiology.\n\n` +
            `You can click any of the **Fixed Q&A Buttons** below or ask me about Doctor Availability, OPD Timings, Emergency Contacts, or Service Fees!`;
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processUserQuery(input);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[640px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight">Shree Krishna AI Desk Assistant</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase flex items-center gap-1 border border-emerald-400/30">
                  <Sparkles className="w-2.5 h-2.5" /> Live Admin Sync
                </span>
              </div>
              <p className="text-[11px] text-teal-200 font-medium">Official Hospital Q&A Knowledge Base</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-xl bg-teal-800 text-teal-200 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-none font-semibold'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line space-y-1">{m.text}</div>
                <span className={`text-[9px] block text-right mt-1.5 font-mono ${m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {m.time}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-slate-500 italic p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Searching Admin Q&A Knowledge Base...
            </div>
          )}
        </div>

        {/* FIXED ADMIN Q&A QUICK PROMPT CHIPS */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1 text-slate-700">
              <HelpCircle className="w-3 h-3 text-emerald-600" /> Admin Fixed Q&A Responses ({faqs.length}):
            </span>
            <span className="text-[9px] text-emerald-700 font-semibold">Click to Get Fixed Answer</span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => handleSendQueryText("Doctor availability status")}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80 text-[10px] font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1"
            >
              🟢 Live Doctor Status
            </button>

            {faqs.map(f => (
              <button
                key={f.id}
                onClick={() => handleSendQueryText(f.question, f.id)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 text-[10px] font-bold text-slate-800 hover:text-emerald-900 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                title={`Category: ${f.category}`}
              >
                <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{f.question}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type your question or choose a fixed Q&A above..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

