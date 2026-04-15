import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { View } from '../../../../types';

export const Checkout = ({ onNavigate }: { onNavigate: (tab: View) => void }) => {
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
  const [processing, setProcessing] = useState(false);

  // Mock Booking Data (Simulating a Hotel + Dinner bundle)
  const ORDER_DETAILS = {
    item: 'The Liora Grand',
    type: 'Hotel Stay â ¢ 2 Nights',
    dates: 'Feb 14 - Feb 16',
    guests: '2 Guests',
    price: 450,
    taxes: 45,
    fees: 25,
    addons: [
      { id: 1, name: 'Romance Package (Champagne)', price: 75, selected: true },
      { id: 2, name: 'Late Check-out', price: 40, selected: false },
    ]
  };

  const total = ORDER_DETAILS.price + ORDER_DETAILS.taxes + ORDER_DETAILS.fees + 75;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2500);
  };

  if (step === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cream-50 p-6 text-center animate-fade-in overflow-y-auto">
        <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center text-white mb-6 shadow-xl">
          <Icon name="check" size={48} />
        </div>
        <h1 className="font-lora text-4xl text-stone-800 mb-2 font-bold">You're All Set!</h1>
        <p className="text-stone-400 mb-8 font-medium">Booking #84920 confirmed. A receipt has been sent to your email.</p>
        
        {/* Digital Ticket */}
        <div className="bg-white p-0 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-cream-200 mb-12 transform hover:scale-[1.02] transition-transform duration-500">
          <div className="h-32 bg-cream-100 relative flex items-center justify-center">
            <div className="text-center z-10">
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Liora Experience Pass</p>
               <h3 className="font-lora text-2xl text-white font-bold tracking-tight">The Liora Grand</h3>
            </div>
            {/* Cutout circles */}
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-cream-50 rounded-full border border-cream-200 shadow-inner"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-cream-50 rounded-full border border-cream-200 shadow-inner"></div>
          </div>
          <div className="p-8 border-b border-dashed border-cream-200 relative bg-white">
            <div className="flex justify-between mb-8">
              <div className="text-left">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">Check In</p>
                <p className="font-bold text-stone-800 text-lg">Feb 14</p>
                <p className="text-xs text-stone-400 font-medium">3:00 PM</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">Check Out</p>
                <p className="font-bold text-stone-800 text-lg">Feb 16</p>
                <p className="text-xs text-stone-400 font-medium">11:00 AM</p>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-cream-50/50 rounded-2xl border border-cream-200/50">
                <Icon name="qr_code_2" size={120} className="text-[#18181b]" />
              </div>
            </div>
          </div>
          <div className="p-5 bg-cream-100/80 text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] text-center border-t border-cream-200/60">
            Show this at the front desk or host stand
          </div>
        </div>

        <button 
          onClick={() => onNavigate('home')}
          className="px-10 py-4 bg-white border border-cream-200 text-stone-800 rounded-2xl font-bold hover:bg-cream-100/80 transition-all shadow-md active:scale-95"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-cream-50 overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto p-6 grid lg:grid-cols-[1fr_380px] gap-8">
        
        {/* Left Column: Form */}
        <div className="space-y-6">
          <button onClick={() => onNavigate('hotels')} className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-800 uppercase tracking-widest transition-colors">
            <Icon name="arrow_back" size={14} /> Back to Discover
          </button>
          
          <h1 className="font-lora text-4xl text-stone-800 font-bold">Secure Booking</h1>

          {/* User Details */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-cream-200">
            <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-cream-50 rounded-xl"><Icon name="person" size={18} /></div>
              Guest Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">First Name</label>
                <input type="text" className="w-full p-4 bg-cream-50/50 rounded-2xl outline-none text-stone-800 font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-inner" defaultValue="Alex" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Last Name</label>
                <input type="text" className="w-full p-4 bg-cream-50/50 rounded-2xl outline-none text-stone-800 font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-inner" defaultValue="Rivera" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" className="w-full p-4 bg-cream-50/50 rounded-2xl outline-none text-stone-800 font-bold border border-transparent focus:border-cream-200/20 focus:bg-white transition-all shadow-inner" defaultValue="alex@example.com" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-cream-200">
            <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-cream-50 rounded-xl"><Icon name="credit_card" size={18} /></div>
              Payment Method
            </h3>
            
            <div className="flex gap-4 mb-6">
              <button className="flex-1 py-4 border-2 border-cream-200 bg-cream-50 text-stone-800 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95">
                <Icon name="apple" size={20} /> Pay
              </button>
              <button className="flex-1 py-4 border border-cream-200 text-stone-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-cream-50 transition-all active:scale-95">
                Credit Card
              </button>
            </div>

            <div className="p-5 border border-cream-200 rounded-2xl flex items-center justify-between bg-white/30">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-8 bg-cream-100 rounded-lg text-white text-[10px] flex items-center justify-center font-bold tracking-[0.2em] shadow-md">VISA</div>
                 <div>
                   <p className="text-sm font-bold text-stone-800">â ¢â ¢â ¢â ¢ 4242</p>
                   <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Expires 12/28</p>
                 </div>
               </div>
               <button className="text-xs font-bold text-brand-400 hover:underline uppercase tracking-widest">Change</button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-cream-200 sticky top-0">
            <h3 className="font-lora text-2xl text-stone-800 mb-6 font-bold">Summary</h3>
            
            <div className="flex gap-4 mb-8 pb-8 border-b border-cream-200">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                 <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover" alt="Hotel" />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-stone-800 truncate">{ORDER_DETAILS.item}</h4>
                <p className="text-xs text-stone-400 font-medium mt-0.5">{ORDER_DETAILS.type}</p>
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-2 bg-yellow-50 inline-block px-2 py-0.5 rounded">{ORDER_DETAILS.dates}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm mb-8">
              <div className="flex justify-between text-stone-400 font-medium">
                <span>Room Rate (2 nights)</span>
                <span className="text-stone-800 font-bold">${ORDER_DETAILS.price}</span>
              </div>
              <div className="flex justify-between text-stone-400 font-medium">
                <span>Taxes & Fees</span>
                <span className="text-stone-800 font-bold">${ORDER_DETAILS.taxes + ORDER_DETAILS.fees}</span>
              </div>
              
              {/* Addon */}
              <div className="flex justify-between text-stone-800 font-bold bg-cream-50 p-3 rounded-xl border border-cream-200/50">
                <span className="flex items-center gap-2"><Icon name="local_bar" size={14} className="text-brand-400" /> Romance Package</span>
                <span>$75</span>
              </div>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-cream-200 mb-8">
               <span className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">Total Due</span>
               <span className="text-4xl font-lora text-stone-800 font-bold">${total}</span>
            </div>

            <button 
              onClick={handlePay}
              disabled={processing}
              className="w-full py-5 bg-brand-500 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-yellow-900/10 hover:bg-brand-500 transition-all flex justify-center items-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Icon name="sync" size={20} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Confirm & Pay <Icon name="lock" size={20} />
                </>
              )}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Icon name="verified_user" size={14} className="text-green-600" />
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Secure SSL Encryption</p>
            </div>
          </div>

          {/* AI Upsell */}
          <div className="bg-cream-100 text-white p-6 rounded-[2rem] relative overflow-hidden flex items-start gap-4 shadow-lg group">
             <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform"><Icon name="auto_awesome" size={20} className="text-brand-400" /></div>
             <div className="relative z-10">
               <p className="font-bold text-sm mb-1 text-white">Liora Intelligence</p>
               <p className="text-xs text-white/80 leading-relaxed mb-4">You're arriving at 3 PM. Would you like me to book a table at the rooftop for sunset (5:30 PM)?</p>
               <button className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-cream-200 transition-colors active:scale-95">
                 + Add Reservation
               </button>
             </div>
             <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                <Icon name="restaurant_menu" size={140} />
             </div>
          </div>
        </div>

      </div>
      <div className="h-20" />
    </div>
  );
};
export default Checkout;
