
import React, { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import type { DemoRestaurant } from '../../demoDb';
import { restoSuggestCopy, restoGenImagePrompt } from '../../services/ai/geminiResto';
import { useDynamicLoadingMessage } from '../../hooks/useDynamicLoadingMessage';
import { useSocialConnections } from '../../../hooks/useSocialConnections';

const copyLoadingMessages = [
    "Writing copy...",
    "Finding the right words...",
    "Polishing the message...",
    "Crafting taglines..."
];
const imageLoadingMessages = [
    "Powering up the diffusion model...",
    "Painting a picture...",
    "Rendering pixels...",
    "Adding final touches..."
];

export default function RestoMarketingStudio({ restaurant }: { restaurant: DemoRestaurant }) {
  const [idea, setIdea] = useState('Penne alla Vodka winter special — cozy, under $20, Huntington, NY.');
  const [copy, setCopy] = useState<string>("");
  const [img, setImg] = useState<string>("");
  const [isCopyLoading, setIsCopyLoading] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [imgError, setImgError] = useState("");

  const { connections, connect, disconnect, hasAnyConnection } = useSocialConnections();
  const [postStatus, setPostStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const copyLoadingMessage = useDynamicLoadingMessage(isCopyLoading, copyLoadingMessages);
  const imageLoadingMessage = useDynamicLoadingMessage(isImgLoading, imageLoadingMessages);

  async function handleGenCopy() {
    setIsCopyLoading(true);
    setCopyError("");
    setCopy("");
    const p = `Write 3 ad variants for ${restaurant.name}. Goal: drive reservations or menu visits. Idea: ${idea}. Tone: warm, premium, concise. Include 1 CTA.`;
    try {
        const { text } = await restoSuggestCopy(p);
        setCopy(text || "");
    } catch(e: any) {
        setCopyError(e.message || "Failed to generate copy.");
    } finally {
        setIsCopyLoading(false);
    }
  }

  async function handleGenImage() {
    setIsImgLoading(true);
    setImgError("");
    setImg("");
    try {
        const { imageUrl } = await restoGenImagePrompt(restaurant.name + " — " + idea);
        if (imageUrl) setImg(imageUrl);
    } catch (e: any) {
        setImgError(e.message || "Failed to generate image.");
    } finally {
        setIsImgLoading(false);
    }
  }

  const handlePost = () => {
    setPostStatus({ type: 'idle', message: '' });
    if (!copy && !img) {
        setPostStatus({ type: 'error', message: "Please generate copy or an image before posting." });
        return;
    }
    if (!hasAnyConnection()) {
        setPostStatus({ type: 'error', message: "Please connect at least one social media account to post." });
        return;
    }
    setPostStatus({ type: 'success', message: "Campaign successfully posted to connected accounts!" });
    setTimeout(() => setPostStatus({ type: 'idle', message: '' }), 4000);
  };

  const SOCIAL_PLATFORMS = [
    { id: 'facebook' as const, name: 'Facebook', icon: 'facebook', color: 'text-blue-600 bg-blue-50' },
    { id: 'instagram' as const, name: 'Instagram', icon: 'camera_alt', color: 'text-pink-600 bg-pink-50' },
    { id: 'x' as const, name: 'X (Twitter)', icon: 'close', color: 'text-black bg-cream-100/80' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide">
      
      {/* Section 1: Campaign Input */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-cream-200">
        <div className="mb-6">
          <h3 className="font-lora text-2xl text-stone-800 mb-2 font-bold">1. Campaign Idea</h3>
          <p className="text-sm text-stone-600">Describe your promotion. Be specific for best results (e.g., mention the dish, price, location, or target audience).</p>
        </div>
        <textarea 
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="w-full p-4 bg-cream-50/50 rounded-xl border border-cream-200 text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-brand-400/30 outline-none min-h-[100px] font-medium"
        />
        <div className="flex flex-wrap gap-3 mt-4">
          <button 
            onClick={handleGenCopy}
            disabled={isCopyLoading || isImgLoading}
            className="px-6 py-3 bg-brand-400 text-white rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:bg-gray-400 shadow-md"
          >
            {isCopyLoading ? <><Spinner /> <span className="text-xs">{copyLoadingMessage}</span></> : 'Generate Copy'}
          </button>
          <button 
            onClick={handleGenImage}
            disabled={isCopyLoading || isImgLoading}
            className="px-6 py-3 bg-white border border-cream-200 text-stone-800 rounded-xl font-bold hover:bg-cream-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isImgLoading ? <><Spinner /> <span className="text-xs">{imageLoadingMessage}</span></> : 'Generate Image'}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Section 2: Copy */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-cream-200 flex flex-col min-h-[300px]">
          <h3 className="font-lora text-xl text-stone-800 mb-4 font-bold">2. Generated Ad Copy</h3>
          {copyError && <p className="text-red-500 text-sm mb-4">{copyError}</p>}
          {copy ? (
            <div className="flex-1 p-4 bg-cream-50/30 rounded-xl whitespace-pre-wrap text-stone-800 text-sm leading-relaxed animate-fade-in border border-cream-200">
              {copy}
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-stone-600 italic border-2 border-dashed border-cream-200 rounded-xl text-center p-6">
               {isCopyLoading ? <Spinner /> : <><Icon name="chat_bubble_outline" className="mb-2 opacity-30" /> Your generated ad copy will appear here.</>}
             </div>
          )}
        </div>

        {/* Section 3: Image */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-cream-200 flex flex-col min-h-[300px]">
          <h3 className="font-lora text-xl text-stone-800 mb-4 font-bold">3. Generated Image</h3>
          {imgError && <p className="text-red-500 text-sm mb-4">{imgError}</p>}
          {img ? (
            <div className="relative rounded-xl overflow-hidden flex-1 animate-fade-in group border border-cream-200">
               <img src={img} alt="Campaign" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <a href={img} download="campaign.jpg" className="p-2.5 bg-white rounded-full text-stone-800 hover:scale-110 transition-transform shadow-lg"><Icon name="download" size={20} /></a>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-600 italic border-2 border-dashed border-cream-200 rounded-xl text-center p-6">
               {isImgLoading ? <Spinner /> : <><Icon name="image" className="mb-2 opacity-30" /> Your generated image will appear here.</>}
             </div>
          )}
        </div>
      </div>

      {/* Section 4: Connect */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-cream-200">
        <h3 className="font-lora text-2xl text-stone-800 mb-2 font-bold">4. Connect Accounts & Publish</h3>
        <p className="text-sm text-stone-600 mb-6">Connect your social media accounts to post your campaign. This is a simulation and won't post real content.</p>
        
        <div className="grid sm:grid-cols-3 gap-4">
          {SOCIAL_PLATFORMS.map(platform => {
            const isConnected = !!connections[platform.id];
            return (
              <div key={platform.id} className="flex flex-col items-center p-4 border border-cream-200 rounded-2xl hover:border-brand-400/40 transition-colors bg-white text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${platform.color} shadow-sm`}>
                  <Icon name={platform.icon} size={24} />
                </div>
                <div className="font-bold text-stone-800 text-sm mb-1">{platform.name}</div>
                <div className={`text-[10px] uppercase font-bold tracking-widest mb-4 ${isConnected ? 'text-green-600' : 'text-stone-600'}`}>
                    {isConnected ? 'Connected' : 'Not Linked'}
                </div>
                <button 
                  onClick={() => isConnected ? disconnect(platform.id) : connect(platform.id)}
                  className={`w-full py-2 px-4 text-xs font-bold rounded-lg transition-all ${
                    isConnected 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-white border border-cream-200 text-stone-800 hover:bg-cream-50'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-8 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600 uppercase tracking-widest">
            <Icon name="verified" className="w-4 h-4 text-green-500" />
            AI Compliance Checked
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-6 py-3 text-stone-600 font-bold hover:text-stone-800 transition-colors">Save Draft</button>
            <button 
                onClick={handlePost}
                className="flex-1 sm:flex-none px-8 py-3 bg-brand-400 text-white rounded-xl font-bold shadow-lg hover:bg-cream-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
                <Icon name="send" size={18} />
                Post Campaign
            </button>
          </div>
        </div>
        {postStatus.message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm font-bold animate-fade-in ${postStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {postStatus.message}
          </div>
        )}
      </div>

    </div>
  );
}
