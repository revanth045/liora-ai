
import React, { useState } from 'react';
import { Icon } from './Icon';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // In a real app, this would send data to your backend/analytics
    console.log({ rating, category, comment, date: new Date() });
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setRating(0);
      setComment('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-cream-200">
        
        {/* Header */}
        <div className="bg-cream-50 p-4 flex justify-between items-center border-b border-cream-200">
          <h3 className="font-lora font-bold text-lg text-stone-800 flex items-center gap-2">
            <Icon name="chat_bubble" size={18} /> Help Shape Liora
          </h3>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-800">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8 animate-page-slide">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} />
              </div>
              <h4 className="text-xl font-lora font-bold text-stone-800">Thank You!</h4>
              <p className="text-stone-600 mt-2">Your feedback helps us create a better dining experience.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Rating */}
              <div className="text-center">
                <p className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">How is your experience?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`transition-transform hover:scale-110 ${rating >= star ? 'text-brand-400' : 'text-stone-600'}`}
                    >
                      <Icon name={rating >= star ? 'star-solid' : 'star'} size={32} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Topic</label>
                <div className="grid grid-cols-3 gap-2">
                  {['General', 'Bug', 'Feature'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat.toLowerCase())}
                      className={`py-2 text-sm rounded-lg border font-bold transition-all ${
                        category === cat.toLowerCase()
                          ? 'bg-brand-400 text-white border-brand-400 shadow-md'
                          : 'bg-white text-stone-600 border-cream-200 hover:border-brand-400/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Your Thoughts</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you love or what we can improve..."
                  className="w-full p-4 bg-cream-50/50 rounded-2xl border-none text-stone-800 placeholder-gray-400 focus:ring-1 focus:ring-brand-400/30 min-h-[100px] text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full py-4 bg-brand-400 text-white rounded-xl font-bold disabled:opacity-50 disabled:bg-cream-200/60 hover:bg-cream-200 transition-all shadow-lg active:scale-95"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
