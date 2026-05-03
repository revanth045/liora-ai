import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../auth/useSession';
import type { DemoRestaurant } from '../../demoDb';
import {
  ticketsCreate, ticketsList, ticketCategoryLabel, priorityTone, statusTone,
  type Ticket, type TicketCategory, type TicketPriority,
} from '../../lib/tickets';

const VENUE_CATEGORIES: TicketCategory[] = [
  'banking_payouts', 'billing', 'technical', 'feature_request', 'account', 'other',
];

const FAQS: Array<{ q: string; a: string }> = [
  { q: "How do I add or update my banking details for payouts?", a: "Once Liora's super-admin has activated your venue, your payout details are managed by Liora. Raise a ticket under 'Banking & payouts' with your bank name, account holder, account number and routing/IBAN — we'll update it within one business day." },
  { q: "When do I receive my money?", a: "Captured payments are batched and released to your account on the platform's payout schedule (default every 3 business days). You'll be notified by email after each payout." },
  { q: "How do I update my menu?", a: "Open Menu Studio. You can add, edit, disable or remove items. Changes are live to customers within seconds." },
  { q: "How do I onboard staff?", a: "In Venue Settings → Staff access, copy your staff code and share it with your team. They sign up at the staff login screen using that code." },
  { q: "Where do I see analytics?", a: "Open KPIs & Analytics for views, opens, favourites and orders broken down by day and time." },
  { q: "Customer disputes a charge — what now?", a: "Liora handles disputes. Raise a ticket with the order ID and a brief note — we'll mediate and notify you of the outcome." },
];

export default function RestoSupport({ restaurant }: { restaurant: DemoRestaurant }) {
  const session = useSession();
  const user = session?.user;
  const [tab, setTab] = useState<'help' | 'new' | 'mine'>('help');
  const [tick, setTick] = useState(0);

  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<TicketCategory>('banking_payouts');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Ticket | null>(null);

  const myTickets = useMemo(() => ticketsList({ scope: 'restaurant', venueId: restaurant.id }), [restaurant.id, tick]);

  useEffect(() => {
    const onTick = () => setTick(t => t + 1);
    window.addEventListener('liora:tickets-changed', onTick);
    return () => window.removeEventListener('liora:tickets-changed', onTick);
  }, []);

  const status = restaurant.status ?? 'active';
  const hasBanking = !!(restaurant.bankingDetails?.accountNumber || restaurant.bankingDetails?.iban);

  const submit = () => {
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const t = ticketsCreate({
        scope: 'restaurant',
        category,
        priority,
        subject: subject.trim(),
        body: body.trim(),
        fromUserId: user?.id,
        fromEmail: user?.email,
        fromName: user?.name,
        fromRole: 'restaurant_owner',
        venueId: restaurant.id,
        venueName: restaurant.name,
      });
      setSubmitted(t);
      setSubject(''); setBody('');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Hero with venue context */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-brand-900 text-white p-6 md:p-7 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300 mb-2">Venue support</p>
            <h2 className="font-display text-2xl md:text-3xl font-light">{restaurant.name}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                status === 'active' ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/30'
                : status === 'pending' ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-300/30'
                : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-300/30'
              }`}>{status}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${hasBanking ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
                Banking {hasBanking ? '✓ on file' : '⚠ missing'}
              </span>
            </div>
          </div>
          <div className="text-sm text-cream-100/85 leading-relaxed max-w-sm">
            Average reply time today: <strong className="text-amber-300">~2 hours</strong>. Urgent payout issues are escalated immediately.
          </div>
        </div>
        {status === 'pending' && (
          <p className="relative mt-4 text-xs text-amber-200">Your venue is awaiting admin approval. You won't appear to customers until it's approved — we'll email you the moment it is.</p>
        )}
        {status === 'blocked' && (
          <p className="relative mt-4 text-xs text-rose-200">Your venue is currently <strong>blocked</strong>{restaurant.blockedReason ? `: ${restaurant.blockedReason}` : ''}. Raise a ticket to discuss.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-stone-200 rounded-2xl p-1 max-w-md">
        {([
          { id: 'help', label: 'Help' },
          { id: 'new', label: 'New ticket' },
          { id: 'mine', label: `My tickets${myTickets.length ? ` (${myTickets.length})` : ''}` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${tab === t.id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>{t.label}</button>
        ))}
      </div>

      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl">✓</div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">Ticket #{submitted.id.slice(-6)} submitted.</p>
            <p className="text-xs text-emerald-700">Our partnerships team will reply shortly.</p>
          </div>
          <button onClick={() => { setSubmitted(null); setTab('mine'); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-emerald-800 border border-emerald-300 hover:bg-emerald-100">View</button>
        </div>
      )}

      {tab === 'help' && (
        <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
          {FAQS.map((f, i) => (
            <details key={i} className="group">
              <summary className="px-5 py-4 cursor-pointer flex items-center justify-between gap-3 text-sm font-semibold text-stone-900 hover:bg-stone-50">
                {f.q}
                <span className="text-xl text-brand-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-stone-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
          <div className="px-5 py-4 bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-stone-700">Need to talk to a human?</p>
            <button onClick={() => setTab('new')} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-stone-900 hover:bg-stone-800">Raise a ticket →</button>
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5 max-w-2xl">
          <div>
            <h3 className="font-display text-2xl text-stone-900">Raise a partner ticket</h3>
            <p className="text-sm text-stone-600 mt-1">Routed directly to Liora's partnerships and finance teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Category</span>
              <select value={category} onChange={e => setCategory(e.target.value as TicketCategory)} className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm">
                {VENUE_CATEGORIES.map(c => <option key={c} value={c}>{ticketCategoryLabel(c)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Priority</span>
              <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent — payouts/disputes</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Update banking details for Friday's payout" className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </label>

          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Details</span>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Include the relevant order/booking IDs, dates, screenshots and any error messages. For banking changes, include the account holder name and the new IBAN/account number." rows={6} className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </label>

          <div className="flex justify-end gap-3 pt-3">
            <button onClick={submit} disabled={submitting || !subject.trim() || !body.trim()} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Sending…' : 'Submit ticket'}
            </button>
          </div>
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {myTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
              <p className="font-display text-xl text-stone-700">No tickets yet</p>
              <p className="text-sm text-stone-500 mt-2">All your support requests will appear here with replies from our team.</p>
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
                        {r.authorRole === 'admin' ? 'Liora Partner Support' : r.authorName || r.authorRole}
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
}
