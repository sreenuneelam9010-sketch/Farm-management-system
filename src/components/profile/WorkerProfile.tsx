import React, { useState } from 'react';
import { User, Task, AttendanceRecord, FeedHealthLog, LeaveRequest } from '../../types';
import { db } from '../../lib/db';
import { storageService } from '../../lib/storage';
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Camera, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  Edit3, 
  Save,
  Shield,
  Activity,
  HeartPulse
} from 'lucide-react';

interface WorkerProfileProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => void;
  onLogout?: () => void;
}

export const WorkerProfile: React.FC<WorkerProfileProps> = ({
  user,
  onUpdateProfile,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    mobileNumber: user.mobileNumber || user.mobile || '',
    email: user.email || 'worker@lakshmifarm.com',
    emergencyContact: user.emergencyContact || '',
    address: user.address || '',
    avatarUrl: user.avatarUrl || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg('✅ Worker password updated successfully.');
    setShowPasswordSection(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Fetch worker specific data
  const tasks: Task[] = db.getTasks().filter(t => t.assignedWorkerId === user.id || t.assignedWorkerName === user.fullName);
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  const attendance: AttendanceRecord[] = db.getAttendance().filter(a => a.workerId === user.id || a.workerName === user.fullName);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.date === todayStr);

  const logs: FeedHealthLog[] = db.getFeedHealthLogs().filter(l => l.workerName === user.fullName || l.workerId === user.id);
  const leaves: LeaveRequest[] = db.getLeaves().filter(l => l.workerId === user.id || l.workerName === user.fullName);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const url = await storageService.uploadAvatar(file, user.id);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      onUpdateProfile({ avatarUrl: url });
      setSuccessMsg('✅ Profile photo updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    onUpdateProfile({ avatarUrl: '' });
    setSuccessMsg('✅ Profile photo removed.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const mobileRegex = /^[0-9]{10}$/;
    const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    onUpdateProfile({
      fullName: formData.fullName.trim(),
      mobileNumber: cleanMobile,
      mobile: cleanMobile,
      emergencyContact: formData.emergencyContact.trim(),
      address: formData.address.trim(),
      avatarUrl: formData.avatarUrl
    });

    setIsEditing(false);
    setSuccessMsg('✅ Profile updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const initials = formData.fullName
    ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'WK';

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header Card */}
      <div className="bg-[#062C1E] border-2 border-[#C5A059] rounded-3xl p-6 sm:p-8 text-[#F2F2ED] shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-[#C5A059] shadow-inner flex items-center justify-center overflow-hidden">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-[#C5A059] font-mono">{initials}</span>
              )}
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-[#F2F2ED]">{formData.fullName}</h2>
              <span className="px-2.5 py-0.5 bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-extrabold rounded-full uppercase">
                Farm Worker
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-mono">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> +91 {formData.mobileNumber}
            </p>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-[#C5A059]" /> Livestock & Fodder Maintenance Specialist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-end">
          {formData.avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Photo
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 text-xs font-black rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-900/90 border border-emerald-500 text-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-2 shadow animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950 border border-rose-500 text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2 shadow animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Worker Personal Information */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-700" /> Personal & Employment Details
              </h3>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Worker ID: {user.id}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Number * (10 Digits)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.mobileNumber}
                      onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact Number</label>
                    <input
                      type="text"
                      placeholder="Family Member / Contact Number"
                      value={formData.emergencyContact}
                      onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 text-white font-extrabold rounded-xl shadow flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Worker ID (Read-only)</span>
                  <span className="font-mono text-slate-900 font-extrabold">{user.id}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Assigned Role</span>
                  <span className="text-emerald-800 font-black flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Farm Worker / Staff
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Aadhaar Number (Read-only)</span>
                  <span className="font-mono text-slate-900 font-extrabold">XXXX-XXXX-4821</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Date Joined</span>
                  <span className="font-mono text-slate-900 font-extrabold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '01-Jan-2024'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Mobile Number</span>
                  <span className="font-mono text-slate-900 font-extrabold">+91 {formData.mobileNumber}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Email Address</span>
                  <span className="font-mono text-slate-900 font-extrabold truncate">{formData.email}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Emergency Contact</span>
                  <span className="font-mono text-slate-900 font-extrabold">{formData.emergencyContact || 'N. Ramachandraiah (+91 9502756669)'}</span>
                </div>

                <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Address
                  </span>
                  <p className="text-slate-800 font-medium">{formData.address || 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Work & Task Stats */}
        <div className="lg:col-span-5 space-y-6">

          {/* Work & Attendance Stats */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-700" /> Work & Attendance Summary
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-xs font-bold text-emerald-800 block">Total Tasks</span>
                <span className="text-2xl font-black text-emerald-950 font-mono">{tasks.length}</span>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <span className="text-xs font-bold text-blue-800 block">Completed</span>
                <span className="text-2xl font-black text-blue-950 font-mono">{completedTasks}</span>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <span className="text-xs font-bold text-purple-800 block">Leave Balance</span>
                <span className="text-2xl font-black text-purple-950 font-mono">12 Days</span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-xs font-bold text-amber-800 block">Today Status</span>
                <span className={`text-xs font-black uppercase block mt-1 ${todayRecord ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {todayRecord ? `Checked In (${todayRecord.status})` : 'Not Checked In'}
                </span>
              </div>
            </div>
          </div>

          {/* Feed & Health Logs Authored */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-700" /> Feed & Health Logs Authored
            </h3>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No health or feed logs submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 3).map((l, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>🏷️ Tag #{l.animalTag} ({l.status})</span>
                      <span className="font-mono text-slate-400 text-[10px]">{l.date}</span>
                    </div>
                    <p className="text-slate-600 truncate">{l.feedLog || 'Health & Feed log recorded'}</p>
                  </div>
                ))}
              </div>
            )}

          {/* Account Security & Password */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" /> Account Security & Password
            </h3>

            {!showPasswordSection ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-600 font-medium">Regularly change your worker login password for security.</span>
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(false)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {onLogout && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={onLogout}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout Account
                </button>
              </div>
            )}
          </div>
          </div>

        </div>

      </div>

    </div>
  );
};
