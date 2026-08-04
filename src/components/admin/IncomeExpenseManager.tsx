import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { FinancialRecord } from '../../types';
import { db } from '../../lib/db';

interface IncomeExpenseManagerProps {
  onFinancialsChanged?: () => void;
}

const INCOME_SOURCES = [
  'Animal Sale',
  'Product Sale',
  'Natu Kolla',
  'Feed & Fodder Sale',
  'Services',
  'Other'
];

const EXPENSE_CATEGORIES = [
  'Feed Purchase',
  'Medicine',
  'Sheep & Goat Purchase',
  'Worker Salary',
  'Utilities',
  'Equipment',
  'Maintenance',
  'Other'
];

export const IncomeExpenseManager: React.FC<IncomeExpenseManagerProps> = ({ onFinancialsChanged }) => {
  const [financials, setFinancials] = useState<FinancialRecord[]>(() => db.getFinancials());

  // Income Search & Filters
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomeSourceFilter, setIncomeSourceFilter] = useState('All');

  // Expense Search & Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');

  // Modal State
  const [modalMode, setModalMode] = useState<'add-income' | 'add-expense' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<FinancialRecord | null>(null);

  // Form State
  const [formType, setFormType] = useState<'Income' | 'Expense'>('Income');
  const [formCategory, setFormCategory] = useState<string>('Animal Sale');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formRecordedBy, setFormRecordedBy] = useState('Neelam Ramachandraiah');
  const [formNotes, setFormNotes] = useState('');

  // Helper to sync changes with DB and parent
  const saveAndSync = (newRecords: FinancialRecord[]) => {
    setFinancials(newRecords);
    db.saveFinancials(newRecords);
    if (onFinancialsChanged) {
      onFinancialsChanged();
    }
  };

  // Date calculation helpers for current month & year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  const isCurrentYear = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === currentYear;
  };

  // Filtered Income Records
  const incomeRecords = financials.filter(f => f.type === 'Income');
  const filteredIncome = incomeRecords.filter(f => {
    const matchesSource = incomeSourceFilter === 'All' || f.category === incomeSourceFilter;
    const query = incomeSearch.toLowerCase();
    const matchesSearch = 
      f.title.toLowerCase().includes(query) || 
      f.category.toLowerCase().includes(query) || 
      f.recordedBy.toLowerCase().includes(query) ||
      (f.notes && f.notes.toLowerCase().includes(query));
    return matchesSource && matchesSearch;
  });

  // Filtered Expense Records
  const expenseRecords = financials.filter(f => f.type === 'Expense');
  const filteredExpense = expenseRecords.filter(f => {
    const matchesCategory = expenseCategoryFilter === 'All' || f.category === expenseCategoryFilter;
    const query = expenseSearch.toLowerCase();
    const matchesSearch = 
      f.title.toLowerCase().includes(query) || 
      f.category.toLowerCase().includes(query) || 
      f.recordedBy.toLowerCase().includes(query) ||
      (f.notes && f.notes.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Monthly & Yearly Calculations
  const totalIncomeMonth = incomeRecords
    .filter(f => isCurrentMonth(f.date))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalIncomeYear = incomeRecords
    .filter(f => isCurrentYear(f.date))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalExpenseMonth = expenseRecords
    .filter(f => isCurrentMonth(f.date))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalExpenseYear = expenseRecords
    .filter(f => isCurrentYear(f.date))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  // Open Modal for Add Income
  const openAddIncome = () => {
    setFormType('Income');
    setFormCategory('Animal Sale');
    setFormTitle('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormRecordedBy('Neelam Ramachandraiah');
    setFormNotes('');
    setEditingRecord(null);
    setModalMode('add-income');
  };

  // Open Modal for Add Expense
  const openAddExpense = () => {
    setFormType('Expense');
    setFormCategory('Feed Purchase');
    setFormTitle('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormRecordedBy('Neelam Subbaiah');
    setFormNotes('');
    setEditingRecord(null);
    setModalMode('add-expense');
  };

  // Open Modal for Edit
  const openEditRecord = (record: FinancialRecord) => {
    setEditingRecord(record);
    setFormType(record.type);
    setFormCategory(record.category);
    setFormTitle(record.title);
    setFormAmount(record.amount.toString());
    setFormDate(record.date);
    setFormRecordedBy(record.recordedBy);
    setFormNotes(record.notes || '');
    setModalMode('edit');
  };

  // Save Record Handler
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid title and amount.');
      return;
    }

    if (editingRecord) {
      // Edit existing
      const updated = financials.map(f => {
        if (f.id === editingRecord.id) {
          return {
            ...f,
            type: formType,
            category: formCategory as any,
            title: formTitle.trim(),
            amount: numAmount,
            date: formDate,
            recordedBy: formRecordedBy.trim() || 'Admin',
            notes: formNotes.trim()
          };
        }
        return f;
      });
      saveAndSync(updated);
    } else {
      // Add new
      const newRec: FinancialRecord = {
        id: `fin-${Date.now()}`,
        type: formType,
        category: formCategory as any,
        title: formTitle.trim(),
        amount: numAmount,
        date: formDate,
        recordedBy: formRecordedBy.trim() || 'Admin',
        notes: formNotes.trim()
      };
      saveAndSync([newRec, ...financials]);
    }

    setModalMode(null);
    setEditingRecord(null);
  };

  // Delete Record Handler
  const handleDeleteRecord = () => {
    if (!deleteConfirmRecord) return;
    const updated = financials.filter(f => f.id !== deleteConfirmRecord.id);
    saveAndSync(updated);
    setDeleteConfirmRecord(null);
  };

  return (
    <div className="space-y-10">

      {/* SECTION 1: INCOME RECORDS */}
      <div className="dark-glass-card p-6 sm:p-8 rounded-3xl border border-[#C5A059]/40 shadow-2xl space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C5A059]/25">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Financial Section 01
              </div>
              <h3 className="text-2xl font-serif-brand font-bold text-[#F2F2ED]">
                Income Records
              </h3>
            </div>
          </div>

          <button
            onClick={openAddIncome}
            className="px-5 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Income Record
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C5A059]" />
            <input
              type="text"
              placeholder="Search income source, title, recorded by..."
              value={incomeSearch}
              onChange={e => setIncomeSearch(e.target.value)}
              className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C5A059] shrink-0" />
            <select
              value={incomeSourceFilter}
              onChange={e => setIncomeSourceFilter(e.target.value)}
              className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] text-xs font-bold py-2.5 px-3 rounded-xl outline-none"
            >
              <option value="All">All Income Sources</option>
              {INCOME_SOURCES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Income Table */}
        <div className="rounded-2xl border border-[#C5A059]/30 overflow-hidden shadow-lg bg-[#04140E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#062C1E] text-[#F3D082] uppercase font-mono tracking-wider border-b border-[#C5A059]/30 font-black">
                <tr>
                  <th className="p-4">Income Source</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount (₹)</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Recorded By</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A059]/15 text-[#F2F2ED] font-medium">
                {filteredIncome.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-emerald-200/60 font-medium">
                      No income records found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIncome.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#062C1E]/60 transition-colors">
                      <td className="p-4">
                        <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold inline-block">
                          {rec.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#F2F2ED]">{rec.title}</div>
                        {rec.notes && <div className="text-[11px] text-emerald-200/70 mt-0.5">{rec.notes}</div>}
                      </td>
                      <td className="p-4 font-black text-emerald-400 text-sm whitespace-nowrap">
                        +₹{rec.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 font-mono text-[#C5A059] whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="p-4 font-medium text-emerald-100">
                        {rec.recordedBy}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditRecord(rec)}
                            className="p-2 bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] border border-[#C5A059]/40 rounded-lg transition-all"
                            title="Edit Income Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmRecord(rec)}
                            className="p-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg transition-all"
                            title="Delete Income Record"
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

        {/* Income Summary Card at Bottom of Table */}
        <div className="bg-[#04140E] p-5 rounded-2xl border border-[#C5A059]/40 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#062C1E] rounded-xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                Total Income This Month
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
                ₹{totalIncomeMonth.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-950/80 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-[#062C1E] rounded-xl border border-[#C5A059]/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#F3D082] font-bold">
                Total Income This Year ({currentYear})
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#F3D082] mt-1 font-mono">
                ₹{totalIncomeYear.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2.5 bg-[#04140E] text-[#C5A059] rounded-lg border border-[#C5A059]/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>


      {/* SECTION 2: EXPENSE RECORDS */}
      <div className="dark-glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-2xl space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/25">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-md">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                Financial Section 02
              </div>
              <h3 className="text-2xl font-serif-brand font-bold text-[#F2F2ED]">
                Expense Records
              </h3>
            </div>
          </div>

          <button
            onClick={openAddExpense}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Expense Record
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              type="text"
              placeholder="Search expense category, title, recorded by..."
              value={expenseSearch}
              onChange={e => setExpenseSearch(e.target.value)}
              className="w-full bg-[#04140E] border border-amber-500/40 focus:border-amber-400 text-[#F2F2ED] text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={expenseCategoryFilter}
              onChange={e => setExpenseCategoryFilter(e.target.value)}
              className="w-full bg-[#04140E] border border-amber-500/40 focus:border-amber-400 text-[#F2F2ED] text-xs font-bold py-2.5 px-3 rounded-xl outline-none"
            >
              <option value="All">All Expense Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense Table */}
        <div className="rounded-2xl border border-amber-500/30 overflow-hidden shadow-lg bg-[#04140E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#062C1E] text-[#F3D082] uppercase font-mono tracking-wider border-b border-[#C5A059]/30 font-black">
                <tr>
                  <th className="p-4">Expense Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount (₹)</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Recorded By</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A059]/15 text-[#F2F2ED] font-medium">
                {filteredExpense.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-amber-200/60 font-medium">
                      No expense records found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpense.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#062C1E]/60 transition-colors">
                      <td className="p-4">
                        <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold inline-block">
                          {rec.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#F2F2ED]">{rec.title}</div>
                        {rec.notes && <div className="text-[11px] text-amber-200/70 mt-0.5">{rec.notes}</div>}
                      </td>
                      <td className="p-4 font-black text-amber-400 text-sm whitespace-nowrap">
                        -₹{rec.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 font-mono text-[#C5A059] whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="p-4 font-medium text-emerald-100">
                        {rec.recordedBy}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditRecord(rec)}
                            className="p-2 bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] border border-[#C5A059]/40 rounded-lg transition-all"
                            title="Edit Expense Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmRecord(rec)}
                            className="p-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg transition-all"
                            title="Delete Expense Record"
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

        {/* Expense Summary Card at Bottom of Table */}
        <div className="bg-[#04140E] p-5 rounded-2xl border border-amber-500/40 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#062C1E] rounded-xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                Total Expenses This Month
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 font-mono">
                ₹{totalExpenseMonth.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2.5 bg-amber-950/80 text-amber-400 rounded-lg border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-[#062C1E] rounded-xl border border-[#C5A059]/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#F3D082] font-bold">
                Total Expenses This Year ({currentYear})
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#F3D082] mt-1 font-mono">
                ₹{totalExpenseYear.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2.5 bg-[#04140E] text-[#C5A059] rounded-lg border border-[#C5A059]/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>


      {/* MODAL: ADD / EDIT FINANCIAL RECORD */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-none flex items-center justify-center p-4 overflow-y-auto">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#C5A059]/50 shadow-2xl text-white my-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-4">
              <div className="flex items-center gap-2.5">
                {formType === 'Income' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                )}
                <h4 className="text-lg font-serif-brand font-bold text-[#F2F2ED]">
                  {editingRecord 
                    ? `Edit ${editingRecord.type} Record`
                    : `Add New ${formType} Record`}
                </h4>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-[#062C1E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">

              {/* Type Switcher */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Record Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#04140E] rounded-xl border border-[#C5A059]/30">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('Income');
                      setFormCategory(INCOME_SOURCES[0]);
                    }}
                    className={`py-2 rounded-lg font-bold transition-all ${
                      formType === 'Income'
                        ? 'bg-emerald-700 text-white shadow'
                        : 'text-emerald-200/60 hover:text-white'
                    }`}
                  >
                    + Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('Expense');
                      setFormCategory(EXPENSE_CATEGORIES[0]);
                    }}
                    className={`py-2 rounded-lg font-bold transition-all ${
                      formType === 'Expense'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-amber-200/60 hover:text-white'
                    }`}
                  >
                    - Expense
                  </button>
                </div>
              </div>

              {/* Category / Source */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">
                  {formType === 'Income' ? 'Income Source' : 'Expense Category'}
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                >
                  {(formType === 'Income' ? INCOME_SOURCES : EXPENSE_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sale of 2 Local Rams / Feed Purchase"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-medium p-3 rounded-xl outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 15000"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none font-mono"
                />
              </div>

              {/* Date & Recorded By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-200/80 mb-1 font-bold">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-bold p-3 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-200/80 mb-1 font-bold">Recorded By</label>
                  <input
                    type="text"
                    required
                    value={formRecordedBy}
                    onChange={e => setFormRecordedBy(e.target.value)}
                    className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-medium p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-emerald-200/80 mb-1 font-bold">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Enter details, buyer/vendor info, invoice #..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-[#04140E] border border-[#C5A059]/40 focus:border-[#C5A059] text-[#F2F2ED] font-medium p-3 rounded-xl outline-none"
                />
              </div>

              {/* Actions */}
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
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-none flex items-center justify-center p-4">
          <div className="dark-glass-card rounded-3xl max-w-md w-full p-6 border border-red-500/50 shadow-2xl text-white space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-serif-brand font-bold text-red-300">
                Confirm Deletion
              </h4>
              <p className="text-xs text-emerald-200/80 mt-2">
                Are you sure you want to delete the {deleteConfirmRecord.type.toLowerCase()} record{' '}
                <strong className="text-white font-bold">"{deleteConfirmRecord.title}"</strong> (₹{deleteConfirmRecord.amount.toLocaleString('en-IN')})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                className="px-5 py-2.5 bg-[#062C1E] text-slate-200 font-bold text-xs rounded-xl border border-[#C5A059]/30"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
