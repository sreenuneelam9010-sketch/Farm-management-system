import React from 'react';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

interface AccessDeniedScreenProps {
  message?: string;
  onGoHome?: () => void;
  onGoLogin?: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  message = "Access Denied. You are not an authorized farm administrator.",
  onGoHome,
  onGoLogin
}) => {
  return (
    <div className="py-16 bg-[#04140E] min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full dark-glass-card rounded-3xl shadow-2xl border border-red-500/40 p-8 text-center space-y-6">
        
        {/* Shield Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-950/80 text-red-400 border border-red-500/50 rounded-3xl shadow-2xl animate-bounce">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-500/30">
            Security Restriction
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif-brand font-bold text-[#F2F2ED] mt-3">
            Access Restricted
          </h2>
          <p className="text-xs text-emerald-200/70 mt-1">
            Lakshmi Venkateshwara Sheep & Natu Kolla Farm
          </p>
        </div>

        {/* Error Callout */}
        <div className="p-4 bg-red-950/90 border border-red-500/60 rounded-2xl text-red-200 text-xs font-semibold leading-relaxed shadow-inner">
          <div className="flex items-center justify-center gap-2 mb-1 text-red-300 font-bold uppercase tracking-wider text-[11px]">
            <Lock className="w-4 h-4 text-red-400" /> Unauthorized Account Access
          </div>
          {message}
        </div>

        {/* Informational Guidance */}
        <div className="p-4 bg-[#062C1E]/90 rounded-2xl border border-[#C5A059]/20 text-[11px] text-emerald-200/80 text-left space-y-2">
          <div className="font-bold text-[#C5A059] uppercase tracking-wider text-[10px]">
            Owner / Admin Authorization Policy:
          </div>
          <p className="leading-relaxed">
            Administrative access is granted based on verified database roles (<span className="text-[#C5A059] font-bold">owner</span> or <span className="text-[#C5A059] font-bold">admin</span>). Please sign in with an authorized administrator account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onGoLogin && (
            <button
              onClick={onGoLogin}
              className="flex-1 py-3 bg-[#062C1E] hover:bg-[#083827] text-[#C5A059] border border-[#C5A059]/40 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow"
            >
              <ArrowLeft className="w-4 h-4" /> Try Different Login
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex-1 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Home className="w-4 h-4" /> Return to Home
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
