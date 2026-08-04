import React, { useState } from 'react';
import { Product } from '../types';
import { Scale, ShoppingBag, X, Minus, Plus, CheckCircle, Tag, Info } from 'lucide-react';

interface WeightSelectionModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (selectedProduct: Product) => void;
}

export function getProductWeightLimits(product: Product): { minKg: number; maxKg: number; defaultKg: number } {
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  if (cat.includes('natu kolla') || name.includes('natu kolla') || name.includes('chicks') || product.id === 'prd-3') {
    return { minKg: 1, maxKg: 5, defaultKg: 2 };
  }
  if (cat.includes('sheep') || name.includes('sheep') || product.id === 'prd-1') {
    return { minKg: 25, maxKg: 50, defaultKg: 35 };
  }
  if (cat.includes('goat') || name.includes('goat') || product.id === 'prd-2') {
    return { minKg: 25, maxKg: 50, defaultKg: 35 };
  }

  // Parse custom range if string like "25–50 kg" or "1–5 kg"
  if (product.weightRange) {
    const match = product.weightRange.match(/(\d+)\s*[\–\-–—]\s*(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      if (min < max) {
        return { minKg: min, maxKg: max, defaultKg: Math.round((min + max) / 2) };
      }
    }
  }

  return { minKg: 1, maxKg: 50, defaultKg: Math.min(Math.max(product.weightKg || 10, 1), 50) };
}

export const WeightSelectionModal: React.FC<WeightSelectionModalProps> = ({
  product,
  onClose,
  onConfirm
}) => {
  const limits = getProductWeightLimits(product);
  const [selectedWeight, setSelectedWeight] = useState<number>(limits.defaultKg);
  const [isAdded, setIsAdded] = useState(false);

  const pricePerKg = Number(product.pricePerKg) || 0;
  const calculatedTotal = Math.round(selectedWeight * pricePerKg);

  // Array of options for the dropdown selector
  const weightOptions: number[] = [];
  for (let w = limits.minKg; w <= limits.maxKg; w++) {
    weightOptions.push(w);
  }

  const handleDecrement = () => {
    if (selectedWeight > limits.minKg) {
      setSelectedWeight(selectedWeight - 1);
    }
  };

  const handleIncrement = () => {
    if (selectedWeight < limits.maxKg) {
      setSelectedWeight(selectedWeight + 1);
    }
  };

  const handleConfirm = () => {
    const customizedProduct: Product = {
      ...product,
      weightKg: selectedWeight,
      totalPrice: calculatedTotal,
      price: calculatedTotal,
      unit: `${selectedWeight} kg (${product.unit || 'head'})`
    };

    setIsAdded(true);
    onConfirm(customizedProduct);

    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-800" />
            <h3 className="text-xl font-serif-brand font-bold text-slate-900">
              Select Quantity / Weight
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 font-bold text-xl rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Overview Card */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                No Image
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-md uppercase tracking-wider">
              {product.category}
            </span>
            <h4 className="font-serif-brand font-bold text-slate-900 text-base leading-snug">
              {product.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold">
                <Tag className="w-3 h-3 text-emerald-700" /> Breed: {product.breed || 'Local'}
              </span>
            </div>
          </div>
        </div>

        {/* Weight Range Information */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-emerald-900 font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-700" /> Allowed Weight Range:
          </span>
          <span className="px-2.5 py-1 bg-emerald-700 text-white font-extrabold rounded-lg">
            {limits.minKg} – {limits.maxKg} kg
          </span>
        </div>

        {/* Interactive Weight Selector Controls */}
        <div className="space-y-3 pt-1">
          <label className="block font-bold text-slate-900 text-xs">
            Choose Required Weight (kg):
          </label>

          {/* Option A: Dropdown Selector */}
          <div>
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(Number(e.target.value))}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-black focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-sm cursor-pointer"
            >
              {weightOptions.map((w) => (
                <option key={w} value={w}>
                  {w} kg  (Total: ₹{(w * pricePerKg).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Option B: Slider + Stepper */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Adjust with Slider / Stepper:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={selectedWeight <= limits.minKg}
                  className="p-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-800 rounded-xl font-bold shadow-sm transition-all"
                  title="Decrease weight by 1 kg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-black text-slate-900 w-14 text-center px-2 py-1 bg-white border border-slate-300 rounded-xl">
                  {selectedWeight} <span className="text-xs font-normal text-slate-500">kg</span>
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={selectedWeight >= limits.maxKg}
                  className="p-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-800 rounded-xl font-bold shadow-sm transition-all"
                  title="Increase weight by 1 kg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              type="range"
              min={limits.minKg}
              max={limits.maxKg}
              step={1}
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(Number(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>{limits.minKg} kg (Min)</span>
              <span>{limits.maxKg} kg (Max)</span>
            </div>
          </div>
        </div>

        {/* Read-Only Price per KG & Live Calculated Total Price */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2">
            <span>Price per KG (Set by Farm):</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ₹{pricePerKg} / kg
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Calculated Total Price ({selectedWeight} kg × ₹{pricePerKg})
              </span>
              <span className="text-2xl font-black text-amber-400 tracking-tight">
                ₹{calculatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-lg">
              Live Price
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isAdded}
            className="flex-2 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
          >
            {isAdded ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Add {selectedWeight} kg to Cart (₹{calculatedTotal.toLocaleString('en-IN')})
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
