import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BotFaqItem } from '../types';
import { useNotificationToast } from '../context/NotificationToastContext';
import { 
  Bot, Plus, Search, Edit3, Trash2, CheckCircle2, XCircle, Sparkles, 
  Tag, MessageSquare, HelpCircle, Layers, RefreshCw, Send, Eye, ToggleLeft, ToggleRight, Info
} from 'lucide-react';

export const BotFaqManagerSection: React.FC = () => {
  const [faqs, setFaqs] = useState<BotFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { showToast } = useNotificationToast();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<BotFaqItem | null>(null);

  // Form Fields
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [category, setCategory] = useState<'OPD & Timings' | 'Billing & Insurance' | 'Emergency & Care' | 'Facilities & Admission' | 'General Info'>('OPD & Timings');
  const [isActive, setIsActive] = useState(true);

  // Bot Simulator State
  const [simQuery, setSimQuery] = useState('');
  const [simResponse, setSimResponse] = useState<string | null>(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await api.getBotFaqs();
      setFaqs(data);
    } catch (err) {
      showToast('Error', 'Failed to load bot FAQs knowledge base', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setKeywordsInput('');
    setCategory('OPD & Timings');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: BotFaqItem) => {
    setEditingFaq(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setKeywordsInput(item.keywords ? item.keywords.join(', ') : '');
    setCategory(item.category);
    setIsActive(item.is_active);
    setModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      showToast('Incomplete Form', 'Question and Answer fields are required.', 'warning');
      return;
    }

    const keywordsList = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      if (editingFaq) {
        const updatedItem: BotFaqItem = {
          ...editingFaq,
          question: question.trim(),
          answer: answer.trim(),
          keywords: keywordsList,
          category,
          is_active: isActive
        };
        await api.updateBotFaq(updatedItem);
        showToast('Success', 'Bot Q&A rule updated successfully.', 'success');
      } else {
        await api.addBotFaq({
          question: question.trim(),
          answer: answer.trim(),
          keywords: keywordsList,
          category,
          is_active: isActive
        });
        showToast('Created', 'New fixed Bot Q&A rule added to live AI Assistant.', 'success');
      }

      setModalOpen(false);
      loadFaqs();
    } catch (err) {
      showToast('Save Failed', 'Failed to save Bot Q&A rule.', 'warning');
    }
  };

  const handleDeleteFaq = async (id: string, qText: string) => {
    if (window.confirm(`Are you sure you want to delete this Bot Q&A rule?\n\n"${qText}"`)) {
      try {
        await api.deleteBotFaq(id);
        showToast('Deleted', 'Bot Q&A rule removed from knowledge base.', 'info');
        loadFaqs();
      } catch (err) {
        showToast('Error', 'Failed to delete Q&A item.', 'warning');
      }
    }
  };

  const handleToggleActive = async (item: BotFaqItem) => {
    try {
      const updated = { ...item, is_active: !item.is_active };
      await api.updateBotFaq(updated);
      setFaqs(prev => prev.map(f => f.id === item.id ? updated : f));
      showToast(
        updated.is_active ? 'Q&A Enabled' : 'Q&A Disabled',
        `Rule is now ${updated.is_active ? 'ACTIVE' : 'DISABLED'} on Chatbot.`,
        'info'
      );
    } catch (err) {
      showToast('Error', 'Failed to toggle status.', 'warning');
    }
  };

  const handleTestSimulator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    const query = simQuery.toLowerCase().trim();
    // Match against active FAQs
    const activeFaqs = faqs.filter(f => f.is_active);
    
    let matched = activeFaqs.find(f => 
      f.question.toLowerCase().includes(query) || query.includes(f.question.toLowerCase())
    );

    if (!matched) {
      matched = activeFaqs.find(f => 
        f.keywords && f.keywords.some(kw => kw.trim().length > 2 && query.includes(kw.toLowerCase().trim()))
      );
    }

    if (matched) {
      setSimResponse(`📌 **Matched Rule:** "${matched.question}" [${matched.category}]\n\n${matched.answer}`);
    } else {
      setSimResponse(`⚠️ No specific fixed Q&A keyword matched for "${simQuery}". The bot will default to general hospital info or live doctor status lookup.`);
    }
  };

  const filteredFaqs = faqs.filter(f => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch = 
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.keywords && f.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'OPD & Timings', 'Billing & Insurance', 'Emergency & Care', 'Facilities & Admission', 'General Info'];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Desk Chatbot Knowledge Base</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Fixed Q&A Bot Rules Manager
            </h2>
            <p className="text-xs md:text-sm text-teal-100/80 leading-relaxed">
              Configure exact fixed responses for patient queries on the 24/7 Front-end AI Assistant. Add, modify, or delete questions, trigger keywords, and answers live.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fixed Q&A Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK BOT SIMULATOR / TEST DESK */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
          <Bot className="w-4 h-4 text-emerald-600" />
          <span>Live Chatbot Response Simulator</span>
          <span className="text-[10px] text-slate-400 font-normal">(Test how the bot answers user questions)</span>
        </div>

        <form onSubmit={handleTestSimulator} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a test patient question (e.g., 'What are visiting hours?' or 'accepted insurance')..."
            value={simQuery}
            onChange={(e) => setSimQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Match</span>
          </button>
        </form>

        {simResponse && (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs whitespace-pre-line border border-slate-800 relative">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold mb-1">Simulator Bot Output:</div>
            {simResponse}
          </div>
        )}
      </div>

      {/* SEARCH AND CATEGORY FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions, answers, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Q&A RULES LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-bold">Loading Chatbot Q&A Rules...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-800">No Bot Q&A Rules Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No questions match your current search or category filter. Click "Add Fixed Q&A Rule" above to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                faq.is_active ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold flex items-center gap-1 border border-slate-200">
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>{faq.category}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1" title="Patient clicks count">
                      <Eye className="w-3 h-3 text-slate-400" /> {faq.click_count || 0} hits
                    </span>

                    <button
                      onClick={() => handleToggleActive(faq)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                        faq.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {faq.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      <span>{faq.is_active ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-start gap-2 leading-snug">
                    <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </h4>
                </div>

                {/* Answer */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    Bot Response:
                  </span>
                  {faq.answer}
                </div>

                {/* Trigger Keywords */}
                {faq.keywords && faq.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-400 font-semibold mr-1">Trigger Keywords:</span>
                    {faq.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  ID: <code className="font-mono">{faq.id}</code>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(faq)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq.id, faq.question)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingFaq ? 'Edit Fixed Q&A Rule' : 'Create New Fixed Q&A Rule'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define the question, exact answer, and trigger keywords for the AI Assistant.
                  </p>
                </div>
              </div>

              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="OPD & Timings">OPD & Timings</option>
                  <option value="Billing & Insurance">Billing & Insurance</option>
                  <option value="Emergency & Care">Emergency & Care</option>
                  <option value="Facilities & Admission">Facilities & Admission</option>
                  <option value="General Info">General Info</option>
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Question Prompt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. What are the OPD consultation timings?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Fixed Bot Answer / Response <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Type the exact response the bot should provide when patients ask this question..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 leading-relaxed"
                  required
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Trigger Keywords (Comma Separated)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Helps bot match variations</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. opd, timing, hours, open, schedule"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Active Status</span>
                  <span className="text-[10px] text-slate-500">Enable to show immediately on front-end chatbot</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{isActive ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingFaq ? 'Save Changes' : 'Create Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
