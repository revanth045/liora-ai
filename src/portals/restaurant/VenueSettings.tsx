import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { db_getOrCreateStaffCode, db_upsertRestaurant, type DayHours, type DemoRestaurant } from '../../demoDb';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const DEFAULT_HOURS: DayHours[] = DAYS.map(() => ({ open: '11:00 AM', close: '10:00 PM', closed: false }));

function initHours(r: DemoRestaurant): DayHours[] {
  if (r.hours && r.hours.length === 7) return r.hours.map(h => ({ ...h }));
  return DEFAULT_HOURS.map(h => ({ ...h }));
}

export default function RestoVenueSettings({ restaurant }: { restaurant: DemoRestaurant }) {
  const [staffCode, setStaffCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState(restaurant.name ?? '');
  const [cuisine, setCuisine] = useState(restaurant.cuisine ?? '');
  const [bio, setBio] = useState(restaurant.bio ?? '');
  const [address, setAddress] = useState(restaurant.address ?? '');
  const [phone, setPhone] = useState(restaurant.phone ?? '');

  // Hours state
  const [hours, setHours] = useState<DayHours[]>(initHours(restaurant));

  useEffect(() => {
    setStaffCode(db_getOrCreateStaffCode(restaurant.id));
  }, [restaurant.id]);

  // Sync state when restaurant prop changes
  useEffect(() => {
    setName(restaurant.name ?? '');
    setCuisine(restaurant.cuisine ?? '');
    setBio(restaurant.bio ?? '');
    setAddress(restaurant.address ?? '');
    setPhone(restaurant.phone ?? '');
    setHours(initHours(restaurant));
  }, [restaurant.id]);

  const toggleDay = (i: number) => {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, closed: !h.closed } : h));
  };

  const setOpen = (i: number, val: string) => {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, open: val } : h));
  };

  const setClose = (i: number, val: string) => {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, close: val } : h));
  };

  const handleSave = () => {
    db_upsertRestaurant({ ...restaurant, name, cuisine, bio, address, phone, hours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDiscard = () => {
    setName(restaurant.name ?? '');
    setCuisine(restaurant.cuisine ?? '');
    setBio(restaurant.bio ?? '');
    setAddress(restaurant.address ?? '');
    setPhone(restaurant.phone ?? '');
    setHours(initHours(restaurant));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(staffCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-page-slide pb-24">

      {/* Profile Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
        <h3 className="font-lora text-2xl text-stone-800 mb-8 font-bold">Venue Profile</h3>

        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-32 h-32 bg-cream-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-cream-200 text-stone-400 hover:border-cream-200 hover:text-stone-800 cursor-pointer transition-all group flex-shrink-0 relative overflow-hidden">
            <div className="text-center z-10">
              <Icon name="camera_alt" size={32} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Logo</span>
            </div>
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Restaurant Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-4 bg-cream-50/50 rounded-2xl text-stone-800 outline-none font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Cuisine Type</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                  placeholder="e.g. Modern American, Bistroâ ¦"
                  className="w-full p-4 bg-cream-50/50 rounded-2xl text-stone-800 outline-none font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 000-0000"
                  className="w-full p-4 bg-cream-50/50 rounded-2xl text-stone-800 outline-none font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, City, State"
                  className="w-full p-4 bg-cream-50/50 rounded-2xl text-stone-800 outline-none font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Bio / Story</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell guests your storyâ ¦"
                className="w-full p-4 bg-cream-50/50 rounded-2xl text-stone-800 outline-none font-medium border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-sm min-h-[120px] resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hours & Operations */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-cream-200 bg-cream-100/50">
          <h3 className="font-lora text-2xl text-stone-800 font-bold">Hours & Operations</h3>
          <p className="text-stone-400 text-sm mt-1">Toggle a day off to mark it closed. Changes are saved with the Save button.</p>
        </div>
        <div className="p-6 space-y-2 bg-white/50">
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                hours[i].closed
                  ? 'opacity-50 bg-cream-50/30 border-transparent'
                  : 'hover:bg-white border-transparent hover:border-cream-200/40 group'
              }`}
            >
              <span className={`font-bold w-32 transition-colors ${hours[i].closed ? 'text-stone-400' : 'text-stone-800 group-hover:text-brand-400'}`}>
                {day}
              </span>
              <div className="flex items-center gap-4">
                {hours[i].closed ? (
                  <span className="text-xs font-bold text-stone-300 italic w-[13rem] text-center">Closed</span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={hours[i].open}
                      onChange={e => setOpen(i, e.target.value)}
                      className="p-2.5 bg-white border border-cream-200 rounded-xl text-xs font-bold text-center w-28 shadow-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                    <span className="text-stone-400 font-bold">â “</span>
                    <input
                      type="text"
                      value={hours[i].close}
                      onChange={e => setClose(i, e.target.value)}
                      className="p-2.5 bg-white border border-cream-200 rounded-xl text-xs font-bold text-center w-28 shadow-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleDay(i)}
                aria-label={hours[i].closed ? `Mark ${day} open` : `Mark ${day} closed`}
                className={`w-12 h-6 rounded-full relative transition-colors shadow-inner flex-shrink-0 ${!hours[i].closed ? 'bg-brand-400' : 'bg-cream-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${!hours[i].closed ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Access */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-cream-200 bg-cream-100/50">
          <h3 className="font-lora text-2xl text-stone-800 font-bold">Staff Access</h3>
          <p className="text-stone-500 text-sm mt-1">
            Share this code with your front-of-house staff so they can register for Service Desk access.
          </p>
        </div>
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Staff Access Code</p>
              <p className="font-mono text-4xl font-bold tracking-[0.3em] text-stone-800">{staffCode || '------'}</p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={copyCode}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white border-cream-200 text-stone-700 hover:bg-cream-50'
                }`}
              >
                <Icon name={copied ? 'check' : 'content_copy'} size={16} />
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Icon name="info" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold">How it works</p>
              <p className="mt-0.5">Staff members go to the restaurant login page, select <strong>Service Desk</strong>, choose <strong>Join with Code</strong>, and enter this code to link their account to your restaurant. They will only see order management â ” not financials or settings.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <button
          type="button"
          onClick={handleDiscard}
          className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-800 transition-colors active:scale-95"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={`px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
            saved ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-white hover:bg-stone-700'
          }`}
        >
          <Icon name={saved ? 'check_circle' : 'check'} size={16} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

    </div>
  );
}