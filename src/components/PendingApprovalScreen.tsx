import React from 'react';
import { User } from '../types';
import { Clock, ShieldAlert, Phone, Home, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PendingApprovalScreenProps {
  pendingUser?: User | null;
  onGoHome: () => void;
  onRefreshStatus?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  pendingUser,
  onGoHome,
  onRefreshStatus
}) => {
  return (
    <div className="py-16 bg-[#04140E] min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full dark-glass-card rounded-3xl shadow-2xl border border-amber-500/40 p-8 space-y-6">
        
        {/* Status Header Icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-18 h-18 p-4 bg-amber-950/70 text-amber-400 border border-amber-500/50 rounded-3xl shadow-xl">
            <Clock className="w-9 h-9 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
              Registration Under Review
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-brand font-bold text-[#F2F2ED] mt-2">
              Worker Account Pending Approval
            </h2>
            <p className="text-xs text-emerald-200/70 mt-1">
              Lakshmi Venkateshwara Sheep & Natu Kolla Farm
            </p>
          </div>
        </div>

        {/* User Details Summary Badge */}
        {pendingUser && (
          <div className="bg-[#062C1E] p-4 rounded-2xl border border-[#C5A059]/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#C5A059] font-bold uppercase tracking-wider text-[10px]">
                Registered Worker Details
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Pending Approval
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-emerald-100 font-semibold pt-1">
              <div>Name: <span className="text-white font-bold">{pendingUser.fullName}</span></div>
              <div>Mobile: <span className="text-[#C5A059] font-bold">+91 {pendingUser.mobileNumber}</span></div>
              {pendingUser.address && (
                <div className="col-span-2 text-[11px] text-emerald-300/80">Address: {pendingUser.address}</div>
              )}
            </div>
          </div>
        )}

        {/* Informational Message */}
        <div className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-2xl text-amber-200 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Account Approval Policy
          </div>
          <p>
            Your worker registration has been submitted successfully. For security, all farm worker accounts require manual review and authorization by an Owner / Administrator before dashboard access is granted.
          </p>
        </div>

        {/* Owner Helpline Contacts */}
        <div className="p-4 bg-[#062C1E] rounded-2xl border border-[#C5A059]/25 space-y-2 text-xs">
          <div className="font-bold text-[#C5A059] uppercase tracking-wider text-[10px]">
            Contact Farm Owners for Fast Activation:
          </div>
          <div className="space-y-1.5 text-emerald-100 font-medium text-[11px]">
            <div className="flex items-center justify-between p-2 bg-[#04140E] rounded-xl border border-[#C5A059]/15">
              <span>👑 Neelam Ramachandraiah (Founder)</span>
              <a href="tel:+919502756669" className="text-[#C5A059] font-bold hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" /> 9502756669
              </a>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#04140E] rounded-xl border border-[#C5A059]/15">
              <span>👑 Neelam Subbaiah (Founder)</span>
              <a href="tel:+918897288390" className="text-[#C5A059] font-bold hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" /> 8897288390
              </a>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#04140E] rounded-xl border border-[#C5A059]/15">
              <span>👑 Neelam Sreenivasulu (Operator)</span>
              <a href="tel:+919392589010" className="text-[#C5A059] font-bold hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" /> 9392589010
              </a>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          {onRefreshStatus && (
            <button
              onClick={onRefreshStatus}
              className="flex-1 py-3 bg-[#062C1E] hover:bg-[#083d29] text-[#C5A059] border border-[#C5A059]/40 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow"
            >
              <RefreshCw className="w-4 h-4" /> Check Approval Status
            </button>
          )}
          <button
            onClick={onGoHome}
            className="flex-1 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Home className="w-4 h-4" /> Return to Home
          </button>
        </div>

      </div>
    </div>
  );
};
