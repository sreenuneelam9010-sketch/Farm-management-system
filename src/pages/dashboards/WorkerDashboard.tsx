import React, { useState } from 'react';
import { db } from '../../lib/db';
import { Task, AttendanceRecord, FeedHealthLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { WorkerAttendanceManager } from '../../components/admin/WorkerAttendanceManager';
import { AnimalHealthFeedLogManager } from '../../components/admin/AnimalHealthFeedLogManager';
import { WorkerLeaveManager } from '../../components/admin/WorkerLeaveManager';
import { WorkerProfile } from '../../components/profile/WorkerProfile';
import { InAppChat } from '../../components/chat/InAppChat';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface WorkerDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  activeTab: propActiveTab,
  onTabChange
}) => {
  const { user, updateProfile, logout } = useAuth();
  const [internalTab, setInternalTab] = useState<string>('overview');

  const activeTab = propActiveTab || internalTab;

  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [tasks, setTasks] = useState<Task[]>(() => db.getTasks());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => db.getAttendance());

  const [checkInDone, setCheckInDone] = useState(false);
  const [healthLog, setHealthLog] = useState({ tag: 'LV-SHP-101', log: '', status: 'Healthy' });
  const [logSuccess, setLogSuccess] = useState(false);

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Pending';
        return { ...t, status: nextStatus as any };
      }
      return t;
    });
    setTasks(updated);
    db.saveTasks(updated);
  };

  const handleCheckIn = () => {
    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      workerId: user?.id || 'usr-worker',
      workerName: user?.fullName || 'Neelam Subbaiah',
      date: now.toISOString().slice(0, 10),
      status: 'Present',
      checkInTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalHours: '0.0 hrs',
      notes: 'Self check-in via Worker Field Portal'
    };
    const updated = [newRecord, ...attendance];
    setAttendance(updated);
    db.saveAttendance(updated);
    setCheckInDone(true);
  };

  const handleAddHealthLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthLog.log.trim()) return;

    const animals = db.getAnimals();
    const matchedAnimal = animals.find(a => a.tagNumber === healthLog.tag);

    const newLogItem: FeedHealthLog = {
      id: `fhl-${Date.now()}`,
      animalTag: healthLog.tag,
      category: matchedAnimal?.category === 'Sheep' || matchedAnimal?.category === 'Natu Kolla' ? matchedAnimal.category : 'Sheep',
      workerId: user?.id || 'usr-worker',
      workerName: user?.fullName || 'Neelam Subbaiah',
      status: healthLog.status as any,
      feedLog: healthLog.log.trim(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    const currentLogs = db.getFeedHealthLogs();
    db.saveFeedHealthLogs([newLogItem, ...currentLogs]);

    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3500);
    setHealthLog({ tag: 'LV-SHP-101', log: '', status: 'Healthy' });
  };

  return (
    <div className="py-8 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Worker Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Worker Field Dashboard</div>
            <h1 className="text-2xl font-black mt-1">Welcome, {user?.fullName || 'Farm Worker'}</h1>
            <p className="text-xs text-slate-400">Daily Attendance, Feeding Logs, Health Reports & Tasks</p>
          </div>

          <div className="flex items-center gap-3">
            {checkInDone ? (
              <span className="px-5 py-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Marked Present Today
              </span>
            ) : (
              <button
                onClick={handleCheckIn}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Check-In Daily Attendance
              </button>
            )}
          </div>
        </div>

        {/* Worker Navigation Sub-Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Dashboard Overview' },
            { id: 'tasks', label: '📋 Daily Tasks' },
            { id: 'attendance', label: '⏱️ Attendance' },
            { id: 'feed_health', label: '🌿 Feed & Health Log' },
            { id: 'leaves', label: '🏖️ Leave Management' },
            { id: 'messages', label: '💬 Messages' },
            { id: 'notifications', label: '🔔 Notifications' },
            { id: 'profile', label: '👤 Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab View: Overview or Tasks */}
        {(activeTab === 'overview' || activeTab === 'tasks' || activeTab === 'feed_health') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Assigned Tasks */}
            {(activeTab === 'overview' || activeTab === 'tasks') && (
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-between">
                    <span>Assigned Daily Tasks ({tasks.length})</span>
                    <span className="text-xs font-normal text-slate-500">Tap status to update</span>
                  </h3>

                  <div className="space-y-3">
                    {tasks.map(t => (
                      <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.workTask && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                {t.workTask}
                              </span>
                            )}
                            <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                          </div>
                          <p className="text-xs text-slate-600">{t.description}</p>
                          <div className="text-[11px] text-slate-400 font-semibold">Due: {t.dueDate}</div>
                        </div>

                        <button
                          onClick={() => handleToggleTask(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                            t.status === 'Completed'
                              ? 'bg-emerald-600 text-white'
                              : t.status === 'In Progress'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Health Logger */}
            {(activeTab === 'overview' || activeTab === 'feed_health') && (
              <div className={`${activeTab === 'overview' ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-6`}>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Log Daily Feed & Health Inspection</h3>
                  
                  {logSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Log submitted successfully to farm owners!
                    </div>
                  )}

                  <form onSubmit={handleAddHealthLog} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Select Animal Tag</label>
                        <select
                          value={healthLog.tag}
                          onChange={e => setHealthLog({ ...healthLog, tag: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                        >
                          {db.getAnimals().length === 0 ? (
                            <option value="GENERAL">General Flock / No Active Tags</option>
                          ) : (
                            db.getAnimals().map(a => (
                              <option key={a.id} value={a.tagNumber}>
                                {a.tagNumber} ({a.category} - {a.breed})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Observed Health Status</label>
                        <select
                          value={healthLog.status}
                          onChange={e => setHealthLog({ ...healthLog, status: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                        >
                          <option value="Healthy">Healthy & Active</option>
                          <option value="Under Treatment">Under Observation / Medicine</option>
                          <option value="Quarantine">Quarantine Required</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Feed Quantity & Observations</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="e.g. Distributed 5kg Lucerne fodder. All animals ate well..."
                        value={healthLog.log}
                        onChange={e => setHealthLog({ ...healthLog, log: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      ></textarea>
                    </div>

                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-colors">
                      Submit Health & Feed Log
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab View: Attendance */}
        {(activeTab === 'overview' || activeTab === 'attendance') && (
          <WorkerAttendanceManager
            userRole="worker"
            currentWorkerId={user?.id || 'usr-worker'}
            currentWorkerName={user?.fullName || 'Neelam Subbaiah'}
            isDarkMode={false}
          />
        )}

        {/* Tab View: Feed & Health Logs */}
        {(activeTab === 'overview' || activeTab === 'feed_health') && (
          <AnimalHealthFeedLogManager
            userRole="worker"
            currentWorkerId={user?.id || 'usr-worker'}
            currentWorkerName={user?.fullName || 'Neelam Subbaiah'}
            isDarkMode={false}
          />
        )}

        {/* Tab View: Leave Management */}
        {(activeTab === 'overview' || activeTab === 'leaves') && (
          <WorkerLeaveManager
            userRole="worker"
            currentWorkerId={user?.id || 'usr-worker'}
            currentWorkerName={user?.fullName || 'Neelam Subbaiah'}
            isDarkMode={false}
          />
        )}

        {/* Tab View: Messages */}
        {activeTab === 'messages' && (
          <InAppChat userRole="worker" />
        )}

        {/* Tab View: Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              🔔 Notifications & Announcements
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="font-bold text-emerald-900">Vaccination Schedule Notice</div>
                <p className="text-emerald-700 mt-1">Sheep flock vaccination scheduled for tomorrow morning at 7:00 AM.</p>
                <div className="text-[10px] text-emerald-600 font-semibold mt-2">Posted by Owner: N. Ramachandraiah</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="font-bold text-slate-900">Feed Stock Arrival</div>
                <p className="text-slate-600 mt-1">20 bags of Lucerne grass fodder delivered at main shed.</p>
                <div className="text-[10px] text-slate-400 font-semibold mt-2">Today, 09:30 AM</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab View: Worker Profile */}
        {activeTab === 'profile' && user && (
          <WorkerProfile
            user={user}
            onUpdateProfile={updateProfile}
            onLogout={logout}
          />
        )}

      </div>
    </div>
  );
};
