import React from 'react';
import { Phone, ShieldCheck, UserCheck } from 'lucide-react';

import founder1 from '../assets/founders/founder-1.jpg';
import founder2 from '../assets/founders/founder-2.jpg';
import founder3 from '../assets/founders/founder-3.jpg';

const FOUNDERS = [
  {
    id: 'founder-1',
    name: 'Neelam Ramachandraiah',
    designation: 'Founder',
    phone: '+91 9502756669',
    image: founder1,
  },
  {
    id: 'founder-2',
    name: 'Neelam Subbaiah',
    designation: 'Founder',
    phone: '+91 8897288390',
    image: founder2,
  },
  {
    id: 'founder-3',
    name: 'Neelam Sreenivasulu',
    designation: 'Digital Operator',
    phone: '+91 9392589010',
    image: founder3,
  },
];

export const OwnerCards: React.FC = () => {
  return (
    <section id="owners" className="py-16 bg-[#04140E] border-y border-[#C5A059]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 mb-3 shadow">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> Trusted Farm Leadership
          </span>
          <h2 className="text-3xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight sm:text-4xl">
            Meet Farm Founders & Leadership
          </h2>
          <p className="mt-3 text-base text-emerald-200/80">
            Dedicated livestock farmers and operators committed to organic native sheep and country chicken breeding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {FOUNDERS.map((founder) => (
            <div
              key={founder.id}
              className="dark-glass-card rounded-2xl p-6 shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <img
                      src={founder.image}
                      alt={founder.name}
                      loading="eager"
                      decoding="sync"
                      onError={() => console.error("Image failed:", founder.image)}
                      className="w-32 h-32 rounded-full object-cover border-2 border-[#C5A059] shadow-md group-hover:scale-105 transition-transform"
                    />

                    <span className="absolute bottom-0 right-0 bg-[#C5A059] text-slate-950 p-1 rounded-full text-xs shadow z-10">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] bg-[#062C1E] px-2.5 py-1 rounded border border-[#C5A059]/40 whitespace-nowrap inline-block">
                      {founder.designation}
                    </span>
                    <h3 className="mt-2 text-xl font-serif-brand font-bold text-[#F2F2ED]">
                      {founder.name}
                    </h3>
                    <p className="text-xs text-emerald-300/80 mt-1">
                      {founder.designation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#C5A059]/20 flex flex-col gap-2">
                <div className="text-xs font-semibold text-[#F2F2ED] text-center">
                  Phone: <span className="text-[#C5A059] font-bold">{founder.phone}</span>
                </div>
                <a
                  href={`tel:${founder.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow transition-colors w-full"
                >
                  <Phone className="w-3.5 h-3.5 mr-2" />
                  Call {founder.name}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

