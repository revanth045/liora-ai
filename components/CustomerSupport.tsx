import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '../src/auth/useSession';
import {
  ticketsCreate, ticketsList, ticketCategoryLabel, priorityTone, statusTone,
  type Ticket, type TicketCategory, type TicketPriority,
} from '../src/lib/tickets';
import { db_listAllOrders } from '../src/demoDb';

const CONSUMER_CATEGORIES: TicketCategory[] = [
  'order_issue', 'food_quality', 'delivery', 'payment_issue', 'booking_issue', 'account', 'technical', 'other',
];

const FAQS: Record<string, Array<{ q: string; a: string }>> = {
  Orders: [
    { q: "Where is my order?", a: "Check the Orders tab — every order shows a live status. If it's stuck on 'preparing' for more than 30 minutes, raise a ticket below and we'll chase the kitchen." },
    { q: "I received the wrong dish or it was cold", a: "Raise a ticket under Food Quality with your order ID. Liora will work with the venue to issue a replacement, refund or credit on your next order." },
    { q: "How do I cancel an order?", a: "If the kitchen hasn't started preparing it, you can cancel from the Orders tab. Once preparation begins, raise a ticket and we'll mediate." },
    { q: "Can I change a tip after the fact?", a: "Yes — open the order in your Orders tab and tap Adjust tip within 24 hours of completion." },
  ],
  Bookings: [
    { q: "How do I modify a hotel stay?", a: "Open Hotels → Your stays. Tap the booking and choose 'Modify' to change dates or room. Changes within 48 hours of check-in require a support ticket." },
    { q: "What's the cancellation policy?", a: "It varies by hotel — the policy is shown on every booking confirmation. Most allow free cancellation up to 48 hours before check-in." },
    { q: "I never received my booking confirmation", a: "Confirmations show in Activity in your Profile. If it's missing, open a Booking issue ticket and we'll resend it." },
  ],
  Account: [
    { q: "How do I update my preferences?", a: "Go to Profile → Preferences. You can edit your diet, allergens, budget, vibe and AI tone there." },
    { q: "How do I change my password?", a: "Profile → Account → Change password." },
    { q: "Can I delete my account?", a: "Yes — raise a ticket under Account and we'll permanently remove your data within 7 days as per our privacy policy." },
  ],
  Payment: [
    { q: "I was charged twice", a: "Raise a Payment issue ticket with the order ID — duplicate charges are auto-refunded within 3 business days." },
    { q: "Which cards do you accept?", a: "All major credit and debit cards. Apple Pay and Google Pay are supported on mobile." },
    { q: "How do refunds work?", a: "Refunds return to the original card within 5–10 business days, depending on your bank." },
  ],
};

