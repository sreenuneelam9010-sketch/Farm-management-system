import React, { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess: (message: string) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess
}) => {
  const { sendPasswordResetEmail, verifyEmailResetOTP } = useAuth();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [expectedOTP, setExpectedOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPasswordResetEmail(email);
      if (res.success) {
        setExpectedOTP(res.otpCode || '');
        setEmailSentNotice(res.message);
        setStep('verify');
      } else {
        setError(res.message || 'Failed to dispatch password reset email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit Email Verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyEmailResetOTP(email, otpCode, expectedOTP, newPassword);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full dark-glass-card border border-[#C5A059]/40 rounded-3xl p-7 shadow-2xl space-y-6 relative">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 rounded-2xl mb-2 shadow-inner">
            <KeyRound className="w-7 h-7 text-[#C5A059]" />
          </div>
          <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED]">
            {step === 'request' ? 'Reset Password' : 'Verify Email Code'}
          </h3>
          <p className="text-xs text-emerald-200/70 mt-1">
            {step === 'request' 
              ? 'Enter your registered email address to receive password reset instructions.' 
              : `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Request Password Reset */}
        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Registered Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="yourname@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-xs font-bold text-emerald-200/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link & Code'}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Enter OTP Code and New Password */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {emailSentNotice && (
              <div className="p-3 bg-[#062C1E] border border-[#C5A059]/40 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                <p>{emailSentNotice}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-1.5 text-center">
                6-Digit Email OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="••••••"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-2.5 bg-[#04140E] border border-[#C5A059]/40 rounded-xl text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-[#C5A059] hover:text-white transition-colors"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-[#C5A059] hover:text-white transition-colors"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs font-bold text-emerald-200/80 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set New Password & Log In'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
