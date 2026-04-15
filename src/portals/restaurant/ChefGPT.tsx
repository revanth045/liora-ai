import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../../../components/Icon';
import type { DemoRestaurant } from '../../demoDb';

const SUGGESTED_QUERIES = [
  "Classic BÃ©arnaise sauce recipe",
  "How to perfectly sear duck breast?",
  "Substitutes for heavy cream in pasta",
  "Ratios for fresh pasta dough",
  "How to make a dark beef stock?",
  "Tips for crispy fish skin",
];

type Msg = { role: 'chef' | 'user'; content: string };

const RECIPE_RESPONSES: Record<string, string> = {
  bÃ©arnaise: `**Classic BÃ©arnaise Sauce**\n\nA rich emulsified butter sauce, cousin of Hollandaise.\n\n**Reduction:**\n- 60ml white wine vinegar\n- 60ml dry white wine\n- 2 shallots, finely minced\n- 10g fresh tarragon stems\n- 1 tsp black peppercorns\n\nSimmer until reduced by half. Strain and cool.\n\n**Emulsion:**\n- 3 egg yolks + 2 tbsp reduction\n- 250g clarified butter (warm, not hot)\n- Salt, white pepper\n- Fresh tarragon + chervil to finish\n\n**Method:** Whisk yolks with reduction over a bain-marie until ribbon stage. Slowly stream in clarified butter while whisking constantly. Season and fold in fresh herbs.\n\n**Chef Tip:** Keep at 60â “65Â°C to hold. Never exceed 70Â°C or it will break. â ¨ï¸`,

  duck: `**Perfectly Seared Duck Breast**\n\n**Prep:**\n- Score skin in crosshatch at 5mm intervals (don't cut the meat)\n- Pat completely dry â ” moisture is the enemy\n- Season generously with salt 30 min before\n\n**Cold-pan method (best results):**\n1. Place breast skin-side down in a cold, dry pan\n2. Turn heat to medium. Let fat render slowly 12â “15 min\n3. Drain excess fat every 5 min (save it!)\n4. Flip when skin is deep mahogany and crisp\n5. Cook 2â “3 min on flesh side\n6. Target internal: **54Â°C** (medium-rare)\n\n**Rest:** 8 minutes tented with foil â ” the carry-over will bring it to 57Â°C.\n\n**Sauce pairing:** Cherry gastrique, orange jus, or a red wine & blackcurrant reduction work beautifully. ğ   `,

  'heavy cream': `**Heavy Cream Substitutes**\n\nDepends on the application:\n\n| Use Case | Best Substitute |\n|---|---|\n| Pasta sauce | CrÃ¨me fraÃ®che (1:1), full-fat coconut cream |\n| Soup/bisque | Greek yogurt (temper slowly), cashew cream |\n| Whipping | Coconut cream (chilled), mascarpone |\n| Pastry/custard | Evaporated milk, or 3/4 milk + 1/4 melted butter |\n\n**Chef's go-to:** For rich pasta sauces, reserve 100ml pasta water + 60g Parmesan + 30g butter â ” this creates a silky emulsion with no cream needed.\n\n**Note:** Coconut cream adds a subtle sweetness â ” good for desserts, less ideal for savoury unless the dish suits it. ğ ¥¥`,

  pasta: `**Fresh Pasta Dough Ratios**\n\n**Standard (egg pasta):**\n- 100g 00 flour : 1 large egg (approx 55g)\n- Scale up linearly\n\n**For 4 portions:** 400g flour + 4 eggs + pinch of salt\n\n**Variations:**\n| Style | Ratio Adjustment |\n|---|---|\n| Richer (tagliatelle) | Add 2 extra yolks per 400g |\n| Spinach pasta | 100g cooked spinach replaces 1 egg |\n| Semolina (orecchiette) | 70% semolina : 30% 00 flour, water only |\n| Pasta all'uovo (silky) | All yolks â ” 8 yolks per 200g 00 flour |\n\n**Method:** Make a well, whisk eggs in centre, gradually incorporate flour. Knead 10 min until smooth. Rest 30 min wrapped. Roll from thickest to thinnest setting.\n\n**Chef tip:** Dough should feel like Play-Doh â ” not sticky, not cracking. Adjust with drops of water or dusts of flour. ğ   `,

  'beef stock': `**Dark Beef Stock (Fond Brun)**\n\n**Yield:** ~4 litres | **Time:** 8â “12 hours\n\n**Bones:** 3â “4 kg beef knuckles + 500g marrow bones\n\n**Step 1 â ” Roast bones:**\nRoast at 220Â°C for 45â “60 min until deep mahogany. Turn once.\n\n**Step 2 â ” Roast mirepoix:**\n- 2 large onions (halved, no peeling â ” the skins add colour)\n- 3 carrots, rough chop\n- 4 celery stalks\nRoast at 200Â°C until caramelised, 25 min.\n\n**Step 3 â ” Deglaze & build:**\n- 2 tbsp tomato paste (cook in roasting pan until brick-red)\n- 1 bottle red wine, reduce by half\n- 6 litres cold water\n- 1 bouquet garni (thyme, bay, parsley stems, peppercorns)\n\n**Step 4 â ” Simmer:**\nNever boil â ” maintain a gentle simmer with just a lazy bubble. Skim fat and foam regularly. Strain through fine chinois.\n\n**Reduction for glace:** Reduce by 75% for a rich, gelatinous glace de viande. ğ ¥©`,

  'fish skin': `**Crispy Fish Skin â ” The Fundamentals**\n\n**Why it fails:** Moisture and low heat. Fish releases water rapidly â ” this steams instead of sears.\n\n**Before cooking:**\n1. Pat skin completely dry with kitchen paper\n2. Score the skin lightly to prevent curling\n3. Season skin generously with salt â ” draws out more moisture\n4. Let it air-dry on a rack in the fridge uncovered for 30â “60 min\n\n**Cooking:**\n1. Use a stainless steel or cast iron pan (not non-stick)\n2. Heat until smoking â ” test with a drop of water (it should vaporize instantly)\n3. Add a neutral oil with high smoke point\n4. Place fish skin-side down and press firmly with a fish spatula for 30 seconds\n5. Keep pressure on intermittently to prevent curling\n6. Do NOT move it â ” let it release naturally (2â “4 min depending on thickness)\n7. Flip only once, cook flesh side 1â “2 min\n\n**Chef trick:** Finishing in a hot oven (220Â°C) for 2 min after searing gives you perfect colour on all sides. ğ   `,
};

function getRecipeResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(RECIPE_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  if (lower.includes('ratio') || lower.includes('proportion')) {
    return `**Recipe Ratios & Proportions**\n\nHere are some foundational culinary ratios:\n\n- **Beurre blanc:** 3 parts butter : 1 part reduction\n- **Vinaigrette:** 3 parts oil : 1 part vinegar\n- **Brine (basic):** 5% salt by weight of water\n- **Cake sponge:** 1:1:1:1 (flour:sugar:butter:eggs by weight)\n- **CrÃ¨me brÃ»lÃ©e:** 6 yolks : 500ml cream : 80g sugar\n- **Short pastry:** 3:2:1 (flour:butter:water)\n\nAsk me about a specific recipe or technique for a more detailed breakdown! ğ  ¨â ğ  ³`;
  }
  if (lower.includes('temperature') || lower.includes('temp') || lower.includes('celsius')) {
    return `**Internal Cooking Temperatures (Â°C)**\n\n| Protein | Rare | Med-Rare | Medium | Well |\n|---|---|---|---|---|\n| Beef/Lamb | 50 | 55 | 60 | 70+ |\n| Pork | â ” | 60 | 65 | 72 |\n| Chicken | â ” | â ” | â ” | 74 |\n| Fish (most) | 45 | 50 | 55 | 60 |\n| Duck breast | â ” | 54 | 58 | 65 |\n\n**Carryover cooking:** Remove proteins 3â “5Â°C below target. A rested 500g steak will rise ~5Â°C.\n\n**Pastry:**\n- Choux: 93Â°C internal\n- Custard: 82Â°C (nappÃ©)\n- Bread: 88â “96Â°C (depending on style)\n\nAlways rest before serving for best texture and moisture retention. ğ  ¡ï¸`;
  }
  if (lower.includes('season') || lower.includes('salt') || lower.includes('seasoning')) {
    return `**The Art of Seasoning**\n\nSalt is the most important tool in the kitchen. Here's how to use it:\n\n**Types and uses:**\n- **Fine sea salt** â ” everyday cooking, baking (measured precisely)\n- **Kosher/flake salt** â ” pasta water, rubbing meat (excellent control)\n- **Maldon flakes** â ” finishing salt, salads, chocolate desserts\n- **Smoked salt** â ” eggs, grilled vegetables, compound butters\n\n**When to season:**\n1. Season proteins before cooking (30+ min for large cuts)\n2. Salt pasta water heavily â ” "it should taste like the sea"\n3. Add acid (lemon, vinegar) before final salt adjustment â ” it brightens flavour\n4. Finish with a light flake salt right before plating for texture contrast\n\n**Common mistake:** Under-seasoning out of fear. Taste as you go â ” build flavour in layers. ğ § `;
  }
  return `**Chef GPT is here to help!**\n\nI can assist you with:\n\n- ğ    **Full recipes** â ” with exact ratios and method steps\n- ğ  ¡ï¸ **Cooking temperatures** â ” proteins, pastry, and confectionery\n- ğ    **Ingredient substitutions** â ” allergy-friendly and practical swaps\n- â –ï¸ **Culinary ratios** â ” stocks, sauces, doughs, and batters\n- ğ  ª **Techniques** â ” searing, emulsification, braising, tempering\n- ğ  ½ï¸ **Plating tips** â ” composition, colour, and texture balance\n\nTry asking: *"How do I make a classic BÃ©arnaise?"* or *"What's the ratio for fresh pasta dough?"*`;
}