export const CustomerSupport: React.FC = () => {
  const session = useSession();
  const user = session?.user;
  const [tab, setTab] = useState<'help' | 'new' | 'mine'>('help');
  const [faqGroup, setFaqGroup] = useState<keyof typeof FAQS>('Orders');
  const [refreshTick, setRefreshTick] = useState(0);

  // New ticket form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<TicketCategory>('order_issue');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Ticket | null>(null);

  const myTickets = useMemo(() => {
    if (!user) return [] as Ticket[];
    return ticketsList({ scope: 'consumer', userId: user.id });
  }, [user, refreshTick]);

  const myOrders = useMemo(() => {
    if (!user?.email) return [];
    return db_listAllOrders().filter(o => o.customerEmail === user.email).slice(0, 10);
  }, [user]);

  useEffect(() => {
    const onTick = () => setRefreshTick(t => t + 1);
    window.addEventListener('liora:tickets-changed', onTick);
    return () => window.removeEventListener('liora:tickets-changed', onTick);
  }, []);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const t = ticketsCreate({
        scope: 'consumer',
        category,
        priority,
        subject: subject.trim(),
        body: body.trim(),
        fromUserId: user?.id,
        fromEmail: user?.email,
        fromName: user?.name,
        fromRole: user?.role,
        orderId: orderId.trim() || undefined,
      });
      setSubmitted(t);
      setSubject(''); setBody(''); setOrderId('');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-emerald-200 p-8 md:p-10 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-3xl text-emerald-600">✓</div>
        <div>
          <h3 className="font-display text-2xl text-stone-900">We've got your ticket.</h3>
          <p className="text-sm text-stone-600 mt-2">Reference <span className="font-mono font-semibold text-stone-900">#{submitted.id}</span> · usually replied within 4 business hours.</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 text-left">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">{ticketCategoryLabel(submitted.category)} · {submitted.priority}</p>
          <p className="font-semibold text-stone-900 mt-1">{submitted.subject}</p>
        </div>
        <div className="flex justify-center gap-3 flex-wrap pt-2">
          <button onClick={() => { setSubmitted(null); setTab('mine'); }} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800">View my tickets</button>
          <button onClick={() => setSubmitted(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 border border-stone-300 hover:bg-stone-100">Back to help</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Hero */}
      <header className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-rose-900 text-white p-7 md:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300 mb-3">We're here to help</p>
          <h2 className="font-display text-3xl md:text-5xl font-extralight tracking-tight leading-tight">
            {user ? <>Hi {user.name?.split(' ')[0] || 'there'}, what's on your mind?</> : <>How can we help?</>}
          </h2>
          <p className="text-cream-100/85 text-sm mt-3 max-w-xl font-light">
            Search our help articles, raise a ticket with our team or check the status of an existing one. Average reply time today: <strong className="text-amber-300">~4 hours</strong>.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-stone-200 rounded-2xl p-1 max-w-md">
        {([
          { id: 'help', label: 'Help articles' },
          { id: 'new', label: 'Raise a ticket' },
          { id: 'mine', label: `My tickets${myTickets.length ? ` (${myTickets.length})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${tab === t.id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'help' && (
        <div className="space-y-5">
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(FAQS) as Array<keyof typeof FAQS>).map(g => (
              <button
                key={g}
                onClick={() => setFaqGroup(g)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${faqGroup === g ? 'bg-rose-500 text-white' : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'}`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
            {FAQS[faqGroup].map((f, i) => (
              <details key={i} className="group">
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between gap-3 text-sm font-semibold text-stone-900 hover:bg-stone-50">
                  {f.q}
                  <span className="text-xl text-rose-500 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-stone-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-stone-700">Didn't find your answer?</p>
            <button onClick={() => setTab('new')} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800">Raise a ticket →</button>
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 space-y-5 max-w-2xl">
          <div>
            <h3 className="font-display text-2xl text-stone-900">Raise a new ticket</h3>
            <p className="text-sm text-stone-600 mt-1">A real person from our team will reply{user?.email ? ` to ${user.email}` : ''}.</p>
          </div>

          {!user && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              You're not signed in. Sign in first so we can match the ticket to your account.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Category</span>
              <select value={category} onChange={e => setCategory(e.target.value as TicketCategory)} className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm">
                {CONSUMER_CATEGORIES.map(c => <option key={c} value={c}>{ticketCategoryLabel(c)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Priority</span>
              <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="One line — e.g. Order #1234 missing dessert" className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </label>

          {(category === 'order_issue' || category === 'food_quality' || category === 'delivery' || category === 'payment_issue') && (
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Order ID (optional)</span>
              <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Pick one or paste the ID" className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm" list="my-orders" />
              {myOrders.length > 0 && (
                <datalist id="my-orders">
                  {myOrders.map(o => <option key={o.id} value={o.id}>{`#${o.id.slice(-6)} · $${(o.totalCents/100).toFixed(2)}`}</option>)}
                </datalist>
              )}
            </label>
          )}

          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Tell us what happened</span>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Be as specific as possible — dates, times, dish names, screenshots will help us help you faster." rows={6} className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </label>

          <div className="flex justify-end gap-3 pt-3">
            <button onClick={submit} disabled={submitting || !subject.trim() || !body.trim()} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Sending…' : 'Submit ticket'}
            </button>
          </div>
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-4">
          {!user ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
              Sign in to see your tickets.
            </div>
          ) : myTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
              <p className="font-display text-xl text-stone-700">No tickets yet</p>
              <p className="text-sm text-stone-500 mt-2">When you raise a ticket it'll show up here so you can track replies.</p>
              <button onClick={() => setTab('new')} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800">Raise your first ticket</button>
            </div>
          ) : (
            myTickets.map(t => (
              <details key={t.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer flex items-center gap-3 hover:bg-stone-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusTone(t.status)}`}>{t.status.replace('_', ' ')}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityTone(t.priority)}`}>{t.priority}</span>
                      <span className="text-[11px] text-stone-400">#{t.id.slice(-6)}</span>
                    </div>
                    <p className="font-semibold text-stone-900 truncate">{t.subject}</p>
                    <p className="text-xs text-stone-500">{ticketCategoryLabel(t.category)} · {new Date(t.updatedAt).toLocaleString()}{t.replies.length ? ` · ${t.replies.length} reply` : ''}</p>
                  </div>
                </summary>
                <div className="px-5 pb-5 space-y-3 border-t border-stone-100 pt-4">
                  <div className="bg-stone-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">You</p>
                    <p className="text-sm text-stone-800 whitespace-pre-wrap">{t.body}</p>
                  </div>
                  {t.replies.map(r => (
                    <div key={r.id} className={`rounded-xl p-3 ${r.authorRole === 'admin' ? 'bg-rose-50 border border-rose-100' : 'bg-stone-50'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                        {r.authorRole === 'admin' ? 'Liora Support' : r.authorName || r.authorRole}
                      </p>
                      <p className="text-sm text-stone-800 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      )}
    </div>
  );
};
