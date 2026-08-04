import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { Phone, MessageSquare, MapPin, ExternalLink } from 'lucide-react';
import { db, FarmInfo } from '../lib/db';

interface FooterProps {
  setActivePage: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActivePage }) => {
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(() => db.getFarmInfo());

  useEffect(() => {
    const handleUpdate = () => setFarmInfo(db.getFarmInfo());
    window.addEventListener('farm_info_updated', handleUpdate);
    return () => window.removeEventListener('farm_info_updated', handleUpdate);
  }, []);

  const handleNavClick = (id: string) => {
    setActivePage(id);
  };

  return (
    <footer className="bg-[#020B07] text-[#F2F2ED]/80 border-t border-[#C5A059]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <BrandLogo variant="main" showTagline={true} />
            <p className="text-sm text-emerald-200/70 leading-relaxed max-w-md pt-1">
              {farmInfo.farmDescription}
            </p>
            <div className="pt-2 space-y-2">
              <a
                href={farmInfo.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-200 hover:text-[#C5A059] block font-semibold leading-relaxed hover:underline transition-colors"
                title="Click to open location in Google Maps"
              >
                📍 {farmInfo.address}
              </a>
              <a
                href={farmInfo.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-footer-maps"
                className="inline-flex items-center text-xs font-bold text-[#C5A059] hover:text-white bg-[#062C1E] border border-[#C5A059]/40 px-3.5 py-2 rounded-xl transition-all shadow cursor-pointer"
              >
                <MapPin className="w-4 h-4 mr-2 text-[#C5A059]" />
                View Farm Location <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>
          </div>

          {/* Owners & Contact */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-extrabold text-[#C5A059] uppercase tracking-wider">
              Farm Leadership & Primary Contact
            </h4>
            <div className="space-y-3 text-sm">
              <div className="bg-[#062C1E]/80 p-4 rounded-2xl border border-[#C5A059]/30 shadow-sm">
                <div className="font-bold text-[#F2F2ED] text-sm">Primary Contact: Neelam Ramachandraiah</div>
                <a href="tel:+919502756669" className="text-[#C5A059] hover:underline text-base flex items-center mt-1.5 font-extrabold">
                  <Phone className="w-4 h-4 mr-1.5" /> +91 9502756669
                </a>
              </div>

              <div className="bg-[#062C1E] p-3.5 rounded-2xl border border-[#C5A059]/40 text-xs">
                <span className="font-bold text-[#C5A059]">WhatsApp Helpline:</span>
                <a
                  href="https://wa.me/919502756669"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-extrabold text-white hover:text-[#C5A059] underline inline-flex items-center"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-green-400" /> +91 9502756669
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold text-[#C5A059] uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              {[
                { label: 'Home', id: 'home' },
                { label: 'About Farm', id: 'about' },
                { label: 'Livestock & Poultry', id: 'animals' },
                { label: 'Products & Shop', id: 'products' },
                { label: 'Photo Gallery', id: 'gallery' },
                { label: 'Contact Us', id: 'contact' },
                { label: 'Login', id: 'login' },
                { label: 'Register Account', id: 'register' }
              ].map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className="text-emerald-200/70 hover:text-[#C5A059] transition-colors"
                  >
                    • {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright & Info */}
        <div className="mt-12 pt-8 border-t border-[#C5A059]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/50">
          <div>
            © {new Date().getFullYear()} Lakshmi Venkateshwara Sheep & Natu Kolla Farm. All rights reserved.
          </div>

          <div className="flex items-center gap-1 text-[#C5A059]">
            Engineered for Real Farm Management
          </div>
        </div>
      </div>
    </footer>
  );
};