export default function ChefGPT({ restaurant }: { restaurant: DemoRestaurant }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'chef',
      content: `Welcome, Chef! I'm Chef GPT â ” your AI culinary assistant for ${restaurant.name}.\n\nAsk me anything: recipes, techniques, ratios, substitutions, temperatures, or plating ideas. What are we cooking today? ğ  ¨â ğ  ³`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string = input) => {
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'chef', content: getRecipeResponse(text) }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 600);
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/\|---\|/g, '')
      .replace(/\| (.*?) \|/g, '<span class="inline-block border border-cream-200 px-2 py-0.5 rounded text-xs mr-1 mb-1">$1</span>');
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col animate-page-slide pb-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500">
          ğ  ¨â ğ  ³
        </div>
        <div>
          <h2 className="font-lora text-2xl font-bold text-stone-800">Chef GPT</h2>
          <p className="text-sm text-stone-400 font-medium">Your AI culinary assistant â ” recipes, techniques & more</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Online</span>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white border border-cream-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-amber-50/30 to-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-lg ${
                msg.role === 'chef'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : 'bg-cream-200 text-stone-700'
              }`}>
                {msg.role === 'chef' ? 'ğ  ¨â ğ  ³' : <Icon name="person" size={18} />}
              </div>
              <div className={`max-w-[82%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm border ${
                msg.role === 'chef'
                  ? 'bg-white border-cream-200 text-stone-800 rounded-tl-none'
                  : 'bg-amber-500 border-amber-400 text-white rounded-tr-none'
              }`}>
                <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-sm">ğ  ¨â ğ  ³</div>
              <div className="bg-white border border-cream-200 px-5 py-4 rounded-3xl rounded-tl-none text-xs text-stone-400 italic shadow-sm flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                Chef GPT is thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions + Input */}
        <div className="p-5 bg-white border-t border-cream-200">
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="flex-shrink-0 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 hover:border-amber-400 hover:bg-amber-100 transition-all whitespace-nowrap shadow-sm active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about a recipe, technique, ratio, or ingredient..."
              className="w-full px-5 py-3.5 pr-14 bg-cream-50 border border-cream-200 rounded-2xl outline-none text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all text-sm"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="absolute right-2.5 top-2 p-2 bg-amber-500 text-white rounded-xl disabled:opacity-30 hover:bg-amber-600 transition-all active:scale-90 shadow-md"
            >
              <Icon name="send" size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center text-stone-400 mt-3 font-bold uppercase tracking-widest opacity-50">
            Chef GPT â ” Culinary Intelligence for {restaurant.name}
          </p>
        </div>
      </div>
    </div>
  );
}
