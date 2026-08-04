import React, { useState } from 'react';
import { User } from '../types';
import { AUTHORIZED_OWNERS } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Phone, KeyRound, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';

interface OwnerOTPVerificationModalProps {
  isOpen: boolean;
  workerUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerOTPVerificationModal: React.FC<OwnerOTPVerificationModalProps> = ({
  isOpen,
  workerUser,
  onClose,
  onSuccess
}) => {
  const { activateWorkerAccount } = useAuth();
  const [selectedOwner, setSelectedOwner] = useState(AUTHORIZED_OWNERS[0]);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [enteredOTP, setEnteredOTP] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendOTP = () => {
    // Generate a clean 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(code);
    setError(null);
    const msg = `📱 SMS dispatched to Owner ${selectedOwner.name} (+91 ${selectedOwner.mobile}): Your Worker Approval OTP code for ${workerUser.fullName} is ${code}`;
    setSmsNotification(msg);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedOTP) {
      setError('Please click "Send OTP to Owner" first to generate the verification code.');
      return;
    }

    if (enteredOTP.trim() !== generatedOTP) {
      setError('Invalid OTP code. Please enter the correct 6-digit code sent to the Owner.');
      return;
    }

    // Success OTP verification!
    const activated = await activateWorkerAccount(workerUser.id);
    if (activated) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setError('Failed to activate worker account. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#04140E]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#062C1E] text-[#F2F2ED] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#C5A059]/40 relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-emerald-200/60 hover:text-[#C5A059] rounded-xl hover:bg-[#04140E] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#04140E] text-[#C5A059] border border-[#C5A059]/40 rounded-2xl shadow-inner">
            <ShieldCheck className="w-7 h-7 text-[#C5A059]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-serif-brand font-bold text-[#F2F2ED]">
            Owner OTP Verification
          </h3>
          <p className="text-xs text-emerald-200/80">
            Worker accounts remain in <strong className="text-[#C5A059]">Pending Approval</strong> until an authorized owner verifies OTP.
          </p>
        </div>

        {/* Registered Worker Summary Badge */}
        <div className="bg-[#04140E]/90 p-4 rounded-2xl border border-[#C5A059]/25 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-emerald-300/70 font-semibold uppercase tracking-wider text-[10px]">
              Worker Registration Request
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pending Approval
            </span>
          </div>
          <div className="flex items-center justify-between font-bold text-[#F2F2ED]">
            <span className="text-sm font-serif-brand text-[#C5A059]">{workerUser.fullName}</span>
            <span className="text-xs text-emerald-200/90">+91 {workerUser.mobileNumber}</span>
          </div>
          <div className="text-[11px] text-emerald-300/60">
            Role: <span className="capitalize text-white">Farm Worker</span> | Registered: {workerUser.createdAt}
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-[#C5A059] mx-auto" />
            <h4 className="text-lg font-bold text-[#F2F2ED]">Worker Account Activated!</h4>
            <p className="text-xs text-emerald-200/80">
              Authorized Owner verification complete. The worker account is now active and ready for login.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            
            {/* Step 1: Select Owner to Receive OTP */}
            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Select Authorized Owner for OTP Verification *
              </label>
              <div className="space-y-2">
                {AUTHORIZED_OWNERS.map((owner, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedOwner(owner);
                      setGeneratedOTP(null);
                      setSmsNotification(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all text-xs font-bold ${
                      selectedOwner.mobile === owner.mobile
                        ? 'bg-[#04140E] border-[#C5A059] text-[#F2F2ED] shadow-md'
                        : 'bg-[#062C1E]/60 border-[#C5A059]/20 text-emerald-200/70 hover:border-[#C5A059]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#C5A059]" />
                      <div>
                        <div className="font-serif-brand text-[#F2F2ED]">{owner.name}</div>
                        <div className="text-[10px] text-emerald-300/70">+91 {owner.mobile}</div>
                      </div>
                    </div>
                    {selectedOwner.mobile === owner.mobile && (
                      <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/30">
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Send OTP Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full py-2.5 bg-[#04140E] hover:bg-[#082218] text-[#C5A059] border border-[#C5A059]/50 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow"
              >
                <Send className="w-4 h-4 text-[#C5A059]" /> 
                {generatedOTP ? 'Resend OTP to Owner' : `Send OTP to ${selectedOwner.name} (+91 ${selectedOwner.mobile})`}
              </button>
            </div>

            {/* Simulated SMS Toast Notice */}
            {smsNotification && (
              <div className="p-3 bg-[#04140E] border border-[#C5A059]/40 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#C5A059]">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> SMS Dispatch Notice
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setEnteredOTP(generatedOTP || '')}
                    className="text-[10px] text-emerald-300 hover:underline uppercase"
                  >
                    Auto-Fill Code
                  </button>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  {smsNotification}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 3: Enter OTP */}
            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Enter 6-Digit Owner Verification OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="Enter 6-digit OTP (e.g. 849201)"
                value={enteredOTP}
                onChange={e => setEnteredOTP(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.3em] font-mono text-lg font-bold px-4 py-3 bg-[#04140E] border border-[#C5A059]/40 rounded-xl text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059] focus:outline-none placeholder:text-emerald-200/30 placeholder:tracking-normal"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
            >
              <ShieldCheck className="w-4 h-4" /> Verify OTP & Activate Worker Account
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
