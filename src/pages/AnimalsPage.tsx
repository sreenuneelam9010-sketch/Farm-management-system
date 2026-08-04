import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AnimalTaggingModule } from '../components/AnimalTaggingModule';
import { Tag } from 'lucide-react';

export const AnimalsPage: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="py-12 bg-[#04140E] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 mb-3">
            <Tag className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> Registered Farm Livestock Tagging
          </span>
          <h1 className="text-3xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight sm:text-4xl">
            Animal Tagging & QR Identification Catalog
          </h1>
          <p className="mt-3 text-emerald-200/80 text-base">
            Official farm livestock management catalog. Tracks unique QR tag IDs, health status, age, weight, and sale statuses for registered sheep, goats, and Natu Kolla.
          </p>
        </div>

        {/* Modular Animal Tagging Table Component */}
        <AnimalTaggingModule userRole={role} />

      </div>
    </div>
  );
};
