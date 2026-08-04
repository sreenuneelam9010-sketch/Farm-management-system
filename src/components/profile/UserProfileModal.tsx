import React from 'react';
import { User } from '../../types';
import { X, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { getFounderAvatarUrl } from '../../lib/storage';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#062C1E] border-2 border-[#C5A059] text-[#F2F2ED] rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-black/40 hover:bg-black/80 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Header */}
        <div className="flex items-center gap-4 border-b border-[#C5A059]/30 pb-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-[#C5A059] shadow-inner flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={getFounderAvatarUrl(user.id, user.fullName, user.avatarUrl)}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-[#F2F2ED]">{user.fullName}</h3>
              <span className="px-2.5 py-0.5 bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 rounded-full text-[10px] font-bold uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> {user.email}
            </p>
          </div>
        </div>

        {/* Read-only Information Grid */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-black/40 p-4 rounded-2xl border border-[#C5A059]/20">
            <div>
              <span className="text-[#C5A059] font-bold block">User ID</span>
              <span className="font-mono text-slate-200">{user.id}</span>
            </div>
            <div>
              <span className="text-[#C5A059] font-bold block">Mobile Number</span>
              <span className="font-mono text-slate-200">{user.mobileNumber || user.mobile || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#C5A059] font-bold block">Account Status</span>
              <span className={`font-bold ${user.status === 'Active' || !user.status ? 'text-emerald-400' : 'text-amber-400'}`}>
                {user.status || 'Active'}
              </span>
            </div>
            <div>
              <span className="text-[#C5A059] font-bold block">Joined Date</span>
              <span className="font-mono text-slate-200">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
          </div>

          {user.address && (
            <div className="bg-black/40 p-3.5 rounded-2xl border border-[#C5A059]/20 space-y-1">
              <span className="text-[#C5A059] font-bold block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Address
              </span>
              <p className="text-slate-300 leading-relaxed">{user.address}</p>
            </div>
          )}

          {user.role === 'worker' && user.emergencyContact && (
            <div className="bg-black/40 p-3.5 rounded-2xl border border-[#C5A059]/20 space-y-1">
              <span className="text-[#C5A059] font-bold block">Emergency Contact</span>
              <p className="text-slate-300">{user.emergencyContact}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 bg-black/30 p-3 rounded-xl border border-slate-800 text-center">
          ℹ️ Admin Read-Only View. Personal details can only be modified directly by the account owner.
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
