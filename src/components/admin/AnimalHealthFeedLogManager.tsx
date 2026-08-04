import React, { useState, useMemo } from 'react';
import { FeedHealthLog } from '../../types';
import { db } from '../../lib/db';
import {
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  History,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  X,
  Check,
  Tag,
  Clock
} from 'lucide-react';

interface AnimalHealthFeedLogManagerProps {
  userRole?: 'admin' | 'worker' | 'customer';
  currentWorkerId?: string;
  currentWorkerName?: string;
  onLogsChanged?: () => void;
  isDarkMode?: boolean;
}

export const AnimalHealthFeedLogManager: React.FC<AnimalHealthFeedLogManagerProps> = ({
  userRole = 'admin',
  currentWorkerId = 'usr-admin-1',
  currentWorkerName = 'Neelam Ramachandraiah',
  onLogsChanged,
  isDarkMode = true
}) => {
  const isAdmin = userRole === 'admin';

  // Load feed/health logs
  const [logs, setLogs] = useState<FeedHealthLog[]>(() => db.getFeedHealthLogs());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Sheep' | 'Goat' | 'Natu Kolla' | 'General Flock'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Healthy' | 'Under Treatment' | 'Quarantine' | 'Needs Attention'>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modal State for Add / Edit Log
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FeedHealthLog | null>(null);

  // Form State
  const [formAnimalTag, setFormAnimalTag] = useState('LV-SHP-101');
  const [formCategory, setFormCategory] = useState<'Sheep' | 'Goat' | 'Natu Kolla' | 'General Flock'>('Sheep');
  const [formWorkerName, setFormWorkerName] = useState(currentWorkerName);
  const [formStatus, setFormStatus] = useState<'Healthy' | 'Under Treatment' | 'Quarantine' | 'Needs Attention'>('Healthy');
  const [formFeedLog, setFormFeedLog] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Animal Tag History Timeline Modal State
  const [historyTag, setHistoryTag] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deletingLog, setDeletingLog] = useState<FeedHealthLog | null>(null);

  // Notification Banner
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Sync state with DB
  const updateLogsList = (newLogs: FeedHealthLog[]) => {
    setLogs(newLogs);
    db.saveFeedHealthLogs(newLogs);
    onLogsChanged?.();
  };

  // Staff options
  const getStaffOptions = () => {
    const deleted = db.getDeletedStaff();
    const dbWorkers = db.getUsers().filter(u => u.role === 'worker' || u.role === 'admin').map(u => u.fullName).filter(Boolean);
    const defaultStaff = ['Neelam Ramachandraiah', 'Neelam Subbaiah', 'Sreenu Neelam (Owner)', 'Farm Staff 1'];
    const set = new Set([...defaultStaff, ...dbWorkers]);
    return Array.from(set).filter(name => !deleted.includes(name));
  };

  // Animal tag options from DB animals
  const getAnimalTagOptions = () => {
    const animals = db.getAnimals();
    const tags = animals.map(a => `${a.tagNumber} (${a.category} - ${a.breed})`);
    if (tags.length === 0) {
      return [
        { tag: 'LV-SHP-101', cat: 'Sheep' as const },
        { tag: 'LV-SHP-102', cat: 'Sheep' as const },
        { tag: 'LV-NTK-201', cat: 'Natu Kolla' as const },
        { tag: 'GENERAL', cat: 'General Flock' as const }
      ];
    }
    return animals.map(a => ({
      tag: a.tagNumber,
      cat: (a.category === 'Sheep' || a.category === 'Natu Kolla' ? a.category : 'Sheep') as any
    }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingLog(null);
    const tags = getAnimalTagOptions();
    setFormAnimalTag(tags[0]?.tag || 'LV-SHP-101');
    setFormCategory(tags[0]?.cat || 'Sheep');
    setFormWorkerName(isAdmin ? getStaffOptions()[0] || currentWorkerName : currentWorkerName);
    setFormStatus('Healthy');
    setFormFeedLog('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (logItem: FeedHealthLog) => {
    if (!isAdmin && logItem.workerName !== currentWorkerName) {
      showNotification('Permission denied: You can only edit your own submitted logs.', 'error');
      return;
    }
    setEditingLog(logItem);
    setFormAnimalTag(logItem.animalTag);
    setFormCategory(logItem.category || 'Sheep');
    setFormWorkerName(logItem.workerName);
    setFormStatus(logItem.status);
    setFormFeedLog(logItem.feedLog);
    setFormDate(logItem.date);
    setIsModalOpen(true);
  };

  // Save Feed/Health Log
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFeedLog.trim()) {
      showNotification('Please enter feed quantity & health observation notes.', 'error');
      return;
    }

    if (editingLog) {
      // Edit
      const updated = logs.map(l => {
        if (l.id === editingLog.id) {
          return {
            ...l,
            animalTag: formAnimalTag,
            category: formCategory,
            workerName: isAdmin ? formWorkerName : l.workerName,
            status: formStatus,
            feedLog: formFeedLog.trim(),
            date: formDate
          };
        }
        return l;
      });
      updateLogsList(updated);
      showNotification(`Feed & health log updated for ${formAnimalTag}.`, 'success');
    } else {
      // Create
      const newLog: FeedHealthLog = {
        id: 'fhl-' + Date.now(),
        animalTag: formAnimalTag,
        category: formCategory,
        workerId: currentWorkerId,
        workerName: isAdmin ? formWorkerName : currentWorkerName,
        status: formStatus,
        feedLog: formFeedLog.trim(),
        date: formDate,
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      const updated = [newLog, ...logs];
      updateLogsList(updated);
      showNotification(`New feed & health log saved for animal tag ${formAnimalTag}!`, 'success');
    }

    setIsModalOpen(false);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingLog) return;
    if (!isAdmin) {
      showNotification('Permission denied: Only administrators can delete feed/health logs.', 'error');
      setDeletingLog(null);
      return;
    }

    const updated = logs.filter(l => l.id !== deletingLog.id);
    updateLogsList(updated);
    showNotification(`Log for tag ${deletingLog.animalTag} deleted.`, 'info');
    setDeletingLog(null);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      // Category filter
      if (categoryFilter !== 'All' && l.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;

      // Date filter
      if (dateFilter && l.date !== dateFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTag = l.animalTag.toLowerCase().includes(q);
        const matchWorker = l.workerName.toLowerCase().includes(q);
        const matchLog = l.feedLog.toLowerCase().includes(q);
        const matchCat = (l.category || '').toLowerCase().includes(q);
        return matchTag || matchWorker || matchLog || matchCat;
      }

      return true;
    });
  }, [logs, categoryFilter, statusFilter, dateFilter, searchQuery]);

  // Animal History Logs (Filtered by historyTag)
  const tagHistoryLogs = useMemo(() => {
    if (!historyTag) return [];
    return logs
      .filter(l => l.animalTag.toLowerCase() === historyTag.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, historyTag]);

  // Metric Summaries
  const healthyCount = logs.filter(l => l.status === 'Healthy').length;
  const treatmentCount = logs.filter(l => l.status === 'Under Treatment').length;
  const quarantineCount = logs.filter(l => l.status === 'Quarantine').length;

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-800'}`}>

      {/* Main Card Header */}
      <div className={`${isDarkMode ? 'dark-glass-card border-[#C5A059]/40' : 'bg-white border-slate-200'} p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className={`text-xl font-bold font-serif-brand ${isDarkMode ? 'text-[#F2F2ED]' : 'text-slate-900'}`}>
                Daily Feed & Health Inspection Logs
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                Monitor daily feed distribution, medical health observations, and historical records for Sheep, Goats & Natu Kolla.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Feed & Health</span>
          </button>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className={`${isDarkMode ? 'bg-[#04140E] border-[#C5A059]/20' : 'bg-slate-50 border-slate-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-semibold">Total Logs</span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-slate-700/50 text-slate-200 border border-slate-500/30">
              {logs.length}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {healthyCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-amber-500/30' : 'bg-amber-50 border-amber-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Under Treatment
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {treatmentCount}
            </span>
          </div>

          <div className={`${isDarkMode ? 'bg-[#04140E] border-rose-500/30' : 'bg-rose-50 border-rose-200'} p-3 rounded-2xl border flex items-center justify-between`}>
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Quarantine
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {quarantineCount}
            </span>
          </div>
        </div>

        {/* Toolbar: Search & Category Pills */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-emerald-400/60' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search by tag e.g. LV-SHP-101, worker, or feed notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                isDarkMode
                  ? 'bg-[#04140E] border-[#C5A059]/30 text-[#F2F2ED] placeholder-emerald-300/40 focus:border-[#C5A059]'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Date Filter Picker */}
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
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className={`w-3.5 h-3.5 mr-1 shrink-0 ${isDarkMode ? 'text-[#C5A059]' : 'text-slate-500'}`} />
            {(['All', 'Sheep', 'Goat', 'Natu Kolla', 'General Flock'] as const).map(cat => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#C5A059] text-slate-950 shadow'
                      : isDarkMode
                      ? 'bg-[#04140E] text-emerald-200/80 hover:bg-[#062C1E] border border-[#C5A059]/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
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

      {/* Feed & Health Logs List Grid */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className={`${isDarkMode ? 'dark-glass-card border-[#C5A059]/20 text-emerald-200/60' : 'bg-white border-slate-200 text-slate-500'} p-8 rounded-3xl border text-center text-xs space-y-2`}>
            <ShieldCheck className="w-8 h-8 mx-auto opacity-40 mb-2 text-[#C5A059]" />
            <p className="font-bold text-sm">No Feed or Health Logs Found</p>
            <p className="max-w-md mx-auto text-[11px]">
              No feed distribution or health inspection logs match your selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLogs.map(log => {
              const isHealthy = log.status === 'Healthy';
              const isTreatment = log.status === 'Under Treatment';
              const isQuarantine = log.status === 'Quarantine';

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${
                    isDarkMode
                      ? 'bg-[#04140E] border-[#C5A059]/25 hover:border-[#C5A059]/50'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    
                    {/* Header: Animal Tag & Health Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059] rounded-xl text-xs font-bold">
                          <Tag className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#F2F2ED] flex items-center gap-1.5">
                            <span>{log.animalTag}</span>
                            {log.category && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#062C1E] text-emerald-300 border border-[#C5A059]/20 rounded-md">
                                {log.category}
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-emerald-300/70 font-mono">
                            Logged by: {log.workerName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${
                          isHealthy
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : isTreatment
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : isQuarantine
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        }`}
                      >
                        {isHealthy && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {isTreatment && <AlertTriangle className="w-3 h-3 text-amber-300" />}
                        {isQuarantine && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        {log.status}
                      </span>
                    </div>

                    {/* Feed & Observation Notes */}
                    <div className={`p-3 rounded-xl border text-xs ${
                      isDarkMode ? 'bg-[#062C1E]/80 border-[#C5A059]/15 text-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="text-[10px] uppercase font-mono text-[#C5A059] font-bold mb-0.5">
                        Feed & Health Observations
                      </div>
                      <p className="font-semibold line-clamp-3 leading-relaxed">{log.feedLog}</p>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C5A059]" /> {log.date}
                      </span>
                      {log.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C5A059]" /> {log.createdAt}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-[#C5A059]/15 flex items-center justify-between gap-2">
                    
                    {/* Animal History Timeline Button */}
                    <button
                      type="button"
                      onClick={() => setHistoryTag(log.animalTag)}
                      className="px-2.5 py-1.5 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="View Complete Animal History"
                    >
                      <History className="w-3 h-3 text-[#C5A059]" />
                      <span>Tag History</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(log)}
                        className="p-1.5 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 rounded-lg transition-all cursor-pointer"
                        title="Edit Log Entry"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeletingLog(log)}
                          className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-lg transition-all cursor-pointer"
                          title="Delete Log Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT FEED & HEALTH LOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-lg w-full border border-[#C5A059]/40 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold font-serif-brand">
                  {editingLog ? 'Edit Feed & Health Log' : 'Log Feed & Health Inspection'}
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

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              
              {/* Animal Tag & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Animal Tag Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LV-SHP-101 or GENERAL"
                    value={formAnimalTag}
                    onChange={e => setFormAnimalTag(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Livestock Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  >
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Natu Kolla">Natu Kolla</option>
                    <option value="General Flock">General Flock</option>
                  </select>
                </div>
              </div>

              {/* Worker & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isAdmin ? (
                  <div>
                    <label className="block font-bold text-emerald-200 mb-1">
                      Logged By Worker *
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
                ) : (
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
                )}

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Observed Health Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  >
                    <option value="Healthy">Healthy & Active</option>
                    <option value="Under Treatment">Under Treatment / Medicine</option>
                    <option value="Quarantine">Quarantine Required</option>
                    <option value="Needs Attention">Needs Special Attention</option>
                  </select>
                </div>
              </div>

              {/* Date Input for Admin */}
              {isAdmin && (
                <div>
                  <label className="block font-bold text-emerald-200 mb-1">
                    Log Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full p-2.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-xl text-[#F2F2ED] focus:border-[#C5A059]"
                  />
                </div>
              )}

              {/* Feed Quantity & Observations */}
              <div>
                <label className="block font-bold text-emerald-200 mb-1">
                  Feed Quantity & Health Observations *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Distributed 5kg Lucerne fodder & mineral mixture. All animals ate well. Deworming dose administered..."
                  value={formFeedLog}
                  onChange={e => setFormFeedLog(e.target.value)}
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
                  <span>{editingLog ? 'Update Log' : 'Save Feed & Health Log'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ANIMAL TAG HISTORY TIMELINE MODAL */}
      {historyTag && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-xl w-full border border-[#C5A059]/40 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059]">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif-brand">Animal History Timeline</h3>
                  <p className="text-xs text-emerald-300/70 font-mono">
                    Tag: <strong className="text-[#C5A059]">{historyTag}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTag(null)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 text-xs flex-1">
              {tagHistoryLogs.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <p>No historical records found for tag "{historyTag}".</p>
                </div>
              ) : (
                tagHistoryLogs.map((hLog, idx) => (
                  <div
                    key={hLog.id}
                    className="p-4 bg-[#062C1E] rounded-2xl border border-[#C5A059]/20 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#04140E] text-[#C5A059] border border-[#C5A059]/30 rounded-md">
                          #{tagHistoryLogs.length - idx}
                        </span>
                        <span className="font-bold text-white text-xs">{hLog.date}</span>
                        {hLog.createdAt && (
                          <span className="text-[10px] text-emerald-300/60 font-mono">({hLog.createdAt})</span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          hLog.status === 'Healthy'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {hLog.status}
                      </span>
                    </div>

                    <p className="text-emerald-100 leading-relaxed pt-1">{hLog.feedLog}</p>

                    <div className="text-[10px] text-emerald-300/60 font-mono pt-1 border-t border-[#C5A059]/10 flex items-center justify-between">
                      <span>Logged by: {hLog.workerName}</span>
                      {hLog.category && <span>Category: {hLog.category}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right shrink-0">
              <button
                type="button"
                onClick={() => setHistoryTag(null)}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Timeline
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-md w-full border border-rose-500/50 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950 rounded-2xl border border-rose-500/40 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-brand">Delete Feed & Health Log</h3>
                <p className="text-xs text-rose-300 font-mono">Confirm Action</p>
              </div>
            </div>

            <div className="text-xs text-emerald-100/90 leading-relaxed font-medium bg-[#062C1E] p-4 rounded-xl border border-[#C5A059]/20 space-y-1">
              <p>Are you sure you want to permanently delete this feed/health log?</p>
              <div className="text-[#C5A059] font-semibold text-xs pt-1">
                Animal Tag: {deletingLog.animalTag} ({deletingLog.date})
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLog(null)}
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
                <span>Delete Log</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
