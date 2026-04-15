
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface FoodData {
  product_name: string;
  brands: string;
  nutriments: {
    'energy-kcal_100g': number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
  };
  image_url: string;
}

export const NutritionScanner = ({ onLog }: { onLog: (item: { line: string; calories: number; protein_g: number; fat_g: number; carbs_g: number }) => void }) => {
  const [scannedItem, setScannedItem] = useState<FoodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(true);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isScannerActive) {
      // @ts-ignore
      scannerRef.current = new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      
      scannerRef.current.render(async (decodedText: string) => {
        setLoading(true);
        try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
          const data = await res.json();
          if (data.status === 1) {
            setScannedItem(data.product);
            setIsScannerActive(false);
            scannerRef.current.clear();
          } else {
             alert("Product not found in database.");
          }
        } catch (err) {
          console.error("Scan error", err);
          alert("Error connecting to nutrition database.");
        } finally {
          setLoading(false);
        }
      }, (err: any) => {
          // Normal scanning noise, ignore
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e: any) => console.warn(e));
      }
    };
  }, [isScannerActive]);

  const handleAddToLog = () => {
      if (!scannedItem) return;
      onLog({
          line: `${scannedItem.product_name} (${scannedItem.brands})`,
          calories: Math.round(scannedItem.nutriments['energy-kcal_100g'] || 0),
          protein_g: scannedItem.nutriments.proteins_100g || 0,
          fat_g: scannedItem.nutriments.fat_100g || 0,
          carbs_g: scannedItem.nutriments.carbohydrates_100g || 0
      });
      setScannedItem(null);
      setIsScannerActive(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
        {isScannerActive ? (
            <div id="reader" className="w-full bg-gray-900 aspect-square md:aspect-video"></div>
        ) : (
            <div className="p-8 text-center bg-white">
                <button 
                    onClick={() => setIsScannerActive(true)}
                    className="flex items-center gap-2 mx-auto bg-brand-400 text-white px-6 py-2 rounded-full font-bold shadow-md"
                >
                    <Icon name="camera" className="w-5 h-5" />
                    Scan Another Item
                </button>
            </div>
        )}
      </div>
      
      {loading && (
          <div className="flex items-center justify-center gap-3 py-4 text-stone-400">
              <Spinner />
              <p className="italic">Searching database...</p>
          </div>
      )}

      {scannedItem && (
        <div className="animate-page-slide bg-white p-6 rounded-2xl shadow-sm border border-cream-200">
          <div className="flex items-center gap-4 mb-6">
            <img src={scannedItem.image_url} className="w-20 h-20 rounded-xl object-cover shadow-sm bg-cream-100/80" alt="food" />
            <div>
              <h3 className="font-lora text-xl font-bold text-stone-800">{scannedItem.product_name}</h3>
              <p className="text-sm text-stone-400">{scannedItem.brands}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-8 text-center">
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="text-[10px] uppercase font-bold text-yellow-700 tracking-wider mb-1">Cals</div>
              <div className="text-lg font-bold text-stone-800">{Math.round(scannedItem.nutriments['energy-kcal_100g'] || 0)}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider mb-1">Prot</div>
              <div className="text-lg font-bold text-stone-800">{Math.round(scannedItem.nutriments.proteins_100g || 0)}g</div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="text-[10px] uppercase font-bold text-green-700 tracking-wider mb-1">Carb</div>
              <div className="text-lg font-bold text-stone-800">{Math.round(scannedItem.nutriments.carbohydrates_100g || 0)}g</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-[10px] uppercase font-bold text-red-700 tracking-wider mb-1">Fat</div>
              <div className="text-lg font-bold text-stone-800">{Math.round(scannedItem.nutriments.fat_100g || 0)}g</div>
            </div>
          </div>

          <button 
            onClick={handleAddToLog}
            className="w-full py-4 bg-brand-400 text-white rounded-xl font-bold shadow-lg hover:bg-opacity-90 transition-all transform active:scale-[0.98]"
          >
            Add to Daily Log
          </button>
        </div>
      )}
    </div>
  );
};
