import React, { useState, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, PhoneCall, Stethoscope, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Doctor } from '../types';
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste! Welcome to Shree Krishna Multispecialty Hospital 24/7 AI Desk. I can provide real-time Doctor Availability Status, OPD Timings, Charges, and Appointment Guidance. How may I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getDoctors().then(docs => setDoctors(docs));
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

  const handleSendQueryText = (textToSend: string) => {
    processUserQuery(textToSend);
  };

  const processUserQuery = async (userText: string) => {
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

    // Refresh live doctor list before responding
    let currentDoctors = doctors;
    try {
      currentDoctors = await api.getDoctors();
      setDoctors(currentDoctors);
    } catch (e) {
      console.error("Failed to fetch live doctors in chatbot", e);
    }

    setTimeout(() => {
      const query = userText.toLowerCase();
      let botAnswer = "";

      // Check if asking about specific doctor
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
      else if (query.includes('availab') || query.includes('doctor') || query.includes('who is') || query.includes('status') || query.includes('timing') || query.includes('schedule') || query.includes('opd status') || query.includes('present')) {
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
      else if (query.includes('payment') || query.includes('upi') || query.includes('card') || query.includes('cash') || query.includes('insurance')) {
        botAnswer = "💳 **Payment Methods & Cashless Support:**\n\n" +
          "At our OPD Reception and Billing Counter, we accept:\n" +
          "• Cash & All Major Credit/Debit Cards\n" +
          "• Instant UPI (Google Pay, PhonePe, Paytm QR Code)\n" +
          "• Cashless Mediclaim TPA Pre-authorization for all major insurance companies.";
      }
      else {
        botAnswer = `Shree Krishna Multispecialty Hospital in Silvassa provides 24x7 Critical Care, Trauma Surgery, Orthopedics, Obstetrics & Gynecology, Robotic Physiotherapy, and Radiology.\n\n` +
          `You can ask me about **Doctor Availability Status**, **OPD Consultation Fees**, **Emergency Contact**, or **OPD Timings**.`;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processUserQuery(input);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[600px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight">Shree Krishna AI Assistant</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase flex items-center gap-1 border border-emerald-400/30">
                  <Sparkles className="w-2.5 h-2.5" /> Powered
                </span>
              </div>
              <p className="text-[11px] text-teal-200 font-medium">24/7 OPD & Clinical Guidance Bot</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
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
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Connecting to Admin Live Doctor Desk...
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => handleSendQueryText("Doctor availability status")}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-900 transition-all cursor-pointer shadow-xs"
          >
            🟢 Live Doctor Availability
          </button>
          <button
            onClick={() => handleSendQueryText("Is Dr Tushar Patel available?")}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-900 transition-all cursor-pointer shadow-xs"
          >
            🩺 Dr. Tushar Patel Status
          </button>
          <button
            onClick={() => handleSendQueryText("Is Dr Dipti Agarwal in OPD?")}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-900 transition-all cursor-pointer shadow-xs"
          >
            👩‍⚕️ Dr. Dipti Agarwal Status
          </button>
          <button
            onClick={() => handleSendQueryText("OPD fees and charges")}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-900 transition-all cursor-pointer shadow-xs"
          >
            💰 OPD Charges
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Ask about doctors, charges, OPD timing, or emergency..."
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
