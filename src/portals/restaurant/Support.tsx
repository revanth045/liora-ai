import React, { useState } from 'react';
import { classifyRestaurantSupportRequest } from '../../../services/geminiService';
import { RestaurantSupportRequestResult } from '../../../types';
import { Spinner } from '../../../components/Spinner';
import type { DemoRestaurant } from '../../demoDb';
import { useDynamicLoadingMessage } from '../../hooks/useDynamicLoadingMessage';
import { Icon } from '../../../components/Icon';

const supportLoadingMessages = [
  "Analyzing your request...",
  "Understanding the issue...",
  "Routing to the right department...",
  "Preparing a response...",
];

const FAQ_ITEMS = [
  { q: "How do I update my menu?",             a: "Navigate to the 'Menu Studio' tab. From there, you can add new items using the form, or edit, disable, or delete existing items from your current menu list." },
  { q: "How does the AI Marketing Studio work?", a: "In the 'Marketing Studio', you can describe a promotion or dish. Our AI will generate professional ad copy and social media posts. You can also generate a placeholder image to go with your campaign." },
  { q: "Where can I see my analytics?",        a: "The 'KPIs & Analytics' tab shows you key metrics like how many users have viewed your restaurant, opened your menu, or saved you as a favorite within the Liora app." },
  { q: "How do I update my billing information?", a: "Currently, billing is managed through your account settings. For specific invoice questions, please submit a support ticket with the 'Billing Inquiry' category." },
  { q: "Can I add multiple staff members?",    a: "Yes! Head to 'Staff & Scheduling' to add team members, set their roles, and manage shift coverage. Each staff member gets a unique PIN for order management." },
  { q: "How do QR codes work?",               a: "The QR Codes section lets you generate custom QR codes for each table. Customers scan the code and get a digital menu where they can place orders directly." },
];

