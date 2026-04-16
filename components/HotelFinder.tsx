
import React from 'react';
import { Icon } from './Icon';
import { SmartImage } from './SmartImage';

export const HotelFinder = () => {
  const content = {
    header: {
        title: "Romantic Getaways",
        description: "Curated stays for special moments."
    },
    filters: ["With bathtub", "Suite", "View", "Same-day", "Special occasions"],
    featuredHotel: {
        name: "The Liora Grand",
        city: "New York, NY",
        rating: 4.9,
        tagline: "Luxury awaits in the heart of the city.",
        imageUrl: "https://image.pollinations.ai/prompt/luxury%20hotel%20bedroom%20romantic%20lighting?width=600&height=400&nologo=true",
    },
    hotelList: [
        { name: "Cozy Cabin", city: "Upstate NY", rating: 4.7, tags: ["Secluded", "Fireplace"] },
        { name: "Seaside Inn", city: "Montauk, NY", rating: 4.6, tags: ["Ocean View", "Spa"] },
        { name: "Urban Loft", city: "Brooklyn, NY", rating: 4.8, tags: ["Modern", "Rooftop"] }
    ],
    safetyNote: "Liora encourages respectful and safe experiences. Please verify hotel policies and reviews before booking."
  };

  return (
    <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
            <h2 className="text-2xl font-lora font-bold text-stone-800">{content.header.title}</h2>
            <p className="text-stone-400">{content.header.description}</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {content.filters.map((filter, idx) => (
                <button key={idx} className="px-4 py-1.5 rounded-full bg-white border border-cream-200 text-sm text-stone-400 whitespace-nowrap hover:border-brand-400 hover:text-brand-400 transition-colors shadow-sm">
                    {filter}
                </button>
            ))}
        </div>

        {/* Featured Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden group">
            <div className="h-48 relative overflow-hidden">
                <SmartImage src={content.featuredHotel.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 right-4 bg-white/90 px-2 py-1 rounded-lg text-xs font-bold text-stone-800 flex items-center gap-1 shadow-sm">
                    <Icon name="star-solid" className="w-3 h-3 text-brand-400" /> {content.featuredHotel.rating}
                </div>
            </div>
            <div className="p-5">
                <h3 className="text-xl font-bold text-stone-800">{content.featuredHotel.name}</h3>
                <p className="text-sm text-stone-400 mb-2">{content.featuredHotel.city}</p>
                <p className="text-sm text-stone-800 mb-4 italic">"{content.featuredHotel.tagline}"</p>
                <div className="flex gap-3">
                    <button className="flex-1 bg-brand-400 text-white py-2 rounded-xl font-bold text-sm hover:bg-cream-200 transition-colors shadow-md">View Details</button>
                    <button className="flex-1 bg-white border border-cream-200 text-stone-800 py-2 rounded-xl font-bold text-sm hover:bg-cream-100/80 transition-colors">Booking Page</button>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="space-y-3">
            <h3 className="font-bold text-stone-800">More Options</h3>
            {content.hotelList.map((hotel, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-cream-200 shadow-sm flex justify-between items-center hover:shadow-md transition-all cursor-pointer">
                    <div>
                        <h4 className="font-bold text-stone-800">{hotel.name}</h4>
                        <p className="text-xs text-stone-400">{hotel.city} • {hotel.rating}✨</p>
                        <div className="flex gap-2 mt-1">
                            {hotel.tags.map(t => <span key={t} className="text-[10px] bg-cream-100/50 px-1.5 py-0.5 rounded text-stone-400">{t}</span>)}
                        </div>
                    </div>
                    <Icon name="chevron-right" className="w-5 h-5 text-stone-400" />
                </div>
            ))}
        </div>

        {/* Safety Note */}
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-stone-400">
            <div className="flex items-center gap-2 mb-1 text-blue-800 font-bold">
                <Icon name="lock" className="w-3 h-3" /> Safety First
            </div>
            {content.safetyNote}
        </div>
    </div>
  );
};
