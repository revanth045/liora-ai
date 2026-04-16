import React, { useState } from 'react';
import { Icon } from '../../../components/Icon';
import type { DemoRestaurant } from '../../demoDb';

const SUGGESTED_QUERIES = [
  "Why was my labor cost high yesterday?",
  "Create a special using surplus inventory.",
  "Draft a reply to the negative review from Table 4.",
  "Predict sales for the upcoming rainy weekend."
];

export default function RestoAiConsultant({ restaurant }: { restaurant: DemoRestaurant }) {
  const [messages, setMessages] = useState<any[]>([
    { 
      role: 'ai', 
      content: `Hello Chef. I've analyzed your dashboard for ${restaurant.name}. Your food cost variance is up 4% due to the Wagyu price increase, but your customer retention is at an all-time high. How can I help you optimize today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;

    // Add User Message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI "Thinking" and responding based on context
    setTimeout(() => {
      let response = "I can certainly look into that for you.";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('labor')) {
        response = "Your labor cost hit **28%** yesterday (Target: 22%). This was caused by 2 servers staying 2 hours past cut-time during the slow period between 3 PM - 5 PM. I recommend adjusting the schedule for next Tuesday to trim 1.5 hours from the swing shift.";
      } else if (lowerText.includes('surplus') || lowerText.includes('inventory')) {
        response = "You currently have **excess Heirloom Tomatoes** (15kg) expiring in 3 days. \n\n**Suggestion:** Run a 'Caprese Bruschetta' lunch special at $14. I can generate a marketing email for this campaign in the Marketing Studio right now.";
      } else if (lowerText.includes('sales') || lowerText.includes('rainy')) {
        response = "With rain projected for Saturday, I predict a **15% dip in patio covers** but a **22% increase in takeout volume**. Make sure your delivery packaging stock is up and consider adding an 'Indoor Cozy Special' to drive foot traffic.";
      } else {
        response = "I've updated your business projections based on that input. Is there anything else you'd like me to analyze regarding your menu performance or team efficiency?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col animate-page-slide pb-4">
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-yellow-900/10 border-2 border-white">
          <Icon name="smart_toy" size={24} />
        </div>
        <div>
          <h2 className="font-lora text-2xl font-bold text-stone-800">Liora Business Consultant</h2>
          <p className="text-sm text-stone-400 font-medium">Your 24/7 AI Operational Analyst</p>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white border border-cream-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/30 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'ai' ? 'bg-cream-100 text-white' : 'bg-cream-200/60 text-stone-800'}`}>
                <Icon name={msg.role === 'ai' ? 'smart_toy' : 'person'} size={18} />
              </div>
              <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                msg.role === 'ai' 
                  ? 'bg-white border-cream-200 text-stone-800 rounded-tl-none' 
                  : 'bg-stone-800 text-white border-stone-800 rounded-tr-none'
              }`}>
                <div dangerouslySetInnerHTML={{ 
                  __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-9 h-9 bg-cream-100 rounded-full flex items-center justify-center text-white shadow-sm"><Icon name="more_horiz" size={18} /></div>
              <div className="bg-white border border-cream-200 px-5 py-4 rounded-3xl rounded-tl-none text-xs text-stone-400 italic shadow-sm">
                Liora is analyzing live data...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-5 bg-white border-t border-cream-200">
          {/* Suggestions */}
          {messages.length < 5 && (
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(q)}
                  className="flex-shrink-0 px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-xs font-bold text-stone-800 hover:border-[#e9ae1e] hover:bg-white transition-all whitespace-nowrap shadow-sm active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          
          <div className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about sales, inventory, or staff..."
              className="w-full p-4.5 pr-14 bg-white border border-cream-200 rounded-2xl outline-none text-stone-800 placeholder-stone-400 focus:ring-1 focus:ring-brand-400 transition-all font-medium shadow-inner"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="absolute right-2.5 top-2.5 p-2.5 bg-stone-800 text-white rounded-xl disabled:opacity-30 hover:bg-stone-900 transition-all active:scale-90 shadow-md"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-stone-400 mt-3 font-bold uppercase tracking-widest opacity-60">Liora Operational Intelligence Engine</p>
        </div>
      </div>
    </div>
  );
}