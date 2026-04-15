import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { generateChefRecipe, generateFoodImage, generateFoodAnalysis } from '../../../../services/geminiService';
import { Spinner } from '../../../../components/Spinner';

export const AiChef = () => {
  const [activeMode, setActiveMode] = useState<'tutor' | 'visualizer'>('tutor');

  // --- Chef Tutor State ---
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [freeNotes, setFreeNotes] = useState('');
  const [recipeResult, setRecipeResult] = useState<string | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // --- Visualizer State ---
  const [visPrompt, setVisPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingVis, setLoadingVis] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // --- Ingredient helpers ---
  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      setIngredients(prev => [...prev, trimmed]);
    }
    setIngredientInput('');
  };

  const removeIngredient = (item: string) =>
    setIngredients(prev => prev.filter(x => x !== item));

  // --- Recipe generation ---
  const handleGenerateRecipe = async () => {
    const parts: string[] = [];
    if (ingredients.length > 0) parts.push(`Ingredients I have: ${ingredients.join(', ')}.`);
    if (freeNotes.trim()) parts.push(freeNotes.trim());
    const prompt = parts.join(' ');
    if (!prompt) return;

    setLoadingRecipe(true);
    setRecipeResult(null);
    try {
      const result = await generateChefRecipe(prompt);
      const r = result.recipe;
      const diffColor: Record<string, string> = {
        'Easy': 'bg-green-100 text-green-700',
        'Intermediate': 'bg-amber-100 text-amber-700',
        'Advanced': 'bg-orange-100 text-orange-700',
        'Chef Level': 'bg-red-100 text-red-700',
      };
      const diff = r.difficulty || 'Intermediate';
      setRecipeResult(`
        <div class="space-y-5">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-cream-200 pb-4">
            <h3 class="text-2xl font-lora font-bold text-stone-800">${r.title}</h3>
            <div class="flex flex-wrap gap-2 mt-1">
              <span class="text-[11px] font-bold px-2.5 py-1 rounded-full ${diffColor[diff] || 'bg-stone-100 text-stone-600'}">${diff}</span>
              ${r.cuisine ? `<span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-forest-900/10 text-forest-900">${r.cuisine}</span>` : ''}
              ${r.prepTime ? `<span class="text-[11px] px-2.5 py-1 rounded-full bg-cream-100/60 text-stone-500">Prep: ${r.prepTime}</span>` : ''}
              ${r.cookTime ? `<span class="text-[11px] px-2.5 py-1 rounded-full bg-cream-100/60 text-stone-500">Cook: ${r.cookTime}</span>` : ''}
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
            <p class="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Chef Marco's Note</p>
            <p class="text-sm italic text-stone-700 leading-relaxed">${result.summary}</p>
          </div>

          ${r.whyItWorks ? `<div class="bg-blue-50/60 p-3 rounded-xl border border-blue-100"><p class="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">Why It Works</p><p class="text-sm text-stone-700">${r.whyItWorks}</p></div>` : ''}

          <div>
            <h4 class="font-bold text-stone-800 uppercase text-xs tracking-widest mb-3">Ingredients <span class="normal-case font-normal text-stone-400 ml-1">â ” serves ${r.servings || 2}</span></h4>
            <ul class="space-y-1.5">
              ${r.ingredients.map((i: any) => `<li class="flex justify-between items-baseline border-b border-dashed border-cream-200 py-1.5 text-sm"><span class="text-stone-800">${i.name}${i.notes ? ` <span class="text-xs text-stone-400 italic">(${i.notes})</span>` : ''}</span><span class="font-semibold text-stone-800 ml-4 flex-shrink-0">${i.qty || ''}</span></li>`).join('')}
            </ul>
          </div>

          <div>
            <h4 class="font-bold text-stone-800 uppercase text-xs tracking-widest mb-3">Method</h4>
            <ol class="space-y-3">
              ${r.steps.map((s: string, idx: number) => `<li class="flex gap-3 items-start"><span class="flex-shrink-0 w-6 h-6 bg-forest-900 text-cream-50 text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">${idx + 1}</span><p class="text-sm text-stone-700 leading-relaxed">${s}</p></li>`).join('')}
            </ol>
          </div>

          ${r.tips?.length ? `<div class="bg-amber-50/70 p-4 rounded-xl border border-amber-200"><h4 class="font-bold text-amber-800 text-xs uppercase tracking-widest mb-2">Pro Tips from 50+ Years in the Kitchen</h4><ul class="space-y-2">${r.tips.map((t: string) => `<li class="flex gap-2 text-sm text-stone-700"><span class="text-amber-500 font-bold flex-shrink-0 mt-0.5">â ¦</span><span>${t}</span></li>`).join('')}</ul></div>` : ''}

          ${(r as any).substitutions?.length ? `<div class="bg-teal-50/60 p-4 rounded-xl border border-teal-100"><h4 class="font-bold text-teal-700 text-xs uppercase tracking-widest mb-2">Substitutions &amp; Variations</h4><ul class="space-y-2">${(r as any).substitutions.map((s: string) => `<li class="flex gap-2 text-sm text-stone-700"><span class="text-teal-500 font-bold flex-shrink-0">â ”</span><span>${s}</span></li>`).join('')}</ul></div>` : ''}
        </div>
      `);
    } catch (e) {
      console.error(e);
      setRecipeResult("<p class='text-red-500'>Liora is having trouble connecting to the pantry. Please try again.</p>");
    } finally {
      setLoadingRecipe(false);
    }
  };

  // --- Food Visualizer ---
  const handleVisualize = async () => {
    if (!visPrompt) return;
    setLoadingVis(true);
    setGeneratedImage(null);
    setAnalysis(null);
    try {
      const cinematicPrompt = `Professional food photography, magazine quality: ${visPrompt}. Styled on a marble surface with natural window light, shallow depth of field, fresh garnish, warm inviting tones, appetizing presentation.`;
      const base64 = await generateFoodImage(cinematicPrompt, { model: 'gemini-2.5-flash-image' });
      setGeneratedImage(`data:image/jpeg;base64,${base64}`);
      // Fetch preparation analysis in parallel (non-blocking)
      setLoadingAnalysis(true);
      generateFoodAnalysis(visPrompt)
        .then(a => setAnalysis(a))
        .catch(() => null)
        .finally(() => setLoadingAnalysis(false));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVis(false);
    }
  };

  const diffBadge: Record<string, string> = {
    Easy: 'bg-green-100 text-green-700',
    Intermediate: 'bg-amber-100 text-amber-700',
    Advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="h-full flex flex-col bg-cream-50">

      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-lora font-bold text-stone-800 mb-1">AI Chef Studio</h1>
        <p className="text-stone-400 text-sm">50+ years of culinary mastery, at your fingertips.</p>

        {/* Tabs */}
        <div className="flex gap-6 mt-6 border-b border-cream-200">
          {(['tutor', 'visualizer'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`pb-3 px-1 text-xs font-bold tracking-widest uppercase transition-colors relative ${
                activeMode === mode ? 'text-stone-800' : 'text-stone-400 hover:text-stone-800'
              }`}
            >
              {mode === 'tutor' ? 'Chef Tutor' : 'Food Visualizer'}
              {activeMode === mode && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

        {/* â• â• â•  CHEF TUTOR â• â• â•  */}
        {activeMode === 'tutor' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-page-slide">

            {/* Chef intro banner */}
            <div className="flex items-center gap-4 bg-forest-900 text-cream-50 p-4 rounded-2xl shadow-md">
              <div className="w-12 h-12 rounded-full bg-brand-400/20 border-2 border-brand-400/40 flex items-center justify-center flex-shrink-0">
                <span className="font-lora font-bold text-xl text-brand-300">M</span>
              </div>
              <div>
                <p className="font-bold text-sm tracking-wide">Chef Marco Bellini</p>
                <p className="text-xs text-cream-300">50+ years · Michelin-starred · Paris · Tokyo · New York</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <Icon name="auto_awesome" size={20} className="text-brand-300" />
              </div>
            </div>

            {/* Recipe Generator card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-cream-200 space-y-5">
              <div className="flex items-center gap-3 text-stone-800">
                <div className="p-2 bg-cream-50 rounded-full"><Icon name="restaurant_menu" size={20} /></div>
                <div>
                  <h2 className="font-lora text-xl font-bold leading-tight">Ingredient-Based Recipe Generator</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Tell Chef Marco what you have â ” he'll suggest the perfect dish.</p>
                </div>
              </div>

              {/* Ingredient tag input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2 block">
                  Your Ingredients
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingredientInput}
                    onChange={e => setIngredientInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                    placeholder="e.g. chicken thighs, lemon, garlic, thymeâ ¦"
                    className="flex-1 p-3 bg-cream-50/70 rounded-xl border border-cream-200 text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-brand-400/30 focus:outline-none text-sm"
                  />
                  <button
                    onClick={addIngredient}
                    disabled={!ingredientInput.trim()}
                    className="px-4 py-2.5 bg-forest-900 text-cream-50 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-forest-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ingredients.map(ing => (
                      <span
                        key={ing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-900/8 border border-forest-900/20 text-forest-900 rounded-full text-xs font-semibold"
                      >
                        {ing}
                        <button
                          onClick={() => removeIngredient(ing)}
                          className="text-forest-900/50 hover:text-red-500 transition-colors text-base leading-none"
                          aria-label={`Remove ${ing}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2 block">
                  Additional Notes{' '}
                  <span className="font-normal normal-case text-stone-400">(optional â ” cuisine style, dietary needs, occasionâ ¦)</span>
                </label>
                <textarea
                  value={freeNotes}
                  onChange={e => setFreeNotes(e.target.value)}
                  placeholder="e.g. Make it Italian, gluten-free, for a romantic date nightâ ¦"
                  className="w-full p-3 bg-cream-50/70 rounded-xl border border-cream-200 text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-brand-400/30 focus:outline-none min-h-[72px] resize-none text-sm"
                />
              </div>

              <div className="flex justify-between items-center">
                {ingredients.length > 0 && (
                  <p className="text-xs text-stone-400">
                    <span className="font-semibold text-forest-900">{ingredients.length}</span> ingredient{ingredients.length !== 1 ? 's' : ''} ready
                  </p>
                )}
                <button
                  onClick={handleGenerateRecipe}
                  disabled={loadingRecipe || (ingredients.length === 0 && !freeNotes.trim())}
                  className="ml-auto px-6 py-3 bg-brand-400 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-brand-500 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {loadingRecipe ? <Icon name="sync" size={18} className="animate-spin" /> : <Icon name="auto_awesome" size={18} />}
                  {loadingRecipe ? 'Chef is cookingâ ¦' : 'Generate Recipe'}
                </button>
              </div>
            </div>

            {/* Recipe result */}
            {recipeResult && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-cream-200 animate-page-slide mb-12">
                <div className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: recipeResult }} />
                <div className="mt-8 pt-6 border-t border-cream-200 flex flex-wrap gap-4 justify-between">
                  <button className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 hover:text-stone-800 transition-colors">
                    <Icon name="bookmark_border" size={16} /> Save to Cookbook
                  </button>
                  <button className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 hover:text-stone-800 transition-colors">
                    <Icon name="shopping_cart" size={16} /> Add to Grocery List
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* â• â• â•  FOOD VISUALIZER â• â• â•  */}
        {activeMode === 'visualizer' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-page-slide">

            {/* Input card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-cream-200">
              <div className="flex items-center gap-3 mb-4 text-stone-800">
                <div className="p-2 bg-cream-50 rounded-full"><Icon name="image" size={20} /></div>
                <div>
                  <h2 className="font-lora text-xl font-bold leading-tight">Plating Visualizer</h2>
                  <p className="text-xs text-stone-400 mt-0.5">See your dish before you cook it â ” plus get Chef Marco's preparation guide.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={visPrompt}
                  onChange={e => setVisPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVisualize()}
                  placeholder="e.g. Wagyu beef burger on a brioche bun with truffle friesâ ¦"
                  className="flex-1 p-4 bg-cream-50/70 rounded-2xl border border-cream-200 text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-brand-400/30 focus:outline-none text-sm"
                />
                <button
                  onClick={handleVisualize}
                  disabled={loadingVis || !visPrompt.trim()}
                  className="px-6 py-3 bg-brand-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-500 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {loadingVis ? <Icon name="sync" size={18} className="animate-spin" /> : <Icon name="visibility" size={18} />}
                  {loadingVis ? 'Renderingâ ¦' : 'Visualize'}
                </button>
              </div>
            </div>

            {/* Generated image */}
            {generatedImage && (
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-cream-200 animate-page-slide">
                <img
                  src={generatedImage}
                  alt="Generated Food"
                  className="w-full h-auto aspect-square object-cover rounded-2xl shadow-inner bg-cream-100/80"
                />
                <div className="mt-4 px-2 flex justify-between items-center">
                  <p className="text-xs text-stone-400 font-medium italic">Concept: "{visPrompt}"</p>
                  <button className="p-2 hover:bg-cream-50 rounded-full text-stone-800 transition-colors" title="Download Image">
                    <Icon name="download" size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Preparation guide */}
            {(loadingAnalysis || analysis) && (
              <div className="bg-white rounded-3xl shadow-sm border border-cream-200 overflow-hidden animate-page-slide mb-12">
                {/* Header */}
                <div className="bg-forest-900 px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-400/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-lora font-bold text-base text-brand-300">M</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-cream-50">Chef Marco's Preparation Guide</p>
                    <p className="text-xs text-cream-300">How to recreate this dish at home</p>
                  </div>
                  {analysis && (
                    <div className="ml-auto flex gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${diffBadge[analysis.difficulty] || 'bg-stone-100 text-stone-600'}`}>
                        {analysis.difficulty}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-cream-100/20 text-cream-200">
                        {analysis.estimatedTime}
                      </span>
                    </div>
                  )}
                </div>

                {loadingAnalysis && !analysis ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-stone-400">
                    <Spinner />
                    <p className="text-sm animate-pulse">Chef Marco is preparing your guideâ ¦</p>
                  </div>
                ) : analysis && (
                  <div className="p-6 space-y-5">

                    {/* Chef's personal note */}
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Chef's Note</p>
                      <p className="text-sm italic text-stone-700 leading-relaxed">{analysis.chefNote}</p>
                    </div>

                    {/* Key techniques */}
                    {analysis.keyTechniques?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Key Techniques</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.keyTechniques.map((t: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-forest-900/8 border border-forest-900/15 text-forest-900 rounded-full text-xs font-semibold">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preparation steps */}
                    {analysis.preparationSteps?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">How to Prepare</h4>
                        <ol className="space-y-2.5">
                          {analysis.preparationSteps.map((step: string, i: number) => (
                            <li key={i} className="flex gap-3 items-start">
                              <span className="flex-shrink-0 w-6 h-6 bg-forest-900 text-cream-50 text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">{i + 1}</span>
                              <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Pro tips */}
                    {analysis.proTips?.length > 0 && (
                      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-800 text-xs uppercase tracking-widest mb-2">Pro Tips from the Kitchen</h4>
                        <ul className="space-y-2">
                          {analysis.proTips.map((tip: string, i: number) => (
                            <li key={i} className="flex gap-2 text-sm text-stone-700">
                              <span className="text-amber-500 font-bold flex-shrink-0 mt-0.5">â ¦</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Plating note */}
                    {analysis.platingNote && (
                      <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-700 text-xs uppercase tracking-widest mb-1">Plating &amp; Presentation</h4>
                        <p className="text-sm text-stone-700 leading-relaxed">{analysis.platingNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {loadingVis && (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Spinner />
                <p className="mt-4 text-sm font-medium animate-pulse">Rendering your culinary conceptâ ¦</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};