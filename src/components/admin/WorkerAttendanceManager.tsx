import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../../types';
import { db } from '../../lib/db';
import {
  Clock,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  User,
  X,
  Check,
  FileText
} from 'lucide-react';

interface WorkerAttendanceManagerProps {
  userRole?: 'admin' | 'worker' | 'customer';
  currentWorkerId?: string;
  currentWorkerName?: string;
  onAttendanceChanged?: () => void;
  isDarkMode?: boolean;
}

export const WorkerAttendanceManager: React.FC<WorkerAttendanceManagerProps> = ({
  userRole = 'admin',
  currentWorkerId = 'usr-admin-1',
  currentWorkerName = 'Neelam Ramachandraiah',
  onAttendanceChanged,
  isDarkMode = true
}) => {
  const isAdmin = userRole === 'admin';

  // Load attendance records
  const [records, setRecords] = useState<AttendanceRecord[]>(() => db.getAttendance());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Half Day' | 'Absent' | 'Late' | 'Leave'>('All');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD
  const [timeRange, setTimeRange] = useState<'All' | 'Today' | 'This Week' | 'This Month' | 'This Year'>('All');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Form Fields
  const [formWorkerName, setFormWorkerName] = useState(currentWorkerName);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Present' | 'Half Day' | 'Absent' | 'Late' | 'Leave'>('Present');
  const [formCheckIn, setFormCheckIn] = useState('07:00 AM');
  const [formCheckOut, setFormCheckOut] = useState('05:00 PM');
  const [formNotes, setFormNotes] = useState('');

  // Delete Confirmation Modal State
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);

  // Notification Banner
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Sync state with DB
  const updateRecordsList = (newRecords: AttendanceRecord[]) => {
    setRecords(newRecords);
    db.saveAttendance(newRecords);
    onAttendanceChanged?.();
  };

  // Staff options for dropdowns
  const getStaffOptions = () => {
    const deleted = db.getDeletedStaff();
    const dbWorkers = db.getUsers().filter(u => u.role === 'worker' || u.role === 'admin').map(u => u.fullName).filter(Boolean);
    const defaultStaff = ['Neelam Ramachandraiah', 'Neelam Subbaiah', 'Sreenu Neelam (Owner)', 'Farm Staff 1'];
    const set = new Set([...defaultStaff, ...dbWorkers]);
    return Array.from(set).filter(name => !deleted.includes(name));
  };

  // Calculate working hours helper
  const calculateWorkingHours = (inTime: string, outTime: string): string => {
    if (!inTime || !outTime) return '-';
    // Simple parser for standard "07:00 AM" or "17:00" format
    try {
      const parseTimeToMinutes = (tStr: string) => {
        const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return null;
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3] ? match[3].toUpperCase() : null;

        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };

      const startMins = parseTimeToMinutes(inTime);
      const endMins = parseTimeToMinutes(outTime);

      if (startMins !== null && endMins !== null && endMins > startMins) {
        const diffHrs = ((endMins - startMins) / 60).toFixed(1);
        return `${diffHrs} hrs`;
      }
    } catch {
      // fallback
    }
    return '8.0 hrs';
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormWorkerName(isAdmin ? getStaffOptions()[0] || currentWorkerName : currentWorkerName);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Present');
    setFormCheckIn('07:00 AM');
    setFormCheckOut('05:00 PM');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: AttendanceRecord) => {
    if (!isAdmin && rec.workerName !== currentWorkerName) {
      showNotification('Permission denied: You can only edit your own attendance.', 'error');
      return;
    }
    setEditingRecord(rec);
    setFormWorkerName(rec.workerName);
    setFormDate(rec.date);
    setFormStatus(rec.status);
    setFormCheckIn(rec.checkInTime || '07:00 AM');
    setFormCheckOut(rec.checkOutTime || '05:00 PM');
    setFormNotes(rec.notes || '');
    setIsModalOpen(true);
  };

  // Save Attendance Record (Create / Edit)
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      showNotification('Please select a valid date.', 'error');
      return;
    }

    const calculatedHrs = calculateWorkingHours(formCheckIn, formCheckOut);

    if (editingRecord) {
      // Edit
      const updated = records.map(r => {
        if (r.id === editingRecord.id) {
          return {
            ...r,
            workerName: isAdmin ? formWorkerName : r.workerName,
            date: formDate,
            status: formStatus,
            checkInTime: formCheckIn,
            checkOutTime: formCheckOut,
            totalHours: calculatedHrs,
            notes: formNotes.trim() || undefined
          };
        }
        return r;
      });
      updateRecordsList(updated);
      showNotification(`Attendance record updated for ${formWorkerName}.`, 'success');
    } else {
      // Create
      const newRec: AttendanceRecord = {
        id: 'att-' + Date.now(),
        workerId: currentWorkerId,
        workerName: isAdmin ? formWorkerName : currentWorkerName,
        date: formDate,
        status: formStatus,
        checkInTime: formCheckIn,
        checkOutTime: formCheckOut,
        totalHours: calculatedHrs,
        notes: formNotes.trim() || undefined
      };
      const updated = [newRec, ...records];
      updateRecordsList(updated);
      showNotification(`New attendance record logged for ${formWorkerName}!`, 'success');
    }

    setIsModalOpen(false);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    if (!isAdmin) {
      showNotification('Locked: Only administrators can delete attendance records.', 'error');
      setDeletingRecord(null);
      return;
    }

    const updated = records.filter(r => r.id !== deletingRecord.id);
    updateRecordsList(updated);
    showNotification(`Attendance record for ${deletingRecord.workerName} (${deletingRecord.date}) deleted.`, 'info');
    setDeletingRecord(null);
  };

  // Export Attendance CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showNotification('No attendance records available to export.', 'error');
      return;
    }

    const headers = ['Worker Name', 'Date', 'Status', 'Check-In Time', 'Check-Out Time', 'Total Hours', 'Notes'];
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map(r => [
        `"${r.workerName.replace(/"/g, '""')}"`,
        `"${r.date}"`,
        `"${r.status}"`,
        `"${r.checkInTime || '-'}"`,
        `"${r.checkOutTime || '-'}"`,
        `"${r.totalHours || '-'}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Farm_Worker_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Attendance records exported successfully to CSV.', 'success');
  };

  // Date Filtering Logic (Today, This Week, This Month, This Year)
  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    return records.filter(r => {
      // Worker view restriction
      if (!isAdmin) {
        const isMyRecord = r.workerId === currentWorkerId ||
          r.workerName.toLowerCase() === currentWorkerName.toLowerCase();
        if (!isMyRecord) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;

      // Specific Date filter
      if (dateFilter && r.date !== dateFilter) return false;

      // Quick Time Range filter
      if (timeRange !== 'All') {
        const rDate = new Date(r.date);
        if (timeRange === 'Today') {
          if (r.date !== todayStr) return false;
        } else if (timeRange === 'This Week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0,0,0,0);
          if (rDate < startOfWeek) return false;
        } else if (timeRange === 'This Month') {
          if (rDate.getMonth() !== now.getMonth() || rDate.getFullYear() !== now.getFullYear()) return false;
        } else if (timeRange === 'This Year') {
          if (rDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.workerName.toLowerCase().includes(q);
        const matchDate = r.date.includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        return matchName || matchDate || matchNotes;
      }

      return true;
    });
  }, [records, isAdmin, currentWorkerId, currentWorkerName, statusFilter, dateFilter, timeRange, searchQuery]);

  // Metric Summary Counters
  const presentCount = filteredRecords.filter(r => r.status === 'Present').length;
  const halfDayCount = filteredRecords.filter(r => r.status === 'Half Day').length;
  const absentCount = filteredRecords.filter(r => r.status === 'Absent').length;
  const lateCount = filteredRecords.filter(r => r.status === 'Late').length;
  const leaveCount = filteredRecords.filter(r => r.status === 'Leave').length;

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-800'}`}>

      {/* Main Container Card */}
      <div className={`${isDarkMode ? 'dark-glass-card border-[#C5A059]/40' : 'bg-white border-slate-200'} p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4`}>
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className={`text-xl font-bold font-serif-brand ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-900'}`}>
                Worker Attendance & Check-In / Check-Out
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                {isAdmin
                  ? 'Track daily attendance, shift check-in/out timings, total working hours, and manual overrides.'
                  : 'View your recorded shift attendance, check-in/out timestamps, and working hours history.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-300 border border-[#C5A059]/30 text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              title="Export Attendance to CSV"
            >
              <Download className="w-4 h-4 text-[#C5A059]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Attendance</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className={`${isDarkMode ? 'bg-[#04140E] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Present
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {presentCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-amber-500/30' : 'bg-amber-50 border-amber-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Half Day
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {halfDayCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-rose-500/30' : 'bg-rose-50 border-rose-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Absent
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {absentCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-purple-500/30' : 'bg-purple-50 border-purple-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Late
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {lateCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'} p-3 rounded-2xl border flex items-center justify-between col-span-2 sm:col-span-1`}>
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> On Leave
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {leaveCount}
            </span>
          </div>
        </div>

        {/* Toolbar: Search, Date Filter & Timeframe Selector */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-emerald-400/60' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search by worker name, date, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                isDarkMode
                  ? 'bg-[#04140E] border-[#C5A059]/30 text-[#F2F2ED] placeholder-emerald-300/40 focus:border-[#C5A059]'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Specific Date Picker Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-[#C5A059]' : 'text-slate-500'}`} />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className={`py-2 px-3 text-xs rounded-xl border ${
                isDarkMode
                  ? 'bg-[#04140E] border-[#C5A059]/30 text-[#F2F2ED]'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-[#062C1E] text-xs font-bold cursor-pointer"
                title="Clear date filter"
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Timeframe Quick Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Today', 'This Week', 'This Month', 'This Year'] as const).map(tf => {
              const active = timeRange === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeRange(tf)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#C5A059] text-slate-950 shadow'
                      : isDarkMode
                      ? 'bg-[#04140E] text-emerald-200/80 hover:bg-[#062C1E] border border-[#C5A059]/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[#C5A059]/15 pt-3">
          <Filter className={`w-3.5 h-3.5 mr-1 shrink-0 ${isDarkMode ? 'text-[#C5A059]' : 'text-slate-500'}`} />
          {(['All', 'Present', 'Half Day', 'Absent', 'Late', 'Leave'] as const).map(st => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 text-white shadow'
                    : isDarkMode
                    ? 'bg-[#062C1E] text-emerald-200/70 hover:text-white border border-[#C5A059]/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

      </div>

      {/* Notification Toast */}
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

      {/* Attendance Records Table / List */}
      <div className={`${isDarkMode ? 'dark-glass-card border-[#C5A059]/30' : 'bg-white border-slate-200'} rounded-3xl border shadow-xl overflow-hidden`}>
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs space-y-2 opacity-70">
            <Clock className="w-8 h-8 mx-auto text-[#C5A059] opacity-50 mb-2" />
            <p className="font-bold text-sm">No Attendance Records Found</p>
            <p className="max-w-md mx-auto text-[11px]">
              No attendance logs match your search filters or selected date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${isDarkMode ? 'bg-[#062C1E] text-[#C5A059] border-b border-[#C5A059]/20' : 'bg-slate-100 text-slate-700 border-b border-slate-200'} font-black text-[11px] uppercase tracking-wider`}>
                  <th className="py-3.5 px-4">Worker Name</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Notes / Remarks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-[#C5A059]/10' : 'divide-slate-100'}`}>
                {filteredRecords.map(rec => {
                  const isPresent = rec.status === 'Present';
                  const isHalf = rec.status === 'Half Day';
                  const isAbsent = rec.status === 'Absent';
                  const isLate = rec.status === 'Late';
                  const isLeave = rec.status === 'Leave';

                  return (
                    <tr
                      key={rec.id}
                      className={`transition-colors ${
                        isDarkMode ? 'hover:bg-[#062C1E]/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Worker Name */}
                      <td className="py-3 px-4 font-bold">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isDarkMode ? 'bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/30' : 'bg-slate-200 text-slate-700'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span>{rec.workerName}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono font-semibold">
                        {rec.date}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                            isPresent
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : isHalf
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isAbsent
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : isLate
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {isPresent && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {isHalf && <Clock className="w-3 h-3 text-amber-300" />}
                          {isAbsent && <XCircle className="w-3 h-3 text-rose-400" />}
                          {isLate && <AlertTriangle className="w-3 h-3 text-purple-300" />}
                          {isLeave && <Calendar className="w-3 h-3 text-cyan-300" />}
                          {rec.status}
                        </span>
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-4 font-mono">
                        {rec.checkInTime || '-'}
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-4 font-mono">
                        {rec.checkOutTime || '-'}
                      </td>

                      {/* Total Working Hours */}
                      <td className="py-3 px-4 font-bold text-[#C5A059]">
                        {rec.totalHours || calculateWorkingHours(rec.checkInTime || '', rec.checkOutTime || '')}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] opacity-80">
                        {rec.notes || '-'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rec)}
                            className="p-1.5 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 rounded-lg transition-all cursor-pointer"
                            title="Edit Attendance Record"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(rec)}
                              className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-lg transition-all cursor-pointer"
                              title="Delete Attendance Record"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ATTENDANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-lg w-full border border-[#C5A059]/40 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059]">
                  <Clock className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold font-serif-brand">
                  {editingRecord ? 'Edit Attendance Record' : 'Log Worker Attendance'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              
              {/* Worker Name Selection */}
              {isAdmin && (
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Select Worker / Staff Member *
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

              {/* Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Attendance Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late Entry</option>
                    <option value="Leave">On Approved Leave</option>
                  </select>
                </div>
              </div>

              {/* Check-In & Check-Out Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06:30 AM"
                    value={formCheckIn}
                    onChange={e => setFormCheckIn(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 05:30 PM"
                    value={formCheckOut}
                    onChange={e => setFormCheckOut(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Calculated Hours Preview */}
              <div className="p-3 bg-[#062C1E] rounded-xl border border-[#C5A059]/30 flex items-center justify-between">
                <span className="text-emerald-200 font-semibold">Estimated Shift Hours</span>
                <span className="text-sm font-extrabold text-[#C5A059]">
                  {calculateWorkingHours(formCheckIn, formCheckOut)}
                </span>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block font-bold text-emerald-200 mb-1">
                  Shift Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed morning sheep feeding and afternoon grass cutting duty..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full p-3 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] placeholder-emerald-300/40 focus:border-[#C5A059]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingRecord ? 'Update Attendance' : 'Save Attendance'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-md w-full border border-rose-500/50 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950 rounded-2xl border border-rose-500/40 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-brand">Delete Attendance Record</h3>
                <p className="text-xs text-rose-300 font-mono">Confirm Action</p>
              </div>
            </div>

            <div className="text-xs text-emerald-100/90 leading-relaxed font-medium bg-[#062C1E] p-4 rounded-xl border border-[#C5A059]/20 space-y-1">
              <p>Are you sure you want to permanently delete this attendance record?</p>
              <div className="text-[#C5A059] font-semibold text-xs pt-1">
                Worker: {deletingRecord.workerName} ({deletingRecord.date})
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
