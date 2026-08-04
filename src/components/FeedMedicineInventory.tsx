import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { InventoryItem, FinancialRecord } from '../types';
import { exportInventoryCSV } from '../lib/exportUtils';
import { 
  Boxes, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  TrendingDown, 
  PackageCheck,
  Building2,
  Phone
} from 'lucide-react';

interface FeedMedicineInventoryProps {
  userRole?: string | null;
  onInventoryChanged?: () => void;
}

export const FeedMedicineInventory: React.FC<FeedMedicineInventoryProps> = ({
  userRole = 'admin',
  onInventoryChanged
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => db.getInventory());
  const [typeFilter, setTypeFilter] = useState<'All' | 'Feed' | 'Medicine' | 'Sheep' | 'Goat' | 'Equipment' | 'Natu Kolla'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventoryItem | null>(null);

  // Form state for Adding Item
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    itemName: '',
    type: 'Feed',
    supplierName: '',
    supplierContact: '',
    numberOfBagsOrBoxes: 10,
    unit: 'Bags',
    costPerUnit: 1000,
    totalPurchaseAmount: 10000,
    currentStock: 100,
    minAlertStock: 20,
    lastRestocked: new Date().toISOString().split('T')[0]
  });

  const isAdmin = userRole === 'admin';

  // Synchronize with database
  const reloadInventory = () => {
    const list = db.getInventory();
    setInventory(list);
  };

  useEffect(() => {
    reloadInventory();
  }, []);

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate Real-Time Monthly & Yearly Expenses
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const thisMonthTotalExpense = inventory.reduce((sum, item) => {
    if (!item.lastRestocked) return sum;
    const d = new Date(item.lastRestocked);
    if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const bags = Number(item.numberOfBagsOrBoxes) || 0;
      const cost = Number(item.costPerUnit) || 0;
      const total = item.totalPurchaseAmount !== undefined ? Number(item.totalPurchaseAmount) : (bags * cost);
      return sum + total;
    }
    return sum;
  }, 0);

  const thisYearTotalExpense = inventory.reduce((sum, item) => {
    if (!item.lastRestocked) return sum;
    const d = new Date(item.lastRestocked);
    if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) {
      const bags = Number(item.numberOfBagsOrBoxes) || 0;
      const cost = Number(item.costPerUnit) || 0;
      const total = item.totalPurchaseAmount !== undefined ? Number(item.totalPurchaseAmount) : (bags * cost);
      return sum + total;
    }
    return sum;
  }, 0);

  // Requirement 3: Access Control (Workers & Customers restricted)
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="dark-glass-card p-10 rounded-3xl border border-amber-500/30 space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 text-[#C5A059] rounded-2xl mx-auto flex items-center justify-center border border-amber-500/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif-brand font-bold text-[#F2F2ED]">
            Access Restricted
          </h2>
          <p className="text-sm text-emerald-200/80 leading-relaxed max-w-lg mx-auto">
            The Feed & Medicine Inventory section is restricted exclusively to authorized Farm Owners and Administrators.
          </p>
        </div>
      </div>
    );
  }

  // Action: Add Inventory Item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newItem.itemName) return;

    const bags = Number(newItem.numberOfBagsOrBoxes) || 0;
    const cost = Number(newItem.costPerUnit) || 0;
    const computedTotal = bags * cost;

    const created: InventoryItem = {
      id: `inv-${Date.now()}`,
      itemName: newItem.itemName,
      type: (newItem.type as any) || 'Feed',
      supplierName: newItem.supplierName || 'General Supplier',
      supplierContact: newItem.supplierContact || 'N/A',
      numberOfBagsOrBoxes: bags,
      unit: newItem.unit || 'Bags',
      costPerUnit: cost,
      totalPurchaseAmount: computedTotal,
      currentStock: Number(newItem.currentStock) || 0,
      minAlertStock: Number(newItem.minAlertStock) || 10,
      lastRestocked: newItem.lastRestocked || new Date().toISOString().split('T')[0]
    };

    const updated = [created, ...inventory];
    db.saveInventory(updated);

    // Sync financial record ledger (type: Expense)
    const finCategory = created.type === 'Medicine' ? 'Medicine' : 'Feed Purchase';
    const financials = db.getFinancials();
    const newFin: FinancialRecord = {
      id: `fin-inv-${Date.now()}`,
      type: 'Expense',
      category: finCategory,
      title: `Inventory Purchase: ${created.itemName} (${created.numberOfBagsOrBoxes} ${created.unit})`,
      amount: computedTotal,
      date: created.lastRestocked,
      recordedBy: 'Owner / Admin',
      notes: `Supplier: ${created.supplierName} (${created.supplierContact})`
    };
    db.saveFinancials([newFin, ...financials]);

    setInventory(updated);
    setShowAddModal(false);

    // Reset Form
    setNewItem({
      itemName: '',
      type: 'Feed',
      supplierName: '',
      supplierContact: '',
      numberOfBagsOrBoxes: 10,
      unit: 'Bags',
      costPerUnit: 1000,
      totalPurchaseAmount: 10000,
      currentStock: 100,
      minAlertStock: 20,
      lastRestocked: new Date().toISOString().split('T')[0]
    });

    if (onInventoryChanged) onInventoryChanged();
  };

  // Action: Update Inventory Item
  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editItem) return;

    const bags = Number(editItem.numberOfBagsOrBoxes) || 0;
    const cost = Number(editItem.costPerUnit) || 0;
    const computedTotal = bags * cost;

    const updatedItem: InventoryItem = {
      ...editItem,
      numberOfBagsOrBoxes: bags,
      costPerUnit: cost,
      totalPurchaseAmount: computedTotal
    };

    const updated = inventory.map(item => (item.id === editItem.id ? updatedItem : item));
    db.saveInventory(updated);
    setInventory(updated);
    setEditItem(null);

    if (onInventoryChanged) onInventoryChanged();
  };

  // Action: Delete Inventory Item
  const handleConfirmDeleteItem = () => {
    if (!isAdmin || !deleteConfirmItem) return;

    const updated = inventory.filter(item => item.id !== deleteConfirmItem.id);
    db.saveInventory(updated);
    setInventory(updated);
    setDeleteConfirmItem(null);

    if (onInventoryChanged) onInventoryChanged();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#062C1E] p-5 rounded-3xl border border-[#C5A059]/40 shadow-xl">
        
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#F3D082]" />
            <h2 className="text-xl font-serif-brand font-black text-white">
              Feed & Medicine Stock Inventory
            </h2>
          </div>
          <p className="text-xs text-slate-100 font-semibold mt-1">
            Total Inventory Items Tracked: <strong className="text-[#F3D082] font-black">{inventory.length}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-[#04140E] p-1 rounded-2xl border border-[#C5A059]/30 overflow-x-auto">
            {(['All', 'Feed', 'Medicine', 'Sheep', 'Goat', 'Equipment', 'Natu Kolla'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setTypeFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  typeFilter === cat
                    ? 'bg-[#E5C158] text-slate-950 font-black shadow'
                    : 'text-slate-100 font-bold hover:text-[#F3D082]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#F3D082] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search feed / medicine..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-[#C5A059] placeholder:text-gray-500"
            />
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => exportInventoryCSV(inventory)}
            className="px-3.5 py-2.5 bg-[#04140E] hover:bg-[#08281d] text-[#F3D082] border border-[#C5A059]/40 text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
            title="Download CSV Inventory Report"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>

          {/* Add Item Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#E5C158] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Inventory
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="dark-glass-card rounded-3xl border border-[#C5A059]/30 overflow-hidden shadow-2xl">
        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-[#062C1E] text-[#F3D082] rounded-2xl mx-auto flex items-center justify-center border border-[#C5A059]/40">
              <Boxes className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">
              No Inventory Items Found
            </h3>
            <p className="text-xs text-slate-100 font-semibold max-w-md mx-auto">
              No inventory records match your selected filter. Click below to add a new feed or medicine purchase entry.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#E5C158] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Inventory Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#062C1E] text-[#F3D082] uppercase font-mono tracking-wider border-b border-[#C5A059]/30 font-black">
                <tr>
                  <th className="p-4">Item Name & Type</th>
                  <th className="p-4">Supplier Details</th>
                  <th className="p-4">Number of Bags / Boxes</th>
                  <th className="p-4">Cost / Bag or Box (₹)</th>
                  <th className="p-4">Total Purchase Amount (₹)</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Last Restocked</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A059]/15 font-semibold">
                {filteredInventory.map(item => {
                  const bags = item.numberOfBagsOrBoxes || 0;
                  const cost = item.costPerUnit || 0;
                  const computedTotal = item.totalPurchaseAmount !== undefined ? item.totalPurchaseAmount : (bags * cost);
                  const isLowStock = item.currentStock <= item.minAlertStock;

                  return (
                    <tr key={item.id} className="hover:bg-[#062C1E]/70 transition-colors">
                      
                      {/* Item Name & Type */}
                      <td className="p-4">
                        <div className="font-extrabold text-white text-sm">{item.itemName}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#04140E] text-[#F3D082] border border-[#C5A059]/30">
                          {item.type}
                        </span>
                      </td>

                      {/* Supplier Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-extrabold text-white">
                          <Building2 className="w-3.5 h-3.5 text-[#F3D082]" />
                          {item.supplierName || 'Local Supplier'}
                        </div>
                        {item.supplierContact && (
                          <div className="text-[11px] text-emerald-300 font-bold font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-300" />
                            {item.supplierContact}
                          </div>
                        )}
                      </td>

                      {/* Number of Bags / Boxes */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-sm font-black text-white">
                          {bags.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-[#F3D082] ml-1 uppercase font-extrabold">
                          {item.unit || 'Bags'}
                        </span>
                      </td>

                      {/* Cost per Bag / Box */}
                      <td className="p-4 font-black text-emerald-300 whitespace-nowrap text-sm">
                        ₹{cost.toLocaleString('en-IN')}
                      </td>

                      {/* Total Purchase Amount (₹) */}
                      <td className="p-4 font-black text-[#F3D082] whitespace-nowrap text-sm bg-[#04140E]/60">
                        ₹{computedTotal.toLocaleString('en-IN')}
                      </td>

                      {/* Current Stock */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${
                            isLowStock
                              ? 'bg-amber-950/90 text-amber-200 border border-amber-400/50'
                              : 'bg-emerald-950/90 text-emerald-200 border border-emerald-400/40'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
                          {item.currentStock} {item.unit || 'Bags'}
                        </span>
                      </td>

                      {/* Last Restocked Date */}
                      <td className="p-4 whitespace-nowrap text-xs text-slate-100 font-bold font-mono">
                        {item.lastRestocked || 'N/A'}
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditItem({ ...item })}
                            className="px-2.5 py-1.5 bg-[#062C1E] hover:bg-amber-950/80 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-black transition-all flex items-center gap-1"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-400/40 rounded-lg text-xs font-black transition-all flex items-center gap-1"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
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

      {/* REQUIREMENT 2: EXPENSE SUMMARY SECTION AT THE BOTTOM OF THE PAGE */}
      <div className="bg-[#062C1E] p-6 rounded-3xl border border-[#C5A059]/50 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C5A059]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#04140E] text-[#F3D082] flex items-center justify-center border border-[#C5A059]/40 shadow">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif-brand font-black text-white">
                Expense Summary
              </h3>
              <p className="text-xs text-slate-100 font-semibold">
                Calculated in real time from Feed & Medicine inventory purchase records.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#F3D082] bg-[#04140E] px-3 py-1 rounded-full border border-[#C5A059]/30 self-start sm:self-auto">
            Live Automated Calculations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Monthly Expense Card */}
          <div className="bg-[#04140E] p-5 rounded-2xl border border-[#C5A059]/35 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider block">
                This Month Total Expense
              </span>
              <span className="text-xs text-slate-100 font-bold font-mono">
                {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="text-2xl font-serif-brand font-black text-[#F3D082]">
              ₹{thisMonthTotalExpense.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Yearly Expense Card */}
          <div className="bg-[#04140E] p-5 rounded-2xl border border-[#C5A059]/35 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider block">
                This Year Total Expense
              </span>
              <span className="text-xs text-slate-100 font-bold font-mono">
                Year {currentYear}
              </span>
            </div>
            <div className="text-2xl font-serif-brand font-black text-[#F3D082]">
              ₹{thisYearTotalExpense.toLocaleString('en-IN')}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: ADD INVENTORY ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 border border-[#C5A059]/50 shadow-2xl text-white my-8 space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-lg font-serif-brand font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#F3D082]" /> Add Feed & Medicine Inventory Purchase
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-black text-[#F3D082] mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subabul Green Fodder / PPR Vaccine Doses"
                  value={newItem.itemName}
                  onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Category Type *</label>
                  <select
                    value={newItem.type}
                    onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  >
                    <option value="Feed">Feed</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Natu Kolla">Natu Kolla</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Packaging Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bags, Boxes, Sacks, Vials"
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Venkateshwara Agri Feeds"
                    value={newItem.supplierName}
                    onChange={e => setNewItem({ ...newItem, supplierName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. 9848012345"
                    value={newItem.supplierContact}
                    onChange={e => setNewItem({ ...newItem, supplierContact: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              {/* Requirement 1: Number of Bags / Boxes & Cost per Bag/Box */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-[#F3D082] mb-1">Number of Bags / Boxes *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newItem.numberOfBagsOrBoxes || ''}
                    onChange={e => {
                      const bags = Number(e.target.value);
                      const cost = Number(newItem.costPerUnit) || 0;
                      setNewItem({
                        ...newItem,
                        numberOfBagsOrBoxes: bags,
                        totalPurchaseAmount: bags * cost
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#F3D082] mb-1">Cost per Bag / Box (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItem.costPerUnit || ''}
                    onChange={e => {
                      const cost = Number(e.target.value);
                      const bags = Number(newItem.numberOfBagsOrBoxes) || 0;
                      setNewItem({
                        ...newItem,
                        costPerUnit: cost,
                        totalPurchaseAmount: bags * cost
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                  />
                </div>
              </div>

              {/* Requirement 1: Total Purchase Amount Auto-calculated */}
              <div className="p-3 bg-[#04140E] border border-[#C5A059]/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block font-black text-xs text-[#F3D082]">Total Purchase Amount (₹)</span>
                  <span className="text-[11px] text-slate-100 font-bold">
                    Formula: {newItem.numberOfBagsOrBoxes || 0} {newItem.unit || 'Bags'} × ₹{newItem.costPerUnit || 0}
                  </span>
                </div>
                <div className="text-xl font-serif-brand font-black text-[#F3D082]">
                  ₹{((Number(newItem.numberOfBagsOrBoxes) || 0) * (Number(newItem.costPerUnit) || 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItem.currentStock}
                    onChange={e => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Alert Threshold *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newItem.minAlertStock}
                    onChange={e => setNewItem({ ...newItem, minAlertStock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={newItem.lastRestocked}
                    onChange={e => setNewItem({ ...newItem, lastRestocked: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#E5C158] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Save Inventory Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 bg-[#062C1E] text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-[#C5A059]/30"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDIT INVENTORY ITEM */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 border border-[#C5A059]/50 shadow-2xl text-white my-8 space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-lg font-serif-brand font-black text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-300" /> Edit Inventory Item
              </h3>
              <button onClick={() => setEditItem(null)} className="text-slate-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-black text-[#F3D082] mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={editItem.itemName}
                  onChange={e => setEditItem({ ...editItem, itemName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Category Type *</label>
                  <select
                    value={editItem.type}
                    onChange={e => setEditItem({ ...editItem, type: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  >
                    <option value="Feed">Feed</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Natu Kolla">Natu Kolla</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Packaging Unit *</label>
                  <input
                    type="text"
                    required
                    value={editItem.unit}
                    onChange={e => setEditItem({ ...editItem, unit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={editItem.supplierName}
                    onChange={e => setEditItem({ ...editItem, supplierName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={editItem.supplierContact}
                    onChange={e => setEditItem({ ...editItem, supplierContact: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              {/* Number of Bags / Boxes & Cost per Bag/Box */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-[#F3D082] mb-1">Number of Bags / Boxes *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editItem.numberOfBagsOrBoxes || ''}
                    onChange={e => {
                      const bags = Number(e.target.value);
                      const cost = Number(editItem.costPerUnit) || 0;
                      setEditItem({
                        ...editItem,
                        numberOfBagsOrBoxes: bags,
                        totalPurchaseAmount: bags * cost
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#F3D082] mb-1">Cost per Bag / Box (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editItem.costPerUnit || ''}
                    onChange={e => {
                      const cost = Number(e.target.value);
                      const bags = Number(editItem.numberOfBagsOrBoxes) || 0;
                      setEditItem({
                        ...editItem,
                        costPerUnit: cost,
                        totalPurchaseAmount: bags * cost
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                  />
                </div>
              </div>

              {/* Total Purchase Amount Auto-calculated */}
              <div className="p-3 bg-[#04140E] border border-[#C5A059]/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block font-black text-xs text-[#F3D082]">Total Purchase Amount (₹)</span>
                  <span className="text-[11px] text-slate-100 font-bold">
                    Formula: {editItem.numberOfBagsOrBoxes || 0} {editItem.unit || 'Bags'} × ₹{editItem.costPerUnit || 0}
                  </span>
                </div>
                <div className="text-xl font-serif-brand font-black text-[#F3D082]">
                  ₹{((Number(editItem.numberOfBagsOrBoxes) || 0) * (Number(editItem.costPerUnit) || 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editItem.currentStock}
                    onChange={e => setEditItem({ ...editItem, currentStock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Alert Threshold *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editItem.minAlertStock}
                    onChange={e => setEditItem({ ...editItem, minAlertStock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={editItem.lastRestocked}
                    onChange={e => setEditItem({ ...editItem, lastRestocked: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#E5C158] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Update Inventory Record
                </button>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-5 py-3 bg-[#062C1E] text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-[#C5A059]/30"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="dark-glass-card rounded-3xl max-w-md w-full p-6 border border-red-500/40 shadow-2xl text-[#F2F2ED] space-y-5 text-center">
            
            <div className="w-14 h-14 bg-red-950/80 text-red-400 rounded-2xl mx-auto flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-serif-brand font-bold text-[#F2F2ED]">
                Are you sure you want to delete this item?
              </h3>
              <p className="text-xs text-emerald-200/70 mt-2">
                Item: <strong className="text-[#C5A059]">{deleteConfirmItem.itemName}</strong> ({deleteConfirmItem.numberOfBagsOrBoxes} {deleteConfirmItem.unit})
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-3 bg-[#062C1E] hover:bg-[#093d29] text-emerald-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-[#C5A059]/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
