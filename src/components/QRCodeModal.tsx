import React from 'react';
import { X, Printer, QrCode, ShieldCheck } from 'lucide-react';
import { Animal } from '../types';

interface QRCodeModalProps {
  animal: Animal | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ animal, onClose }) => {
  if (!animal) return null;

  const handlePrint = () => {
    window.print();
  };

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LVFARM_TAG_${animal.tagNumber}_${animal.breed}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Animal Tag QR Code</h3>
          <p className="text-xs text-slate-500 mt-1">Lakshmi Venkateshwara Sheep & Natu Kolla Farm Identification</p>
        </div>

        <div id="qr-code-print-area" className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
          <img
            src={qrDataUrl}
            alt={`QR Code for ${animal.tagNumber}`}
            className="w-48 h-48 mx-auto rounded-xl shadow-md bg-white p-2 border border-slate-200"
          />
          <div className="mt-4">
            <span className="inline-block px-3 py-1 bg-emerald-800 text-white font-mono font-bold text-sm rounded-lg tracking-wider">
              {animal.tagNumber}
            </span>
            <div className="text-sm font-bold text-slate-900 mt-2">{animal.breed}</div>
            <div className="text-xs text-slate-600 mt-1">
              Category: {animal.category} | Weight: {animal.weightKg} kg | Age: {animal.ageMonths} mo
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Health: {animal.status} ({animal.vaccinationStatus})
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" /> Print Tag Sticker
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
