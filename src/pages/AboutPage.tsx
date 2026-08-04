import React, { useEffect, useState } from 'react';
import { OwnerCards } from '../components/OwnerCards';
import { ShieldCheck, Wheat, Award, MapPin, ExternalLink } from 'lucide-react';
import { db, FarmInfo } from '../lib/db';

export const AboutPage: React.FC = () => {
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(() => db.getFarmInfo());

  useEffect(() => {
    const handleUpdate = () => setFarmInfo(db.getFarmInfo());
    window.addEventListener('farm_info_updated', handleUpdate);
    return () => window.removeEventListener('farm_info_updated', handleUpdate);
  }, []);

  return (
    <div className="py-12 bg-[#04140E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> Our Heritage & Vision
          </span>
          <h1 className="text-3xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight sm:text-4xl">
            {farmInfo.farmName}
          </h1>
          <p className="mt-4 text-emerald-200/90 text-base leading-relaxed max-w-2xl mx-auto">
            {farmInfo.farmDescription}
          </p>
        </div>

        {/* Location & Address Card */}
        <div className="mb-16 dark-glass-card p-8 rounded-3xl border border-[#C5A059]/30 bg-[#062C1E]/80 text-center max-w-3xl mx-auto shadow-xl">
          <div className="w-12 h-12 bg-[#04140E] text-[#C5A059] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#C5A059]/40">
            <MapPin className="w-6 h-6 text-[#C5A059]" />
          </div>
          <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED] mb-2">Farm Address & Location</h3>
          <a
            href={farmInfo.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-emerald-100 hover:text-[#C5A059] font-medium leading-relaxed block max-w-xl mx-auto mb-6 hover:underline transition-colors"
            title="Click to view location on Google Maps"
          >
            📍 {farmInfo.address}
          </a>
          <a
            href={farmInfo.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            id="btn-about-view-location"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            View Farm Location <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="dark-glass-card p-8 rounded-3xl border border-[#C5A059]/20 hover:border-[#C5A059]/60 transition-colors">
            <div className="w-12 h-12 bg-[#062C1E] text-[#C5A059] rounded-2xl flex items-center justify-center mb-6 border border-[#C5A059]/30">
              <Wheat className="w-6 h-6 text-[#C5A059]" />
            </div>
            <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED] mb-3">100% Organic Fodder</h3>
            <p className="text-xs text-emerald-200/70 leading-relaxed">
              Animals are fed on high-protein leguminous crops (Lucerne, Subabul) combined with natural groundnut mash and mineral blocks.
            </p>
          </div>

          <div className="dark-glass-card p-8 rounded-3xl border border-[#C5A059]/20 hover:border-[#C5A059]/60 transition-colors">
            <div className="w-12 h-12 bg-[#062C1E] text-[#C5A059] rounded-2xl flex items-center justify-center mb-6 border border-[#C5A059]/30">
              <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
            </div>
            <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED] mb-3">Rigorous Health Protocols</h3>
            <p className="text-xs text-emerald-200/70 leading-relaxed">
              Every sheep and chicken flock undergoes scheduled PPR vaccinations, Ranikhet LaSota drops, and bi-monthly veterinary inspections.
            </p>
          </div>

          <div className="dark-glass-card p-8 rounded-3xl border border-[#C5A059]/20 hover:border-[#C5A059]/60 transition-colors">
            <div className="w-12 h-12 bg-[#062C1E] text-[#C5A059] rounded-2xl flex items-center justify-center mb-6 border border-[#C5A059]/30">
              <Award className="w-6 h-6 text-[#C5A059]" />
            </div>
            <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED] mb-3">Direct Farm Sales</h3>
            <p className="text-xs text-emerald-200/70 leading-relaxed">
              Eliminating middlemen to provide competitive prices directly to individual buyers, wedding caters, and organic food enthusiasts.
            </p>
          </div>
        </div>

        {/* Owners Section */}
        <OwnerCards />

      </div>
    </div>
  );
};
