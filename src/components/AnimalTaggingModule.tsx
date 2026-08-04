import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Animal, Order, FinancialRecord } from '../types';
import { QRCodeModal } from './QRCodeModal';
import { 
  Tag, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  QrCode, 
  Scale, 
  Calendar, 
  ShieldAlert,
  ShoppingBag
} from 'lucide-react';

interface AnimalTaggingModuleProps {
  userRole?: 'admin' | 'worker' | 'customer' | string | null;
  onNavigateToProducts?: () => void;
  onStockUpdated?: () => void;
}

export const AnimalTaggingModule: React.FC<AnimalTaggingModuleProps> = ({
  userRole = 'admin',
  onNavigateToProducts,
  onStockUpdated
}) => {
  const [animals, setAnimals] = useState<Animal[]>(() => db.getAnimals());
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Sheep' | 'Goat' | 'Natu Kolla'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedAnimalForQR, setSelectedAnimalForQR] = useState<Animal | null>(null);
  const [viewAnimal, setViewAnimal] = useState<Animal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [deleteConfirmAnimal, setDeleteConfirmAnimal] = useState<Animal | null>(null);
  const [markSoldAnimal, setMarkSoldAnimal] = useState<Animal | null>(null);

  // Form state for Adding
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({
    tagNumber: `LV-TAG-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'Sheep',
    breed: 'Local Jodipi',
    gender: 'Male',
    ageMonths: 12,
    weightKg: 35,
    purchasePrice: 10000,
    sellingPrice: 15000,
    status: 'Healthy',
    vaccinationStatus: 'Up to Date',
    medicalHistory: 'Regular grazing & organic feed',
    photoUrl: ''
  });

  // Form state for Sale Modal
  const [salePrice, setSalePrice] = useState<number>(0);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');

  const isAdmin = userRole === 'admin';
  const isWorker = userRole === 'worker';
  const isCustomer = userRole === 'customer';

  // Keep state synchronized with db
  const reloadAnimals = () => {
    const list = db.getAnimals();
    setAnimals(list);
  };

  useEffect(() => {
    reloadAnimals();
  }, []);

  // Filter animals
  const filteredAnimals = animals.filter(a => {
    const matchesCat = categoryFilter === 'All' || a.category === categoryFilter;
    const matchesSearch =
      a.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Action: Add Animal
  const handleSaveNewAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const created: Animal = {
      ...(newAnimal as Animal),
      id: `anm-${Date.now()}`,
      addedDate: new Date().toISOString().slice(0, 10)
    };

    const updated = [created, ...animals];
    db.saveAnimals(updated);
    // Sync product stock +1
    db.adjustProductStock(created.category, 1);

    setAnimals(updated);
    setShowAddModal(false);
    setNewAnimal({
      tagNumber: `LV-TAG-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Sheep',
      breed: 'Local Jodipi',
      gender: 'Male',
      ageMonths: 12,
      weightKg: 35,
      purchasePrice: 10000,
      sellingPrice: 15000,
      status: 'Healthy',
      vaccinationStatus: 'Up to Date',
      medicalHistory: 'Regular grazing & organic feed',
      photoUrl: ''
    });

    if (onStockUpdated) onStockUpdated();
  };

  // Action: Update Animal
  const handleUpdateAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editAnimal) return;

    const updated = animals.map(a => (a.id === editAnimal.id ? editAnimal : a));
    db.saveAnimals(updated);
    setAnimals(updated);
    setEditAnimal(null);
  };

  // Action: Delete / Remove Animal
  const handleConfirmRemoveAnimal = () => {
    if (!isAdmin || !deleteConfirmAnimal) return;

    const animalToRemove = deleteConfirmAnimal;
    const updated = animals.filter(a => a.id !== animalToRemove.id);
    db.saveAnimals(updated);
    
    // Automatically reduce product catalog stock
    db.adjustProductStock(animalToRemove.category, -1);

    setAnimals(updated);
    setDeleteConfirmAnimal(null);

    if (onStockUpdated) onStockUpdated();
  };

  // Action: Mark Animal as Sold
  const handleConfirmMarkAsSold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !markSoldAnimal) return;

    const animal = markSoldAnimal;
    const finalPrice = salePrice || animal.sellingPrice || 0;

    // 1. Record Income in Financials
    const financials = db.getFinancials();
    const newFin: FinancialRecord = {
      id: `fin-${Date.now()}`,
      type: 'Income',
      category: 'Animal Sale',
      title: `Direct Sale: Tagged ${animal.category} (${animal.tagNumber} - ${animal.breed})`,
      amount: finalPrice,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Owner / Admin',
      notes: `Buyer: ${buyerName || 'Direct Customer'} (${buyerPhone || 'N/A'})`
    };
    db.saveFinancials([newFin, ...financials]);

    // 2. Record Completed Order
    const orders = db.getOrders();
    const newOrder: Order = {
      id: `ORD-TAG-${Date.now().toString().slice(-6)}`,
      orderNumber: `LVF-TAG-${Date.now().toString().slice(-6)}`,
      customerId: 'usr-admin',
      customerName: buyerName || 'Direct Buyer',
      customerMobile: buyerPhone || 'N/A',
      deliveryAddress: 'Farm Direct Pick Up',
      items: [
        {
          productId: animal.id,
          productName: `${animal.category} (${animal.tagNumber} - ${animal.breed})`,
          unitPrice: finalPrice,
          quantity: 1,
          totalPrice: finalPrice
        }
      ],
      totalAmount: finalPrice,
      paymentMode: 'Cash on Delivery',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.saveOrders([newOrder, ...orders]);

    // 3. Automatically remove animal from Tagging list and update product catalog stock
    const updated = animals.filter(a => a.id !== animal.id);
    db.saveAnimals(updated);
    db.adjustProductStock(animal.category, -1);

    setAnimals(updated);
    setMarkSoldAnimal(null);

    if (onStockUpdated) onStockUpdated();
  };

  // Requirement 5: Customer access restriction
  if (isCustomer) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="dark-glass-card p-10 rounded-3xl border border-amber-500/30 space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 text-[#C5A059] rounded-2xl mx-auto flex items-center justify-center border border-amber-500/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif-brand font-bold text-[#F2F2ED]">
            Customer Access Restricted
          </h2>
          <p className="text-sm text-emerald-200/80 leading-relaxed max-w-lg mx-auto">
            The internal Animal Tagging and Livestock Tracking module is reserved exclusively for Farm Owners and Workers. As a valued customer, please visit our Product Shop Catalog to purchase verified live sheep, goats, and Natu Kolla.
          </p>
          {onNavigateToProducts && (
            <button
              onClick={onNavigateToProducts}
              className="px-6 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Go to Product Shop Catalog
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Controls: Filters & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#062C1E] p-5 rounded-3xl border border-[#C5A059]/40">
        
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#F3D082]" />
            <h2 className="text-xl font-serif-brand font-black text-white">
              Animal Tagging & QR Identification Module
            </h2>
          </div>
          <p className="text-xs text-slate-100 font-semibold mt-1">
            Total Live Registered Animals: <strong className="text-[#F3D082] font-black">{animals.length}</strong>
            {isWorker && ' • (Worker View Mode: View Only)'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-[#04140E] p-1 rounded-2xl border border-[#C5A059]/30 overflow-x-auto">
            {(['All', 'Sheep', 'Goat', 'Natu Kolla'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#E5C158] text-slate-950 font-black shadow'
                    : 'text-slate-100 font-bold hover:text-[#F3D082]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#F3D082] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tag or breed..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-[#C5A059] placeholder:text-gray-500"
            />
          </div>

          {/* Add Animal Button (Owner/Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-[#E5C158] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Animal
            </button>
          )}
        </div>
      </div>

      {/* Main Animals Table */}
      <div className="dark-glass-card rounded-3xl border border-[#C5A059]/30 overflow-hidden shadow-2xl">
        {filteredAnimals.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-[#062C1E] text-[#F3D082] rounded-2xl mx-auto flex items-center justify-center border border-[#C5A059]/40">
              <Tag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">
              No Animals Found in Tag Catalog
            </h3>
            <p className="text-xs text-slate-100 font-semibold max-w-md mx-auto">
              {animals.length === 0
                ? 'The Animal Tagging catalog is currently empty. Owners/Admins can add new registered livestock using the button above.'
                : 'No registered animals match your current search and category filter.'}
            </p>
            {isAdmin && animals.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-[#E5C158] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register First Animal
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#062C1E] text-[#F3D082] uppercase font-mono tracking-wider border-b border-[#C5A059]/30 font-black">
                <tr>
                  <th className="p-4">Tag Number</th>
                  <th className="p-4">Category & Breed</th>
                  <th className="p-4">Gender & Age</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Price (₹)</th>
                  <th className="p-4">Health Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A059]/15 font-semibold">
                {filteredAnimals.map(animal => (
                  <tr key={animal.id} className="hover:bg-[#062C1E]/70 transition-colors">
                    
                    {/* Tag Number */}
                    <td className="p-4 font-mono font-black text-[#F3D082] whitespace-nowrap text-sm">
                      {animal.tagNumber}
                    </td>

                    {/* Category & Breed */}
                    <td className="p-4">
                      <div className="font-extrabold text-white text-sm">{animal.breed}</div>
                      <div className="text-[11px] text-emerald-300 uppercase font-mono font-bold">{animal.category}</div>
                    </td>

                    {/* Gender & Age */}
                    <td className="p-4 whitespace-nowrap text-slate-100 font-bold">
                      {animal.gender} • {animal.ageMonths} mo
                    </td>

                    {/* Weight */}
                    <td className="p-4 font-extrabold text-white whitespace-nowrap text-sm">
                      {animal.weightKg} kg
                    </td>

                    {/* Selling Price */}
                    <td className="p-4 font-black text-[#F3D082] whitespace-nowrap text-sm">
                      ₹{animal.sellingPrice.toLocaleString('en-IN')}
                    </td>

                    {/* Health Status */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          animal.status === 'Healthy'
                            ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-400/40'
                            : 'bg-amber-950/90 text-amber-200 border border-amber-400/50'
                        }`}
                      >
                        {animal.status}
                      </span>
                    </td>

                    {/* Actions Column: View, Edit, Remove, Mark as Sold */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* VIEW ACTION (All Roles) */}
                        <button
                          onClick={() => setViewAnimal(animal)}
                          className="px-2.5 py-1.5 bg-[#062C1E] hover:bg-[#093d29] text-[#F3D082] border border-[#C5A059]/40 rounded-lg text-[11px] font-black transition-all flex items-center gap-1"
                          title="View Details & QR"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {/* EDIT ACTION (Owner/Admin Only) */}
                        {isAdmin && (
                          <button
                            onClick={() => setEditAnimal({ ...animal })}
                            className="px-2.5 py-1.5 bg-[#062C1E] hover:bg-amber-950/80 text-amber-300 border border-amber-400/40 rounded-lg text-[11px] font-black transition-all flex items-center gap-1"
                            title="Edit Animal Record"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}

                        {/* REMOVE ACTION (Owner/Admin Only) */}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteConfirmAnimal(animal)}
                            className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-400/40 rounded-lg text-[11px] font-black transition-all flex items-center gap-1"
                            title="Remove Animal"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}

                        {/* MARK AS SOLD ACTION (Owner/Admin Only) */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setMarkSoldAnimal(animal);
                              setSalePrice(animal.sellingPrice);
                              setBuyerName('');
                              setBuyerPhone('');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-400/40 rounded-lg text-[11px] font-black transition-all flex items-center gap-1"
                            title="Mark as Sold"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Mark Sold
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW ANIMAL DETAILS */}
      {viewAnimal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 border border-[#C5A059]/50 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-[#F3D082]">
                  Tag: {viewAnimal.tagNumber}
                </span>
                <h3 className="text-xl font-serif-brand font-black text-white">
                  {viewAnimal.breed}
                </h3>
              </div>
              <button
                onClick={() => setViewAnimal(null)}
                className="p-1.5 text-slate-200 hover:text-white rounded-lg bg-[#062C1E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#04140E] p-4 rounded-2xl border border-[#C5A059]/30">
              <div className="text-slate-100 font-extrabold">Category: <strong className="text-[#F3D082] font-black">{viewAnimal.category}</strong></div>
              <div className="text-slate-100 font-extrabold">Gender: <strong className="text-white font-black">{viewAnimal.gender}</strong></div>
              <div className="text-slate-100 font-extrabold">Age: <strong className="text-white font-black">{viewAnimal.ageMonths} Months</strong></div>
              <div className="text-slate-100 font-extrabold">Weight: <strong className="text-white font-black">{viewAnimal.weightKg} kg</strong></div>
              <div className="text-slate-100 font-extrabold">Health: <strong className="text-emerald-300 font-black">{viewAnimal.status}</strong></div>
              <div className="text-slate-100 font-extrabold">Vaccination: <strong className="text-white font-black">{viewAnimal.vaccinationStatus}</strong></div>
              <div className="text-slate-100 font-extrabold">Purchase Cost: <strong className="text-emerald-300 font-black">₹{viewAnimal.purchasePrice?.toLocaleString('en-IN')}</strong></div>
              <div className="text-slate-100 font-extrabold">Selling Price: <strong className="text-[#F3D082] font-black">₹{viewAnimal.sellingPrice?.toLocaleString('en-IN')}</strong></div>
            </div>

            {viewAnimal.medicalHistory && (
              <div className="text-xs bg-[#04140E]/90 p-3 rounded-xl border border-[#C5A059]/30">
                <span className="text-[#F3D082] font-black block mb-1">Medical & Feeding History:</span>
                <p className="text-slate-100 font-bold leading-relaxed">{viewAnimal.medicalHistory}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#C5A059]/30">
              <button
                onClick={() => {
                  setSelectedAnimalForQR(viewAnimal);
                }}
                className="px-4 py-2.5 bg-[#062C1E] hover:bg-[#093d29] border border-[#C5A059]/50 text-[#F3D082] text-xs font-black uppercase tracking-wider rounded-xl shadow transition-colors flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" /> Print / View QR Tag
              </button>

              <button
                onClick={() => setViewAnimal(null)}
                className="px-5 py-2.5 bg-[#E5C158] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ANIMAL */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 border border-[#C5A059]/50 shadow-2xl text-white my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-xl font-serif-brand font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#F3D082]" /> Register New Livestock Animal
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAnimal} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-[#F3D082] mb-1">Tag Number *</label>
                <input
                  type="text"
                  required
                  value={newAnimal.tagNumber}
                  onChange={e => setNewAnimal({ ...newAnimal, tagNumber: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-mono font-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Category *</label>
                  <select
                    value={newAnimal.category}
                    onChange={e => setNewAnimal({ ...newAnimal, category: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  >
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Natu Kolla">Natu Kolla</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Breed Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Local Jodipi, Palla, Aseel"
                    value={newAnimal.breed}
                    onChange={e => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Gender *</label>
                  <select
                    value={newAnimal.gender}
                    onChange={e => setNewAnimal({ ...newAnimal, gender: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Age (Months) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAnimal.ageMonths}
                    onChange={e => setNewAnimal({ ...newAnimal, ageMonths: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min={0.1}
                    value={newAnimal.weightKg}
                    onChange={e => setNewAnimal({ ...newAnimal, weightKg: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#F3D082] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newAnimal.sellingPrice}
                    onChange={e => setNewAnimal({ ...newAnimal, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-100 mb-1">Health Status</label>
                <select
                  value={newAnimal.status}
                  onChange={e => setNewAnimal({ ...newAnimal, status: e.target.value as any })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                >
                  <option value="Healthy">Healthy & Active</option>
                  <option value="Under Observation">Under Observation</option>
                  <option value="Quarantine">Quarantine</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-100 mb-1">Medical / Feed History Notes</label>
                <textarea
                  rows={2}
                  value={newAnimal.medicalHistory}
                  onChange={e => setNewAnimal({ ...newAnimal, medicalHistory: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#E5C158] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Save Animal Record
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

      {/* MODAL 3: EDIT ANIMAL */}
      {editAnimal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="dark-glass-card rounded-3xl max-w-lg w-full p-6 border border-[#C5A059]/50 shadow-2xl text-white my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-xl font-serif-brand font-black text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-300" /> Edit Animal ({editAnimal.tagNumber})
              </h3>
              <button onClick={() => setEditAnimal(null)} className="text-slate-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAnimal} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-[#F3D082] mb-1">Tag Number</label>
                <input
                  type="text"
                  required
                  value={editAnimal.tagNumber}
                  onChange={e => setEditAnimal({ ...editAnimal, tagNumber: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-mono font-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Category</label>
                  <select
                    value={editAnimal.category}
                    onChange={e => setEditAnimal({ ...editAnimal, category: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  >
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Natu Kolla">Natu Kolla</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Breed Name</label>
                  <input
                    type="text"
                    required
                    value={editAnimal.breed}
                    onChange={e => setEditAnimal({ ...editAnimal, breed: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-100 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editAnimal.weightKg}
                    onChange={e => setEditAnimal({ ...editAnimal, weightKg: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#F3D082] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editAnimal.sellingPrice}
                    onChange={e => setEditAnimal({ ...editAnimal, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-100 mb-1">Health Status</label>
                <select
                  value={editAnimal.status}
                  onChange={e => setEditAnimal({ ...editAnimal, status: e.target.value as any })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Under Observation">Under Observation</option>
                  <option value="Quarantine">Quarantine</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-100 mb-1">Medical / Feeding Notes</label>
                <textarea
                  rows={2}
                  value={editAnimal.medicalHistory || ''}
                  onChange={e => setEditAnimal({ ...editAnimal, medicalHistory: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#E5C158] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Update Animal
                </button>
                <button
                  type="button"
                  onClick={() => setEditAnimal(null)}
                  className="px-5 py-3 bg-[#062C1E] text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-[#C5A059]/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REMOVE ANIMAL CONFIRMATION POPUP (REQUIREMENT 2) */}
      {deleteConfirmAnimal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="dark-glass-card rounded-3xl max-w-md w-full p-6 border border-red-500/50 shadow-2xl text-white space-y-5 text-center">
            
            <div className="w-14 h-14 bg-red-950 text-red-300 rounded-2xl mx-auto flex items-center justify-center border border-red-500/40">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-serif-brand font-black text-white">
                Are you sure you want to remove this animal?
              </h3>
              <p className="text-xs text-slate-100 font-bold mt-2">
                Animal Tag: <strong className="text-[#F3D082] font-black">{deleteConfirmAnimal.tagNumber}</strong> ({deleteConfirmAnimal.category} - {deleteConfirmAnimal.breed})
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAnimal(null)}
                className="flex-1 py-3 bg-[#062C1E] hover:bg-[#093d29] text-slate-100 font-black text-xs uppercase tracking-wider rounded-xl border border-[#C5A059]/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveAnimal}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Remove
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: MARK AS SOLD (REQUIREMENT 3) */}
      {markSoldAnimal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="dark-glass-card rounded-3xl max-w-md w-full p-6 border border-emerald-500/50 shadow-2xl text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
              <h3 className="text-lg font-serif-brand font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-300" /> Mark Animal as Sold
              </h3>
              <button onClick={() => setMarkSoldAnimal(null)} className="text-slate-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-100 font-bold">
              Selling Tagged Animal: <strong className="text-[#F3D082] font-black">{markSoldAnimal.tagNumber}</strong> ({markSoldAnimal.category} - {markSoldAnimal.breed}, {markSoldAnimal.weightKg} kg)
            </p>

            <form onSubmit={handleConfirmMarkAsSold} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-[#F3D082] mb-1">Final Sale Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={salePrice}
                  onChange={e => setSalePrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-black"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-100 mb-1">Buyer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Local Buyer / Restaurant"
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-100 mb-1">Buyer Mobile (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#C5A059]/40 rounded-xl text-xs text-black font-extrabold"
                />
              </div>

              <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-xl text-[11px] text-slate-100 font-bold space-y-1">
                <div className="flex items-center gap-1 text-emerald-300 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Automatic System Updates:
                </div>
                <div>• Removes Tag #{markSoldAnimal.tagNumber} from Tagging catalog</div>
                <div>• Adds ₹{salePrice.toLocaleString('en-IN')} to Sales Income History</div>
                <div>• Decrements {markSoldAnimal.category} stock in Product Shop</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Confirm Sale & Remove Tag
                </button>
                <button
                  type="button"
                  onClick={() => setMarkSoldAnimal(null)}
                  className="px-4 py-3 bg-[#062C1E] text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-[#C5A059]/30"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* QR CODE PRINT MODAL */}
      <QRCodeModal
        animal={selectedAnimalForQR}
        onClose={() => setSelectedAnimalForQR(null)}
      />

    </div>
  );
};