const SUPPORT_CATEGORIES = [
  { id: 'billing',   label: 'Billing',         icon: 'attach_money',    idle: 'bg-green-50 text-green-700 border-green-100',     active: 'bg-green-600 text-white border-green-600'   },
  { id: 'technical', label: 'Technical',       icon: 'build',           idle: 'bg-blue-50 text-blue-700 border-blue-100',       active: 'bg-blue-600 text-white border-blue-600'     },
  { id: 'feature',   label: 'Feature Request', icon: 'lightbulb',       idle: 'bg-amber-50 text-amber-700 border-amber-100',    active: 'bg-amber-600 text-white border-amber-600'   },
  { id: 'account',   label: 'Account',         icon: 'manage_accounts', idle: 'bg-purple-50 text-purple-700 border-purple-100', active: 'bg-purple-600 text-white border-purple-600' },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${open ? 'border-amber-200 shadow-md bg-amber-50/30' : 'border-cream-200 hover:border-stone-200 hover:shadow-sm bg-white'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-6 py-4 text-left"
      >
        <span className="font-semibold text-stone-800 text-sm pr-4">{q}</span>
        <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${open ? 'bg-amber-500 text-white rotate-45' : 'bg-stone-100 text-stone-500'}`}>
          <Icon name="add" size={14} />
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 animate-fade-in">
          <p className="text-stone-500 text-sm leading-relaxed border-t border-amber-100 pt-4">{a}</p>
        </div>
      )}
    </div>
  );
};

export default function RestoSupport({ restaurant }: { restaurant: DemoRestaurant }) {
  const [request, setRequest] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [result, setResult] = useState<RestaurantSupportRequestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadingMessage = useDynamicLoadingMessage(isLoading, supportLoadingMessages);

  const handleSubmit = async () => {
    if (!request.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsedResult = await classifyRestaurantSupportRequest(request);
      setResult(parsedResult);
    } catch (err) {
      let message = 'An unexpected error occurred. Please check your connection and try again.';
      if (err instanceof Error && err.message === 'Invalid JSON from model') {
        message = "I'm having trouble categorizing that. Could you be more specific? For example: 'I need to update my bank details for payouts' or 'The video generator in the Menu Studio is not working'.";
      }
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-[2rem] p-6 flex items-center gap-5 card-lift animate-slide-up stagger-1">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
          <Icon name="check_circle" size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-stone-800 text-sm">All Systems Operational</h3>
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-stone-400 text-xs">Orders, Menu Studio, Analytics, and AI services are running normally. Avg response time: <strong className="text-stone-600">1.2s</strong></p>
        </div>
        <a href="#" className="flex-shrink-0 text-xs font-bold text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors hidden sm:block">
          Status page →
        </a>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-5 gap-8">

        {/* Ticket Form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm p-8 animate-slide-up stagger-2">

            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 bg-stone-900 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                <Icon name="support_agent" size={20} />
              </div>
              <div>
                <h3 className="font-lora text-xl font-bold text-stone-800">Submit a Ticket</h3>
                <p className="text-stone-400 text-xs mt-0.5">AI-powered routing · Usually responds in seconds</p>
              </div>
            </div>

            {/* Category Pills */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(prev => prev === c.id ? null : c.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all duration-150 active:scale-95 ${
                      category === c.id ? c.active : c.idle + ' hover:shadow-sm hover:scale-[1.02]'
                    }`}
                  >
                    <Icon name={c.icon} size={12} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Describe Your Issue</p>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="e.g., 'I have a question about my last invoice.' or 'I'm having trouble uploading a new menu photo.'"
                  className="w-full h-28 px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300 transition-all duration-200 resize-none bg-cream-50/50 hover:bg-white text-stone-800 text-sm placeholder-stone-300"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !request.trim()}
                className="w-full flex justify-center items-center gap-2.5 bg-stone-900 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-stone-800 transition-all duration-200 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.99] text-sm"
              >
                {isLoading
                  ? <><Spinner /><span className="ml-2">{loadingMessage}</span></>
                  : <><Icon name="send" size={16} /><span>Submit Request</span></>
                }
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-6 pt-6 border-t border-dashed border-cream-200 space-y-4 animate-fade-in">
                <div className="p-5 bg-cream-50 border border-cream-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                      <Icon name="smart_toy" size={15} />
                    </div>
                    <h4 className="font-bold text-stone-800 text-sm">Liora's Response</h4>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed">{result.response_text}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Ticket Summary (for our team)</p>
                  <pre className="p-4 bg-stone-900 text-green-400 rounded-2xl text-xs overflow-x-auto leading-relaxed">
                    {JSON.stringify(result.action_json, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-5">

          {/* Contact Options */}
          <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm p-6 animate-slide-up stagger-3">
            <h4 className="font-lora text-base font-bold text-stone-800 mb-4">Contact Us</h4>
            <div className="space-y-2">
              {[
                { icon: 'mail',  label: 'Email Support', sub: 'hello@liora.app',   color: 'bg-blue-50 text-blue-600'   },
                { icon: 'phone', label: 'Phone Line',    sub: '+1 (888) 547-6720', color: 'bg-green-50 text-green-600' },
                { icon: 'chat',  label: 'Live Chat',     sub: 'Mon–Fri, 9am–6pm',  color: 'bg-purple-50 text-purple-600'},
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-cream-50 transition-all duration-150 cursor-pointer group border border-transparent hover:border-cream-200 hover:shadow-sm"
                >
                  <div className={`p-2.5 rounded-xl ${c.color} flex-shrink-0 group-hover:scale-110 transition-transform duration-150`}>
                    <Icon name={c.icon} size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">{c.label}</p>
                    <p className="text-xs text-stone-400">{c.sub}</p>
                  </div>
                  <Icon name="chevron_right" size={16} className="text-stone-300 ml-auto group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Stats */}
          <div className="bg-stone-900 rounded-[2rem] p-6 text-white relative overflow-hidden group card-lift animate-slide-up stagger-4">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Resolution Time</p>
            <p className="text-4xl font-lora font-bold mb-1">4.2h</p>
            <p className="text-white/40 text-xs mb-5">Top 5% of all platforms</p>
            <div className="flex gap-2">
              {[['P1', '1h', 'bg-red-400/30'], ['P2', '4h', 'bg-amber-400/30'], ['P3', '24h', 'bg-stone-600']].map(([p, t, bg], i) => (
                <div key={i} className={`flex-1 ${bg} rounded-xl p-2.5 text-center hover:brightness-110 transition-all`}>
                  <p className="text-[9px] text-white/50 font-bold uppercase">{p}</p>
                  <p className="text-sm font-bold">{t}</p>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-white/8 transition-colors pointer-events-none">
              <Icon name="support_agent" size={100} />
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm p-5 animate-slide-up stagger-5">
            <h4 className="font-bold text-stone-500 text-[10px] uppercase tracking-widest mb-3">Quick Links</h4>
            <div className="space-y-1">
              {[
                { label: 'Getting Started Guide', icon: 'rocket_launch' },
                { label: 'Video Tutorials',       icon: 'play_circle'   },
                { label: 'API Documentation',     icon: 'code'          },
                { label: 'Community Forum',       icon: 'forum'         },
              ].map((l, i) => (
                <button key={i} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-50 transition-colors group text-left">
                  <Icon name={l.icon} size={15} className="text-stone-400 group-hover:text-amber-600 transition-colors" />
                  <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900 transition-colors">{l.label}</span>
                  <Icon name="arrow_forward" size={13} className="text-stone-200 group-hover:text-stone-400 ml-auto transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm p-8 animate-slide-up stagger-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <Icon name="help" size={20} />
          </div>
          <div>
            <h3 className="font-lora text-xl font-bold text-stone-800">Frequently Asked Questions</h3>
            <p className="text-stone-400 text-xs mt-0.5">{FAQ_ITEMS.length} articles available</p>
          </div>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
