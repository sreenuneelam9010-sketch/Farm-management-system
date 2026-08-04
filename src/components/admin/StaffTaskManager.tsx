import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  Tag, 
  X, 
  AlertCircle,
  XCircle,
  UserX,
  UserCheck,
  Users
} from 'lucide-react';
import { Task } from '../../types';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface StaffTaskManagerProps {
  onTasksChanged?: () => void;
}

const PREDEFINED_WORK_TASKS = [
  'Sheep Feeding',
  'Goat Feeding',
  'Natu Kodi Feeding',
  'Cleaning Farm',
  'Water Supply',
  'Vaccination',
  'Animal Health Check',
  'Shed Cleaning',
  'Stock Checking',
  'Feed Distribution',
  'Egg Collection',
  'Sheep Grazing',
  'Goat Grazing',
  'Custom Task'
];

export const StaffTaskManager: React.FC<StaffTaskManagerProps> = ({ onTasksChanged }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'admin';
  const isAdminOrOwner = userRole === 'admin';

  const [tasks, setTasks] = useState<Task[]>(() => db.getTasks());
  const [approvalMap, setApprovalMap] = useState<Record<string, boolean>>(() => db.getStaffApprovalMap());
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [workFilter, setWorkFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<Task | null>(null);

  // Form State
  const [selectedWorker, setSelectedWorker] = useState('Neelam Ramachandraiah');
  const [workTaskCategory, setWorkTaskCategory] = useState('Sheep Feeding');
  const [customWorkTask, setCustomWorkTask] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');

  // Base list of permitted staff members
  const BASE_STAFF_MEMBERS = [
    'Neelam Ramachandraiah',
    'Neelam Sreenivasulu (Owner/Admin)',
    'Neelam Subbaiah',
    'Farm Staff 1'
  ];

  // Delete staff confirmation state
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<string | null>(null);

  // Get combined full staff list including any registered workers from database
  const getFullStaffList = () => {
    const deleted = db.getDeletedStaff();
    const dbWorkers = db.getUsers().filter(u => u.role === 'worker' || u.role === 'admin').map(u => u.fullName).filter(Boolean);
    const set = new Set([...BASE_STAFF_MEMBERS, ...dbWorkers]);
    return Array.from(set).filter(name => !deleted.includes(name));
  };

  // Get active (approved) workers for new task assignment
  const getActiveWorkers = () => {
    return getFullStaffList().filter(name => approvalMap[name] !== false);
  };

  // Toggle Staff Approval Status (Admin/Owner only)
  const handleToggleStaffApproval = (staffName: string, approved: boolean) => {
    if (!isAdminOrOwner) return;
    if (approved) {
      db.approveWorkerOrStaff({ staffName });
    } else {
      db.removeWorkerOrStaffApproval({ staffName });
    }
    setApprovalMap(db.getStaffApprovalMap());
    setTasks(db.getTasks());
    onTasksChanged?.();
  };

  // Permanently Delete Staff Member (Admin/Owner only)
  const handleConfirmDeleteStaff = (staffName: string) => {
    if (!isAdminOrOwner || !staffName) return;
    db.deleteWorkerOrStaff({ staffName });
    setApprovalMap(db.getStaffApprovalMap());
    setTasks(db.getTasks());
    const active = getActiveWorkers().filter(w => w !== staffName);
    if (selectedWorker === staffName) {
      setSelectedWorker(active[0] || '');
    }
    setDeleteConfirmStaff(null);
    onTasksChanged?.();
  };

  // Sync state & localstorage
  const saveAndSync = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    db.saveTasks(updatedTasks);
    if (onTasksChanged) {
      onTasksChanged();
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.workTask && t.workTask.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.assignedWorkerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWork = workFilter === 'All' || t.workTask === workFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesWork && matchesStatus;
  });

  // Open Add Task Modal
  const openAddTask = () => {
    const active = getActiveWorkers();
    setSelectedWorker(active[0] || 'Neelam Ramachandraiah');
    setWorkTaskCategory('Sheep Feeding');
    setCustomWorkTask('');
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setPriority('Medium');
    setStatus('Pending');
    setEditingTask(null);
    setModalMode('add');
  };

  // Open Edit Task Modal
  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedWorker(task.assignedWorkerName);
    
    const isPredefined = PREDEFINED_WORK_TASKS.includes(task.workTask || '');
    if (isPredefined && task.workTask !== 'Custom Task') {
      setWorkTaskCategory(task.workTask || 'Sheep Feeding');
      setCustomWorkTask('');
    } else {
      setWorkTaskCategory('Custom Task');
      setCustomWorkTask(task.workTask || '');
    }

    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setStatus(task.status);
    setModalMode('edit');
  };

  // Save Task Form Handler
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();

    const finalWorkTask = workTaskCategory === 'Custom Task' 
      ? (customWorkTask.trim() || 'Custom Task') 
      : workTaskCategory;

    const finalTitle = taskTitle.trim() || finalWorkTask;

    if (editingTask) {
      // Edit task
      const updated = tasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            title: finalTitle,
            workTask: finalWorkTask,
            description: taskDescription.trim(),
            assignedWorkerName: selectedWorker,
            dueDate,
            priority,
            status
          };
        }
        return t;
      });
      saveAndSync(updated);
    } else {
      // Add task
      const newTask: Task = {
        id: `tsk-${Date.now()}`,
        title: finalTitle,
        workTask: finalWorkTask,
        description: taskDescription.trim(),
        assignedWorkerId: 'usr-worker',
        assignedWorkerName: selectedWorker,
        dueDate,
        priority,
        status
      };
      saveAndSync([newTask, ...tasks]);
    }

    setModalMode(null);
    setEditingTask(null);
  };

  // Toggle Status directly from table
  const handleToggleStatus = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus: Task['status'] = 
          t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Pending';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveAndSync(updated);
  };

  // Confirm Delete Handler
  const handleDeleteTask = () => {
    if (!deleteTaskConfirm) return;
    const updated = tasks.filter(t => t.id !== deleteTaskConfirm.id);
    saveAndSync(updated);
    setDeleteTaskConfirm(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Module Header & Add Button */}
      <div className="dark-glass-card p-6 sm:p-8 rounded-3xl border border-[#C5A059]/40 shadow-2xl space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C5A059]/25">
          <div>
            <div className="text-[11px] font-mono font-bold text-[#C5A059] uppercase tracking-widest">
              Staff Management & Operations
            </div>
            <h3 className="text-2xl font-serif-brand font-bold text-[#F2F2ED]">
              Active Farm Workers & Assigned Daily Tasks
            </h3>
          </div>

          <button
            onClick={openAddTask}
            className="px-5 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Assign New Task
          </button>
        </div>

        {/* Staff Approval Roster Panel */}
        <div className="bg-[#04140E] p-5 rounded-2xl border border-[#C5A059]/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C5A059]/20">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-bold text-[#F2F2ED] uppercase tracking-wider font-mono">
                Staff Members & Approval Directory
              </h4>
            </div>
            <span className="text-[11px] text-emerald-300/80 font-mono">
              Active: <strong className="text-emerald-400">{getActiveWorkers().length}</strong> / {getFullStaffList().length} Staff Members
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {getFullStaffList().map(staffName => {
              const isApproved = approvalMap[staffName] !== false;
              return (
                <div key={staffName} className="bg-[#062C1E] p-3.5 rounded-xl border border-[#C5A059]/25 flex flex-col justify-between gap-3 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#F2F2ED] truncate">{staffName}</span>
                    {isApproved ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0 flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-950 text-red-300 border border-red-500/40 shrink-0 flex items-center gap-1 shadow-sm">
                        <XCircle className="w-2.5 h-2.5 text-red-400" /> Inactive
                      </span>
                    )}
                  </div>

                  {isAdminOrOwner && (
                    <div className="pt-1.5 flex items-center gap-1.5">
                      {isApproved ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStaffApproval(staffName, false)}
                          className="flex-1 py-1.5 bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-500/40 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3 h-3 text-red-400" />
                          Remove Approval
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStaffApproval(staffName, true)}
                          className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500/50 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-300" />
                          Approve Again
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmStaff(staffName)}
                        className="py-1.5 px-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title={`Delete ${staffName}`}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C5A059]" />
            <input
              type="text"
              placeholder="Search work, staff, description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C5A059] shrink-0" />
            <select
              value={workFilter}
              onChange={e => setWorkFilter(e.target.value)}
              className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] text-xs font-bold py-2.5 px-3 rounded-xl outline-none"
            >
              <option value="All">All Work / Tasks</option>
              {PREDEFINED_WORK_TASKS.filter(w => w !== 'Custom Task').map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] text-xs font-bold py-2.5 px-3 rounded-xl outline-none"
            >
              <option value="All">All Task Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Staff & Tasks Table */}
        <div className="rounded-2xl border border-[#C5A059]/30 overflow-hidden shadow-lg bg-[#04140E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#062C1E] text-[#F3D082] uppercase font-mono tracking-wider border-b border-[#C5A059]/30 font-black">
                <tr>
                  <th className="p-4">Work / Task</th>
                  <th className="p-4">Assigned Staff</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4">Task Details</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A059]/15 text-[#F2F2ED] font-medium">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-emerald-200/60 font-medium">
                      No staff tasks found matching your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-[#062C1E]/60 transition-colors">
                      {/* Work / Task Column */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 bg-[#062C1E] text-[#F3D082] border border-[#C5A059]/40 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                          <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                          {t.workTask || t.title}
                        </span>
                      </td>

                      {/* Assigned Staff */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#062C1E] border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center font-bold text-xs">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-[#F2F2ED]">{t.assignedWorkerName}</span>
                        </div>
                      </td>

                      {/* Approval Status (NEW COLUMN) */}
                      <td className="p-4 whitespace-nowrap">
                        {(() => {
                          const isApproved = approvalMap[t.assignedWorkerName] !== false;
                          return (
                            <div className="flex flex-col items-start gap-1.5">
                              {isApproved ? (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  Approved
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-500/40 inline-flex items-center gap-1.5 shadow-sm">
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                                  Removed / Inactive
                                </span>
                              )}

                              {isAdminOrOwner && (
                                isApproved ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStaffApproval(t.assignedWorkerName, false)}
                                    className="px-2.5 py-0.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/30 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                    title={`Remove approval for ${t.assignedWorkerName}`}
                                  >
                                    <UserX className="w-3 h-3 text-red-400" />
                                    Remove Approval
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStaffApproval(t.assignedWorkerName, true)}
                                    className="px-2.5 py-0.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                    title={`Re-approve ${t.assignedWorkerName}`}
                                  >
                                    <UserCheck className="w-3 h-3 text-emerald-300" />
                                    Approve Again
                                  </button>
                                )
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Task Details */}
                      <td className="p-4 min-w-[200px]">
                        <div className="font-bold text-[#F2F2ED]">{t.title}</div>
                        {t.description && (
                          <div className="text-[11px] text-emerald-200/70 mt-0.5 line-clamp-2">
                            {t.description}
                          </div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="p-4 font-mono text-[#C5A059] whitespace-nowrap">
                        {t.dueDate}
                      </td>

                      {/* Priority */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                          t.priority === 'High'
                            ? 'bg-red-950/80 text-red-300 border-red-500/40'
                            : t.priority === 'Medium'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                            t.status === 'Completed'
                              ? 'bg-emerald-800 text-white border-emerald-500'
                              : t.status === 'In Progress'
                              ? 'bg-amber-600 text-white border-amber-400'
                              : 'bg-[#062C1E] text-[#C5A059] border-[#C5A059]/40 hover:border-[#C5A059]'
                          }`}
                          title="Click to toggle status"
                        >
                          {t.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {t.status}
                        </button>
                      </td>

                      {/* Actions (Edit / Delete) */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditTask(t)}
                            className="p-2 bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] border border-[#C5A059]/40 rounded-lg transition-all"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTaskConfirm(t)}
                            className="p-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg transition-all"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: ADD / EDIT TASK */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-none flex items-center justify-center p-4 overflow-y-auto">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#C5A059]/50 shadow-2xl text-white my-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-4">
              <h4 className="text-lg font-serif-brand font-bold text-[#F2F2ED]">
                {editingTask ? 'Edit Staff Task Assignment' : 'Assign New Staff Task'}
              </h4>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-[#062C1E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">

              {/* Assign To Worker */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Assign Staff Member *</label>
                {(() => {
                  const active = getActiveWorkers();
                  // If editing an existing task, ensure the assigned worker is included in options even if inactive
                  const options = editingTask && editingTask.assignedWorkerName && !active.includes(editingTask.assignedWorkerName)
                    ? [editingTask.assignedWorkerName, ...active]
                    : active;

                  if (options.length === 0) {
                    return (
                      <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 text-xs rounded-xl font-medium flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>No active approved staff members available. Please re-approve at least one staff member first.</span>
                      </div>
                    );
                  }

                  return (
                    <select
                      value={selectedWorker}
                      onChange={e => setSelectedWorker(e.target.value)}
                      className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                    >
                      {options.map(w => (
                        <option key={w} value={w}>
                          {w}{approvalMap[w] === false ? ' (Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              {/* Work / Task Dropdown */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Work / Task *</label>
                <select
                  value={workTaskCategory}
                  onChange={e => setWorkTaskCategory(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                >
                  {PREDEFINED_WORK_TASKS.map(taskOpt => (
                    <option key={taskOpt} value={taskOpt}>{taskOpt}</option>
                  ))}
                </select>
              </div>

              {/* Custom Work Task Input (if Custom Task selected) */}
              {workTaskCategory === 'Custom Task' && (
                <div>
                  <label className="block text-amber-300 mb-1 font-bold">Specify Custom Work / Task *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom work description..."
                    value={customWorkTask}
                    onChange={e => setCustomWorkTask(e.target.value)}
                    className="w-full bg-[#04140E] border border-amber-500/50 focus:border-amber-400 text-[#F2F2ED] font-medium p-3 rounded-xl outline-none"
                  />
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Task Title / Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Section B Feeding & Water Trough Refill"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-medium p-3 rounded-xl outline-none"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Task Description & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions for the staff member..."
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-medium p-3 rounded-xl outline-none"
                />
              </div>

              {/* Priority, Status, and Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-emerald-200/80 mb-1 font-bold">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-emerald-200/80 mb-1 font-bold">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-200/80 mb-1 font-bold">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#C5A059]/30">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-5 py-2.5 bg-[#062C1E] hover:bg-[#093d29] text-slate-200 font-bold rounded-xl border border-[#C5A059]/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg transition-all"
                >
                  Save Task
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP: DELETE TASK */}
      {deleteTaskConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-none flex items-center justify-center p-4">
          <div className="dark-glass-card rounded-3xl max-w-md w-full p-6 border border-red-500/50 shadow-2xl text-white space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div>
              <h4 className="text-lg font-serif-brand font-bold text-red-300">
                Delete Task
              </h4>
              <p className="text-xs text-emerald-200/80 mt-2 font-medium">
                Are you sure you want to delete this task?
              </p>
              {deleteTaskConfirm && (
                <div className="mt-3 p-3 bg-[#04140E] rounded-xl border border-[#C5A059]/30 text-xs text-left">
                  <div className="font-bold text-[#F3D082]">Work / Task: {deleteTaskConfirm.workTask || deleteTaskConfirm.title}</div>
                  <div className="text-emerald-200/70 text-[11px] mt-1">Assigned To: {deleteTaskConfirm.assignedWorkerName}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTaskConfirm(null)}
                className="px-5 py-2.5 bg-[#062C1E] text-slate-200 font-bold text-xs rounded-xl border border-[#C5A059]/30"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently Delete Staff Confirmation Modal */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#04140E] text-[#F2F2ED] rounded-3xl max-w-md w-full border border-red-500/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-950 rounded-2xl border border-red-500/40 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif-brand">Delete Staff Member</h3>
                <p className="text-xs text-red-300 font-mono">Permanent Deletion</p>
              </div>
            </div>
            
            <div className="text-xs text-emerald-100/90 leading-relaxed font-medium bg-[#062C1E] p-4 rounded-xl border border-[#C5A059]/20 space-y-2">
              <p className="font-bold text-white text-sm">
                Are you sure you want to permanently delete this staff member?
              </p>
              <div className="text-[#C5A059] font-mono text-xs">
                Staff Name: <strong className="text-white">{deleteConfirmStaff}</strong>
              </div>
              <p className="text-[11px] text-emerald-300/70 pt-1 border-t border-[#C5A059]/15">
                This will permanently delete their account, remove their approval record, block future login, and remove them from task assignment dropdowns.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-4 py-2 bg-[#062C1E] hover:bg-[#0a402d] text-emerald-200 border border-[#C5A059]/30 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteStaff(deleteConfirmStaff)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
