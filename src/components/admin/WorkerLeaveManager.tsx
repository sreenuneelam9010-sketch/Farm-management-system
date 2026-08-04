import React, { useState, useMemo } from 'react';
import { LeaveRequest } from '../../types';
import { db } from '../../lib/db';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertTriangle,
  Filter,
  Search,
  User,
  Lock,
  X,
  Check
} from 'lucide-react';

interface WorkerLeaveManagerProps {
  userRole?: 'admin' | 'worker' | 'customer';
  currentWorkerId?: string;
  currentWorkerName?: string;
  onLeavesChanged?: () => void;
  isDarkMode?: boolean;
}

export const WorkerLeaveManager: React.FC<WorkerLeaveManagerProps> = ({
  userRole = 'worker',
  currentWorkerId = 'usr-worker',
  currentWorkerName = 'Farm Staff',
  onLeavesChanged,
  isDarkMode = true
}) => {
  const isAdmin = userRole === 'admin';

  // Load leaves from db
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => db.getLeaves());

  // Search & Filter state
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal State (Add or Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);

  // Form Fields
  const [formWorkerName, setFormWorkerName] = useState(currentWorkerName);
  const [formReason, setFormReason] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  // Review Modal State (Admin Approve/Reject)
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComment, setReviewComment] = useState('');

  // View Details Modal State
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);

  // Delete Confirmation Modal State
  const [deletingLeave, setDeletingLeave] = useState<LeaveRequest | null>(null);

  // Success Notification Banner
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Helper to calculate total days
  const calculateTotalDays = (startStr: string, endStr: string): number => {
    if (!startStr) return 0;
    const s = new Date(startStr);
    const e = new Date(endStr || startStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const calculatedFormDays = useMemo(() => {
    return calculateTotalDays(formStartDate, formEndDate);
  }, [formStartDate, formEndDate]);

  // Sync state with DB
  const updateLeavesList = (newLeaves: LeaveRequest[]) => {
    setLeaves(newLeaves);
    db.saveLeaves(newLeaves);
    onLeavesChanged?.();
  };

  // Get active staff list for Admin selection in leave form
  const getStaffOptions = () => {
    const deleted = db.getDeletedStaff();
    const dbWorkers = db.getUsers().filter(u => u.role === 'worker' || u.role === 'admin').map(u => u.fullName).filter(Boolean);
    const defaultStaff = ['Neelam Ramachandraiah', 'Neelam Subbaiah', 'Sreenu Neelam (Owner)', 'Farm Staff 1'];
    const set = new Set([...defaultStaff, ...dbWorkers]);
    return Array.from(set).filter(name => !deleted.includes(name));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingLeave(null);
    setFormWorkerName(isAdmin ? getStaffOptions()[0] || currentWorkerName : currentWorkerName);
    setFormReason('');
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    setFormEndDate(today);
    setIsFormOpen(true);
  };

  // Open Edit Modal (Rule: Worker can edit only if Pending)
  const handleOpenEditModal = (leave: LeaveRequest) => {
    if (!isAdmin && leave.status !== 'Pending') {
      showNotification('Locked: Approved or Rejected requests cannot be edited by workers.', 'error');
      return;
    }
    setEditingLeave(leave);
    setFormWorkerName(leave.workerName);
    setFormReason(leave.reason);
    setFormStartDate(leave.startDate);
    setFormEndDate(leave.endDate);
    setIsFormOpen(true);
  };

  // Save Leave Request (Create or Edit)
  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReason.trim() || !formStartDate) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    const totalDays = calculateTotalDays(formStartDate, formEndDate);

    if (editingLeave) {
      // Edit existing
      const updated = leaves.map(l => {
        if (l.id === editingLeave.id) {
          return {
            ...l,
            workerName: isAdmin ? formWorkerName : l.workerName,
            reason: formReason.trim(),
            startDate: formStartDate,
            endDate: formEndDate || formStartDate,
            totalDays,
            updatedAt: new Date().toISOString()
          };
        }
        return l;
      });
      updateLeavesList(updated);
      showNotification(`Leave request updated successfully (${totalDays} day${totalDays > 1 ? 's' : ''}).`, 'success');
    } else {
      // Create new
      const newLeave: LeaveRequest = {
        id: 'lev-' + Date.now(),
        workerId: currentWorkerId,
        workerName: isAdmin ? formWorkerName : currentWorkerName,
        reason: formReason.trim(),
        startDate: formStartDate,
        endDate: formEndDate || formStartDate,
        totalDays,
        status: 'Pending',
        appliedOn: new Date().toISOString().split('T')[0]
      };

      const updated = [newLeave, ...leaves];
      updateLeavesList(updated);

      // Create System Notification for Admin/Owner if submitted by worker
      if (!isAdmin) {
        db.addAppNotification({
          recipientRole: 'admin',
          title: 'New Leave Request Submitted',
          message: `${currentWorkerName} requested ${totalDays} day(s) leave for "${formReason.trim()}" (${formStartDate} to ${formEndDate || formStartDate}).`,
          type: 'leave'
        });
      }

      showNotification(`Leave request submitted successfully for ${totalDays} day${totalDays > 1 ? 's' : ''}!`, 'success');
    }

    setIsFormOpen(false);
  };

  // Handle Delete Leave Request
  const handleConfirmDelete = () => {
    if (!deletingLeave) return;
    if (!isAdmin && deletingLeave.status !== 'Pending') {
      showNotification('Locked: Cannot delete approved or rejected leave requests.', 'error');
      setDeletingLeave(null);
      return;
    }

    const updated = leaves.filter(l => l.id !== deletingLeave.id);
    updateLeavesList(updated);
    showNotification(`Leave request for "${deletingLeave.reason}" deleted.`, 'info');
    setDeletingLeave(null);
  };

  // Open Admin Review Modal (Approve or Reject)
  const handleOpenReviewModal = (leave: LeaveRequest, action: 'Approved' | 'Rejected') => {
    if (!isAdmin) return;
    setReviewingLeave(leave);
    setReviewAction(action);
    setReviewComment('');
  };

  // Submit Admin Review Decision
  const handleSaveReviewDecision = () => {
    if (!reviewingLeave || !isAdmin) return;

    const updated = leaves.map(l => {
      if (l.id === reviewingLeave.id) {
        return {
          ...l,
          status: reviewAction,
          adminComment: reviewComment.trim() || undefined,
          reviewedBy: currentWorkerName || 'Farm Management',
          reviewedOn: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    updateLeavesList(updated);

    // Dispatch notification to worker
    db.addAppNotification({
      recipientRole: 'worker',
      recipientUserId: reviewingLeave.workerId,
      title: `Leave Request ${reviewAction}`,
      message: `Your leave request for "${reviewingLeave.reason}" was ${reviewAction.toLowerCase()} by management.${
        reviewComment.trim() ? ` Comment: "${reviewComment.trim()}"` : ''
      }`,
      type: 'leave'
    });

    showNotification(
      `Leave request marked as ${reviewAction}${reviewComment.trim() ? ' with comments' : ''}.`,
      reviewAction === 'Approved' ? 'success' : 'info'
    );

    setReviewingLeave(null);
  };

  // Filtered leaves list
  const filteredLeaves = leaves.filter(l => {
    // If worker view, only show current worker's leaves (or match by name/id)
    if (!isAdmin) {
      const isMyLeave = l.workerId === currentWorkerId ||
        l.workerName.toLowerCase() === currentWorkerName.toLowerCase() ||
        (l.workerName && currentWorkerName && l.workerName.split(' ')[0].toLowerCase() === currentWorkerName.split(' ')[0].toLowerCase());
      if (!isMyLeave) return false;
    }

    // Filter by status
    if (filterStatus !== 'All' && l.status !== filterStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReason = l.reason.toLowerCase().includes(q);
      const matchWorker = l.workerName.toLowerCase().includes(q);
      const matchDate = l.startDate.includes(q) || l.endDate.includes(q);
      return matchReason || matchWorker || matchDate;
    }

    return true;
  });

  // Summary Metrics
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-800'}`}>

      {/* Header & Controls Bar */}
      <div className={`${isDarkMode ? 'dark-glass-card border-[#C5A059]/40' : 'bg-white border-slate-200'} p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className={`text-xl font-bold font-serif-brand ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-900'}`}>
                  Worker Leave Management
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                  {isAdmin
                    ? 'Review, approve, or reject worker leave applications and manage schedules.'
                    : 'Apply for leave, track approval status, and manage your time-off records.'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Apply For Leave</span>
          </button>
        </div>

        {/* Status Summary Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className={`${isDarkMode ? 'bg-[#04140E] border-[#C5A059]/20' : 'bg-slate-50 border-slate-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <div className="text-xs font-semibold">Total Requests</div>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-slate-700/50 text-slate-200 border border-slate-500/30">
              {isAdmin ? leaves.length : filteredLeaves.length}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-amber-500/30' : 'bg-amber-50 border-amber-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {pendingCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {approvedCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-rose-500/30' : 'bg-rose-50 border-rose-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Rejected
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {rejectedCount}
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-emerald-400/60' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search by worker name, reason, or date..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                isDarkMode
                  ? 'bg-[#04140E] border-[#C5A059]/30 text-[#F2F2ED] placeholder-emerald-300/40 focus:border-[#C5A059]'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className={`w-3.5 h-3.5 mr-1 shrink-0 ${isDarkMode ? 'text-[#C5A059]' : 'text-slate-500'}`} />
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(st => {
              const active = filterStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? st === 'Approved'
                        ? 'bg-emerald-600 text-white shadow'
                        : st === 'Pending'
                        ? 'bg-amber-600 text-white shadow'
                        : st === 'Rejected'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-[#C5A059] text-slate-950 shadow'
                      : isDarkMode
                      ? 'bg-[#04140E] text-emerald-200/80 hover:bg-[#062C1E] border border-[#C5A059]/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-lg transition-all ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : notificationMsg.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notificationMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {notificationMsg.type === 'info' && <Clock className="w-4 h-4 text-amber-400" />}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="opacity-70 hover:opacity-100 text-sm font-black cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Leave Requests Grid/List */}
      <div className="space-y-3">
        {filteredLeaves.length === 0 ? (
          <div className={`${isDarkMode ? 'dark-glass-card border-[#C5A059]/20 text-emerald-200/60' : 'bg-white border-slate-200 text-slate-500'} p-8 rounded-3xl border text-center text-xs space-y-2`}>
            <Calendar className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p className="font-bold text-sm">No Leave Requests Found</p>
            <p className="max-w-md mx-auto text-[11px]">
              {filterStatus !== 'All'
                ? `There are currently no leave requests with "${filterStatus}" status.`
                : 'No leave applications submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeaves.map(leave => {
              const isPending = leave.status === 'Pending';
              const isApproved = leave.status === 'Approved';
              const isRejected = leave.status === 'Rejected';
              const canWorkerModify = !isAdmin && isPending;

              return (
                <div
                  key={leave.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl relative ${
                    isDarkMode
                      ? isApproved
                        ? 'bg-[#04140E] border-emerald-500/40 hover:border-emerald-500/60'
                        : isRejected
                        ? 'bg-[#04140E] border-rose-500/40 hover:border-rose-500/60'
                        : 'bg-[#04140E] border-amber-500/40 hover:border-amber-500/60'
                      : isApproved
                      ? 'bg-white border-emerald-200 shadow-sm'
                      : isRejected
                      ? 'bg-white border-rose-200 shadow-sm'
                      : 'bg-white border-amber-200 shadow-sm'
                  }`}
                >
                  {/* Card Header: Worker & Status Badge */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center ${
                          isDarkMode ? 'bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059]' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-900'}`}>
                            {leave.workerName}
                          </h4>
                          <span className={`text-[10px] font-mono ${isDarkMode ? 'text-emerald-300/70' : 'text-slate-500'}`}>
                            Applied: {leave.appliedOn}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : isRejected
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {isRejected && <XCircle className="w-3 h-3 text-rose-400" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-300" />}
                        {leave.status}
                      </span>
                    </div>

                    {/* Leave Reason */}
                    <div className={`p-3 rounded-xl border text-xs ${
                      isDarkMode ? 'bg-[#062C1E]/80 border-[#C5A059]/15 text-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="text-[10px] uppercase font-mono text-[#C5A059] font-bold mb-0.5">
                        Reason For Leave
                      </div>
                      <p className="font-semibold line-clamp-2">{leave.reason}</p>
                    </div>

                    {/* Date Range & Total Days Calculation */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-[#04140E] border-[#C5A059]/20 text-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <span className="text-[10px] font-mono opacity-70 block">Duration</span>
                        <div className="font-bold text-xs flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#C5A059]" />
                          <span>{leave.startDate}</span>
                        </div>
                        {leave.endDate && leave.endDate !== leave.startDate && (
                          <div className="text-[10px] text-emerald-300/70 mt-0.5">
                            to {leave.endDate}
                          </div>
                        )}
                      </div>

                      <div className={`p-2.5 rounded-xl border text-center flex flex-col justify-center ${
                        isDarkMode ? 'bg-[#04140E] border-[#C5A059]/20' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] font-mono opacity-70">Total Leave</span>
                        <div className="text-sm font-extrabold text-[#C5A059] mt-0.5">
                          {leave.totalDays || calculateTotalDays(leave.startDate, leave.endDate)} {leave.totalDays === 1 ? 'Day' : 'Days'}
                        </div>
                      </div>
                    </div>

                    {/* Admin Comment Section if present */}
                    {leave.adminComment && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 space-y-0.5">
                        <div className="font-bold text-amber-300 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Management Note:
                        </div>
                        <p className="italic">"{leave.adminComment}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-[#C5A059]/15 flex items-center justify-between gap-2">
                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => setViewingLeave(leave)}
                      className="px-2.5 py-1.5 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3 text-[#C5A059]" />
                      <span>Details</span>
                    </button>

                    {/* Admin Review Controls or Worker Pending Controls */}
                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <>
                          {/* Admin Approve / Reject Buttons */}
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(leave, 'Approved')}
                            className={`p-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              isApproved
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 opacity-70'
                                : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-500/50 shadow'
                            }`}
                            title="Approve Request"
                          >
                            <Check className="w-3 h-3 text-emerald-300" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(leave, 'Rejected')}
                            className={`p-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              isRejected
                                ? 'bg-rose-950 text-rose-300 border-rose-500/40 opacity-70'
                                : 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border-rose-500/40'
                            }`}
                            title="Reject Request"
                          >
                            <X className="w-3 h-3 text-rose-300" />
                            <span>Reject</span>
                          </button>

                          {/* Admin Edit & Delete */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(leave)}
                            className="p-1.5 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 rounded-lg transition-all cursor-pointer"
                            title="Edit Leave Request"
                          >
                            <Edit3 className="w-3 h-3 text-[#C5A059]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingLeave(leave)}
                            className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-lg transition-all cursor-pointer"
                            title="Delete Leave Request"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Worker Controls */}
                          {canWorkerModify ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(leave)}
                                className="px-2.5 py-1.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingLeave(leave)}
                                className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-800/40 px-2 py-1 rounded-lg border border-slate-700/40" title="Decision finalized by management">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>Locked</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT LEAVE FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-lg w-full border border-[#C5A059]/40 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059]">
                  <Calendar className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold font-serif-brand">
                  {editingLeave ? 'Edit Leave Request' : 'Apply For Leave'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-[#062C1E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="space-y-4 text-xs">
              
              {/* Staff Member Selection (Admin view only) */}
              {isAdmin && (
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Worker / Staff Member *
                  </label>
                  <select
                    value={formWorkerName}
                    onChange={e => setFormWorkerName(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  >
                    {getStaffOptions().map(staff => (
                      <option key={staff} value={staff} className="bg-[#04140E] text-[#F2F2ED]">
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave Reason */}
              <div>
                <label className="block font-bold text-emerald-200 mb-1">
                  Reason For Leave *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Family function ceremony / Personal health medical appointment..."
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  className="w-full p-3 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] placeholder-emerald-300/40 focus:border-[#C5A059]"
                />
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => {
                      setFormStartDate(e.target.value);
                      if (!formEndDate || e.target.value > formEndDate) {
                        setFormEndDate(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    min={formStartDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Total Calculated Leave Days Display */}
              <div className="p-3 bg-[#062C1E] rounded-xl border border-[#C5A059]/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-200 text-xs">Total Leave Duration</div>
                  <div className="text-[10px] text-emerald-300/70">Calculated automatically from date range</div>
                </div>
                <div className="px-3 py-1 bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-black text-sm rounded-lg">
                  {calculatedFormDays} {calculatedFormDays === 1 ? 'Day' : 'Days'}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingLeave ? 'Update Leave Request' : 'Submit Leave Request'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADMIN REVIEW / APPROVAL MODAL */}
      {reviewingLeave && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-md w-full border border-[#C5A059]/40 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${
                reviewAction === 'Approved' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400' : 'bg-rose-950 border-rose-500/40 text-rose-400'
              }`}>
                {reviewAction === 'Approved' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-brand">
                  {reviewAction === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
                <p className="text-xs text-emerald-300/70 font-mono">
                  Worker: <strong className="text-white">{reviewingLeave.workerName}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#062C1E] rounded-xl border border-[#C5A059]/20 text-xs space-y-1">
              <div className="text-[10px] text-[#C5A059] font-mono font-bold uppercase">Requested Leave</div>
              <div className="font-semibold text-white">{reviewingLeave.reason}</div>
              <div className="text-emerald-300/70 text-[11px]">
                {reviewingLeave.startDate} to {reviewingLeave.endDate} ({reviewingLeave.totalDays || calculateTotalDays(reviewingLeave.startDate, reviewingLeave.endDate)} Days)
              </div>
            </div>

            {/* Admin Comment Input */}
            <div>
              <label className="block font-bold text-emerald-200 text-xs mb-1">
                Admin Comment / Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder={
                  reviewAction === 'Approved'
                    ? 'e.g. Approved. Please ensure morning tasks are handed off before leaving.'
                    : 'e.g. Rejected due to critical farm harvesting scheduled on these dates.'
                }
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="w-full p-3 text-xs bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] placeholder-emerald-300/40 focus:border-[#C5A059]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewingLeave(null)}
                className="px-4 py-2 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReviewDecision}
                className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  reviewAction === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {reviewAction === 'Approved' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>Confirm {reviewAction}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW LEAVE DETAILS MODAL */}
      {viewingLeave && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-md w-full border border-[#C5A059]/40 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059]">
                  <Eye className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold font-serif-brand">Leave Request Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingLeave(null)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="p-3 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300/70 font-mono uppercase block">Worker Name</span>
                  <span className="font-bold text-sm text-white">{viewingLeave.workerName}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                    viewingLeave.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : viewingLeave.status === 'Rejected'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {viewingLeave.status}
                </span>
              </div>

              <div className="p-3 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20 space-y-1">
                <span className="text-[10px] text-[#C5A059] font-mono uppercase font-bold block">Leave Reason</span>
                <p className="text-emerald-100 font-medium leading-relaxed">{viewingLeave.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20">
                  <span className="text-[10px] text-emerald-300/70 font-mono block">Start Date</span>
                  <span className="font-bold text-white">{viewingLeave.startDate}</span>
                </div>
                <div className="p-3 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20">
                  <span className="text-[10px] text-emerald-300/70 font-mono block">End Date</span>
                  <span className="font-bold text-white">{viewingLeave.endDate || viewingLeave.startDate}</span>
                </div>
              </div>

              <div className="p-3 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20 flex items-center justify-between">
                <span className="text-emerald-200 font-semibold">Total Days</span>
                <span className="font-extrabold text-sm text-[#C5A059]">
                  {viewingLeave.totalDays || calculateTotalDays(viewingLeave.startDate, viewingLeave.endDate)} Days
                </span>
              </div>

              <div className="p-3 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20 flex items-center justify-between text-[11px] text-emerald-300/80">
                <span>Submitted Date</span>
                <span className="font-mono text-white">{viewingLeave.appliedOn}</span>
              </div>

              {viewingLeave.adminComment && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl space-y-1">
                  <span className="text-[10px] text-amber-300 font-bold uppercase block">Management Review Comment</span>
                  <p className="text-amber-100 italic">"{viewingLeave.adminComment}"</p>
                  {viewingLeave.reviewedBy && (
                    <div className="text-[10px] text-amber-400/80 pt-1 border-t border-amber-500/20">
                      Reviewed by: {viewingLeave.reviewedBy} {viewingLeave.reviewedOn ? `on ${viewingLeave.reviewedOn}` : ''}
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setViewingLeave(null)}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingLeave && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-md w-full border border-rose-500/50 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950 rounded-2xl border border-rose-500/40 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-brand">Delete Leave Request</h3>
                <p className="text-xs text-rose-300 font-mono">Confirm Action</p>
              </div>
            </div>

            <div className="text-xs text-emerald-100/90 leading-relaxed font-medium bg-[#062C1E] p-4 rounded-xl border border-[#C5A059]/20 space-y-1">
              <p>Are you sure you want to permanently delete this leave request?</p>
              <div className="text-[#C5A059] font-semibold text-xs pt-1">
                Reason: "{deletingLeave.reason}" ({deletingLeave.startDate})
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLeave(null)}
                className="px-4 py-2 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Request</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
