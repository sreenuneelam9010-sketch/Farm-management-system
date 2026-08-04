import React, { useState, useEffect } from 'react';
import { OwnerCards } from '../components/OwnerCards';
import { ContactSection } from '../components/ContactSection';
import { InfiniteGalleryMarquee } from '../components/InfiniteGalleryMarquee';
import { BrandLogo } from '../components/BrandLogo';
import { storageService, isFarmGalleryImage } from '../lib/storage';
import { GalleryImageItem } from '../types';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Feather, 
  Wheat, 
  Users, 
  Award,
  CheckCircle2,
  ExternalLink,
  Camera
} from 'lucide-react';

interface HomePageProps {
  setActivePage: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActivePage }) => {
  const [uploadedImages, setUploadedImages] = useState<GalleryImageItem[]>([]);

  useEffect(() => {
    loadUploadedPhotos();
    const handleUpdate = () => loadUploadedPhotos();
    window.addEventListener('farm_gallery_updated', handleUpdate);
    return () => window.removeEventListener('farm_gallery_updated', handleUpdate);
  }, []);

  const loadUploadedPhotos = async () => {
    try {
      const items = await storageService.getGalleryImages();
      const valid = (items || []).filter(isFarmGalleryImage);
      setUploadedImages(valid);
    } catch {
      setUploadedImages([]);
    }
  };

  const [img1Error, setImg1Error] = useState(false);
  const [img2Error, setImg2Error] = useState(false);

  const img1 = uploadedImages.find(i => i.title === 'f1.jpeg' || i.missingFileName === 'f1.jpeg') || uploadedImages[0];
  const img2 = uploadedImages.find(i => i.title === 'f11.jpeg' || i.missingFileName === 'f11.jpeg') || uploadedImages[1];
  const heroBgImage = img1 && !img1.isMissing && !img1Error ? img1.image_url : null;

  return (
    <div className="space-y-0">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#04140E] text-[#F2F2ED]">
        {/* Full screen farm background image if uploaded images exist */}
        {heroBgImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transform duration-1000 opacity-25"
            style={{ backgroundImage: `url('${heroBgImage}')` }}
          ></div>
        )}

        {/* Green transparent overlay with glassmorphism glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04140E]/95 via-[#062C1E]/80 to-[#04140E]"></div>

        {/* Hero Content */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-10">
          
          {/* Official Brand Logo Emblem */}
          <div className="mb-6 flex justify-center transform hover:scale-105 transition-transform">
            <BrandLogo variant="icon" size={120} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#062C1E] border border-[#C5A059]/40 backdrop-blur-md text-[#C5A059] text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 shadow-xl">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            Pure Organic Livestock & Native Country Poultry
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif-brand font-bold tracking-tight text-[#F2F2ED] leading-tight">
            Lakshmi Venkateshwara<br />
            <span className="text-[#C5A059]">
              Sheep & Natu Kolla Farm
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-2xl font-serif-brand text-emerald-200/90 max-w-3xl mx-auto drop-shadow">
            Healthy Sheep • Native Chickens • Organic Farming • Trusted Farm
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('animals')}
              id="btn-explore-farm"
              className="w-full sm:w-auto px-8 py-4 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black uppercase text-sm tracking-wider rounded-2xl shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Explore Farm <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6"
              target="_blank"
              rel="noreferrer"
              id="btn-hero-location"
              className="w-full sm:w-auto px-8 py-4 bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] font-bold uppercase text-sm tracking-wider rounded-2xl border border-[#C5A059]/40 backdrop-blur-md transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              View Farm Location <MapPin className="w-4 h-4 text-[#C5A059]" />
            </a>

            <button
              onClick={() => setActivePage('contact')}
              id="btn-hero-contact"
              className="w-full sm:w-auto px-8 py-4 bg-[#04140E] hover:bg-[#062C1E] text-emerald-200 font-bold uppercase text-sm tracking-wider rounded-2xl border border-[#C5A059]/30 backdrop-blur-md transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Contact Us <Phone className="w-4 h-4 text-[#C5A059]" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="dark-glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-serif-brand font-bold text-[#C5A059]">100%</div>
              <div className="text-xs text-emerald-200/80 mt-1 font-semibold uppercase tracking-wider">Pure Local Sheep</div>
            </div>
            <div className="dark-glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-serif-brand font-bold text-[#C5A059]">Free Range</div>
              <div className="text-xs text-emerald-200/80 mt-1 font-semibold uppercase tracking-wider">Organic Natu Kolla</div>
            </div>
            <div className="dark-glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-serif-brand font-bold text-[#C5A059]">0%</div>
              <div className="text-xs text-emerald-200/80 mt-1 font-semibold uppercase tracking-wider">Antibiotic Residue</div>
            </div>
            <div className="dark-glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-serif-brand font-bold text-[#C5A059]">Trusted</div>
              <div className="text-xs text-emerald-200/80 mt-1 font-semibold uppercase tracking-wider">Direct Farm Sale</div>
            </div>
          </div>

        </div>
      </section>

      {/* OWNER SECTION */}
      <OwnerCards />

      {/* ABOUT FARM SECTION */}
      <section id="about" className="py-20 bg-[#04140E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> About Our Organic Farm
              </span>

              <h2 className="text-3xl sm:text-4xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight leading-tight">
                Authentic Native Breeding & Sustainable Agriculture
              </h2>

              <p className="text-emerald-200/80 leading-relaxed text-base">
                Lakshmi Venkateshwara Sheep & Natu Kolla Farm was established with a singular vision: to preserve native livestock genetics, produce nutrient-dense organic country chickens, and grow high-protein green fodder and pasture grass for livestock.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { title: 'Sheep Farming', desc: 'Pure Local Jodipi, Palla & Deccani black sheep breeds' },
                  { title: 'Native Chicken Farming', desc: '100% free-range Aseel and country Natu Kolla flocks' },
                  { title: 'Organic Farming', desc: 'Natural green fodder grazing, zero chemical hormone feed' },
                  { title: 'Healthy Feed', desc: 'Nutrient balanced Subabul, maize, and millet nutrition' },
                  { title: 'Experienced Farmers', desc: 'Decades of direct practical animal husbandry care' },
                  { title: 'Trusted Quality', desc: 'Complete health guarantee & vaccination records' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#062C1E]/60 border border-[#C5A059]/20">
                    <CheckCircle2 className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-[#F2F2ED]">{item.title}</h4>
                      <p className="text-xs text-emerald-300/70 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                {img1 && !img1.isMissing && !img1Error ? (
                  <img
                    src={img1.image_url}
                    alt="f1.jpeg"
                    onError={() => setImg1Error(true)}
                    className="rounded-3xl shadow-2xl object-cover h-64 w-full border border-[#C5A059]/30 hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="dark-glass-card rounded-3xl p-6 border border-[#C5A059]/30 h-64 w-full flex flex-col justify-center items-center text-center space-y-2 bg-[#062C1E]/80">
                    <Camera className="w-8 h-8 text-[#C5A059]/70" />
                    <p className="text-xs text-[#C5A059] font-mono font-semibold px-2">
                      f1.jpeg not found in farm-images bucket
                    </p>
                  </div>
                )}

                {img2 && !img2.isMissing && !img2Error ? (
                  <img
                    src={img2.image_url}
                    alt="f11.jpeg"
                    onError={() => setImg2Error(true)}
                    className="rounded-3xl shadow-2xl object-cover h-64 w-full border border-[#C5A059]/30 mt-8 hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="dark-glass-card rounded-3xl p-6 border border-[#C5A059]/30 h-64 w-full mt-8 flex flex-col justify-center items-center text-center space-y-2 bg-[#062C1E]/80">
                    <Camera className="w-8 h-8 text-[#C5A059]/70" />
                    <p className="text-xs text-[#C5A059] font-mono font-semibold px-2">
                      f11.jpeg not found in farm-images bucket
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-[#020B07] text-[#F2F2ED] border-y border-[#C5A059]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif-brand font-bold tracking-tight sm:text-4xl text-[#F2F2ED]">
              Why Customers Choose Our Farm
            </h2>
            <p className="mt-3 text-base text-emerald-200/80">
              Uncompromising standards in animal welfare, organic feeding, and customer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Healthy Animals', desc: 'Regular veterinary checkups, PPR/deworming vaccinations, and daily hygiene maintenance.', icon: ShieldCheck },
              { title: 'Organic Farming', desc: 'Zero synthetic growth stimulants. Animals graze naturally in open green pastures.', icon: Wheat },
              { title: 'Experienced Staff', desc: 'Dedicated farm workers monitoring feed ratios, breeding cycles, and animal health 24/7.', icon: Users },
              { title: 'Fresh Products', desc: 'High-protein green grass fodder freshly cut daily and live Natu Kolla/sheep prepared directly upon order.', icon: Feather },
              { title: 'Fast Support', desc: 'Direct owner communication via Phone & WhatsApp for immediate farm inquiries.', icon: Phone },
              { title: 'Trusted Service', desc: 'Serving hundreds of local families, restaurant owners, and agricultural buyers.', icon: Award }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="dark-glass-card p-8 rounded-3xl border border-[#C5A059]/20 hover:border-[#C5A059]/60 transition-all group">
                  <div className="w-12 h-12 bg-[#062C1E] text-[#C5A059] rounded-2xl flex items-center justify-center mb-6 border border-[#C5A059]/30 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#C5A059]" />
                  </div>
                  <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED] mb-2">{feature.title}</h3>
                  <p className="text-xs text-emerald-200/70 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INFINITE SCROLLING FARM PHOTO GALLERY MARQUEE */}
      <InfiniteGalleryMarquee />

      {/* CALL TO ACTION SECTION */}
      <section className="py-16 bg-[#062C1E] text-[#F2F2ED] relative overflow-hidden border-b border-[#C5A059]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-serif-brand font-bold tracking-tight text-[#F2F2ED]">
            Visit Our Farm Today
          </h2>
          <p className="mt-4 text-base text-emerald-200/90 max-w-2xl mx-auto">
            Experience authentic rural sheep and country chicken farming firsthand. Inspect our animals, order fresh green grass fodder, or book breeding rams.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+919502756669"
              id="btn-cta-call"
              className="w-full sm:w-auto px-8 py-4 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Primary Contact: 9502756669
            </a>

            <a
              href="https://wa.me/919502756669"
              target="_blank"
              rel="noreferrer"
              id="btn-cta-whatsapp"
              className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-2xl shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Chat
            </a>

            <a
              href="https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6"
              target="_blank"
              rel="noreferrer"
              id="btn-cta-location"
              className="w-full sm:w-auto px-8 py-4 bg-[#04140E] hover:bg-[#062C1E] text-[#C5A059] font-bold uppercase text-xs tracking-wider rounded-2xl border border-[#C5A059]/40 shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#C5A059]" /> View Farm Location
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT & MAP SECTION */}
      <ContactSection />

    </div>
  );
};
