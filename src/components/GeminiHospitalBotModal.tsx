import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, PhoneCall, Stethoscope, Clock, ShieldCheck } from 'lucide-react';

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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste! Welcome to Shree Krishna Multispecialty Hospital AI Desk. How can I assist you with OPD booking, Doctor availability, IPD admission charges, or health inquiries today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // AI bot responses logic
    setTimeout(() => {
      let botAnswer = "Shree Krishna Multispecialty Hospital is equipped with 24x7 Emergency, ICU, Cath Lab, Digital X-Ray, and Advanced Surgery Wards. OPD hours are Monday to Saturday, 09:00 AM - 08:00 PM.";

      const query = userText.toLowerCase();
      if (query.includes('charge') || query.includes('fee') || query.includes('cost')) {
        botAnswer = "OPD Consultation fee ranges from ₹500 to ₹600. X-Ray Digital PA View is ₹450, CBC Blood Test is ₹350. Deluxe ward charges are ₹2,500/day, and Super Deluxe Suite is ₹4,500/day.";
      } else if (query.includes('doctor') || query.includes('timing') || query.includes('schedule')) {
        botAnswer = "Dr. Tushar Patel (Orthopedics) is available Mon-Sat (10 AM - 2 PM). Dr. Dipti Agarwal (Gynecology) is available Mon-Fri (11 AM - 5 PM). Dr. Rajesh Krishna (Cardiology) is available Mon-Sat (9 AM - 1 PM).";
      } else if (query.includes('emergency') || query.includes('phone') || query.includes('contact')) {
        botAnswer = "For immediate 24/7 Trauma Emergency & Ambulance assistance, please dial our emergency helpline: +91 98251 00000 or (0260) 264-9999.";
      } else if (query.includes('payment') || query.includes('upi') || query.includes('card')) {
        botAnswer = "At our Receptionist OPD Cash Desk, we accept Cash, UPI (PhonePe, Google Pay, Paytm via QR Code), Credit/Debit Cards, and Net Banking.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 800);
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
                className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-none font-semibold'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
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
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Thinking & retrieving hospital database...
            </div>
          )}
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
