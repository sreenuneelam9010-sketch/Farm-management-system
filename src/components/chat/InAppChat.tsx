import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Lock, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  UserCheck, 
  UserX, 
  Archive, 
  ArchiveRestore, 
  ShoppingBag, 
  Phone, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ChevronLeft,
  MessageSquare,
  Sparkles,
  Circle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { ChatMessage, ChatConversation, Order } from '../../types';
import { decryptText } from '../../lib/encryption';

interface InAppChatProps {
  userRole: 'customer' | 'admin' | 'worker';
  customerId?: string;
}

const QUICK_EMOJIS = ['😊', '👍', '🐑', '🌾', '📦', '💰', '❓', '🙏', '🚜', '🩺', '📍', '❤️'];

export const InAppChat: React.FC<InAppChatProps> = ({ userRole, customerId }) => {
  const { user } = useAuth();

  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  
  // Media Attachment
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: 'image' | 'pdf' | 'document' } | null>(null);
  
  // UI Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived' | 'blocked'>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Edit Message
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Target & Toast Notification
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'message' | 'conversation';
    id: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Mobile navigation pane toggle
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Auto Scroll Ref
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customer's Orders for Quick Attach
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Load and sync conversations
  const loadConversations = () => {
    const allConvs = db.getChatConversations();
    
    if (userRole === 'customer') {
      const activeUser = user || { id: customerId || 'usr-cust-1', fullName: 'Customer' };
      const currentConv = db.getOrCreateConversation({
        id: activeUser.id,
        fullName: activeUser.fullName,
        mobileNumber: (activeUser as any).mobileNumber || (activeUser as any).mobile,
        email: activeUser.email,
        avatarUrl: activeUser.avatarUrl
      });
      setConversations([currentConv]);
      setSelectedConvId(currentConv.id);
    } else {
      setConversations(allConvs);
      if (!selectedConvId && allConvs.length > 0) {
        setSelectedConvId(allConvs[0].id);
      }
    }
  };

  // Load Messages for Selected Conversation
  const loadMessages = () => {
    if (!selectedConvId) return;
    db.ensureWelcomeMessage(selectedConvId);
    const msgs = db.getChatMessages(selectedConvId);
    setMessages(prev => {
      if (prev.length === msgs.length) {
        const prevLast = prev[prev.length - 1];
        const newLast = msgs[msgs.length - 1];
        if (prevLast?.id === newLast?.id && prevLast?.status === newLast?.status && prevLast?.text === newLast?.text) {
          return prev;
        }
      }
      return msgs;
    });

    // Automatically mark read for current user role
    db.markChatAsRead(selectedConvId, userRole);
  };

  // Load Customer Orders for attach menu
  useEffect(() => {
    if (userRole === 'customer' && user) {
      const orders = db.getOrders().filter(o => o.customerId === user.id || o.customerName === user.fullName);
      setCustomerOrders(orders);
    } else if (selectedConvId) {
      const conv = conversations.find(c => c.id === selectedConvId);
      if (conv) {
        const orders = db.getOrders().filter(o => o.customerId === conv.customerId || o.customerName === conv.customerName);
        setCustomerOrders(orders);
      }
    }
  }, [userRole, user, selectedConvId, conversations]);

  // Initial load and sync listeners
  useEffect(() => {
    loadConversations();

    const handleChatUpdated = () => {
      loadConversations();
      if (selectedConvId) {
        loadMessages();
      }
    };

    window.addEventListener('lvf_chat_updated', handleChatUpdated);
    window.addEventListener('storage', handleChatUpdated);

    // Interval poll for instant typing/delivery simulation
    const interval = setInterval(() => {
      handleChatUpdated();
    }, 1500);

    return () => {
      window.removeEventListener('lvf_chat_updated', handleChatUpdated);
      window.removeEventListener('storage', handleChatUpdated);
      clearInterval(interval);
    };
  }, [selectedConvId, userRole]);

  // Load messages whenever selected conversation changes
  useEffect(() => {
    if (selectedConvId) {
      loadMessages();
      setMobileShowThread(true);
    }
  }, [selectedConvId]);

  // Scroll chat box container ONLY to bottom when messages or selected thread change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, selectedConvId]);

  const activeConversation = conversations.find(c => c.id === selectedConvId);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("File size exceeds 10MB. Please select a smaller document or photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'document';
      setAttachment({
        url: dataUrl,
        name: file.name,
        type: fileType
      });
    };
    reader.readAsDataURL(file);
  };

  // Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachment) return;
    if (!selectedConvId || !activeConversation) return;

    if (activeConversation.isBlocked) {
      alert("This conversation is currently blocked by Farm Management.");
      return;
    }

    const senderName = userRole === 'customer' 
      ? (user?.fullName || 'Customer') 
      : (user?.fullName ? `${user.fullName} (Farm Owner)` : 'Neelam Ramachandraiah (Farm Owner)');

    const senderId = user?.id || (userRole === 'customer' ? 'usr-cust-1' : 'usr-admin-1');
    const recipientId = userRole === 'customer' ? 'usr-admin-1' : activeConversation.customerId;

    db.sendChatMessage({
      conversationId: selectedConvId,
      senderId,
      senderName,
      senderRole: userRole,
      recipientId,
      recipientRole: userRole === 'customer' ? 'admin' : 'customer',
      text: inputText.trim(),
      mediaUrl: attachment?.url,
      mediaType: attachment?.type,
      mediaName: attachment?.name,
      orderId: selectedOrderId || undefined
    });

    setInputText('');
    setAttachment(null);
    setSelectedOrderId('');
    setShowEmojiPicker(false);
    loadMessages();
  };

  // Quick Inquiry Handler
  const handleQuickInquiry = (text: string) => {
    setInputText(text);
  };

  // Handle Edit Message
  const handleStartEdit = (msg: ChatMessage) => {
    // Check 5 min limit
    const createdAtTime = new Date(msg.createdAt).getTime();
    if (Date.now() - createdAtTime > 5 * 60 * 1000) {
      alert("Editing is only allowed within 5 minutes of sending.");
      return;
    }
    setEditingMessage(msg);
    setEditText(decryptText(msg.text));
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editText.trim()) return;
    const success = db.editChatMessage(editingMessage.id, editText.trim());
    if (success) {
      setEditingMessage(null);
      setEditText('');
      loadMessages();
    } else {
      setEditError("Editing expired. Messages can only be edited within 5 minutes of sending.");
    }
  };

  // Delete Message & Conversation Handlers
  const requestDeleteMessage = (msgId: string) => {
    setDeleteTarget({ type: 'message', id: msgId });
  };

  const requestDeleteConversation = (convId: string) => {
    setDeleteTarget({ type: 'conversation', id: convId });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'message') {
      const userId = user?.id || (userRole === 'customer' ? 'usr-cust-1' : 'usr-admin-1');
      const ok = db.deleteChatMessage(deleteTarget.id, userId, userRole);
      if (ok) {
        showToast("✅ Message deleted successfully.");
        loadMessages();
        loadConversations();
      }
    } else if (deleteTarget.type === 'conversation') {
      db.deleteConversation(deleteTarget.id);
      setSelectedConvId(null);
      showToast("✅ Conversation deleted successfully.");
      loadConversations();
    }

    setDeleteTarget(null);
  };

  // Filter Conversations for Admin Inbox
  const filteredConversations = conversations.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      c.customerName.toLowerCase().includes(query) || 
      c.customerMobile.includes(query) || 
      c.lastMessage.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') return c.unreadCountAdmin > 0;
    if (activeFilter === 'archived') return !!c.isArchived;
    if (activeFilter === 'blocked') return !!c.isBlocked;
    
    // 'all' shows non-archived by default
    return !c.isArchived;
  });

  // Date Formatter helpers
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateHeader = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-[#04140E] border border-[#C5A059]/30 rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col lg:flex-row text-[#F2F2ED]">
      
      {/* LEFT SIDEBAR: Conversations Inbox (Admin) / Title (Customer) */}
      <div className={`w-full lg:w-80 xl:w-96 border-r border-[#C5A059]/20 bg-[#062C1E] flex flex-col ${mobileShowThread ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Inbox Header */}
        <div className="p-4 border-b border-[#C5A059]/20 bg-[#04140E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#062C1E] border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#F2F2ED]">
                {userRole === 'admin' ? 'Customer Conversations' : 'Farm Direct Support'}
              </h2>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3 text-[#C5A059]" /> End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Admin Filters & Search */}
        {userRole === 'admin' && (
          <div className="p-3 space-y-2 border-b border-[#C5A059]/15">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C5A059]" />
              <input
                type="text"
                placeholder="Search name or mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'archived', label: 'Archived' },
                { id: 'blocked', label: 'Blocked' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    activeFilter === f.id
                      ? 'bg-[#C5A059] text-slate-950 font-black'
                      : 'bg-[#04140E] text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#C5A059]/10">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-[#C5A059]/50 mx-auto" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = conv.id === selectedConvId;
              const unreadCount = userRole === 'admin' ? conv.unreadCountAdmin : conv.unreadCountCustomer;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setMobileShowThread(true);
                  }}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 hover:bg-[#083d2a] ${
                    isSelected ? 'bg-[#08422e] border-l-4 border-[#C5A059]' : ''
                  }`}
                >
                  {/* Customer Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#04140E] border border-[#C5A059]/40 overflow-hidden flex items-center justify-center font-bold text-sm text-[#C5A059]">
                      {conv.customerAvatar ? (
                        <img src={conv.customerAvatar} alt={conv.customerName} className="w-full h-full object-cover" />
                      ) : (
                        conv.customerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {conv.customerOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#062C1E] rounded-full"></span>
                    )}
                  </div>

                  {/* Conv Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-[#F2F2ED] truncate">
                        {userRole === 'admin' ? conv.customerName : 'Farm Owners & Admin'}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(conv.lastMessageTimestamp)}
                      </span>
                    </div>

                    {userRole === 'admin' && conv.customerMobile && (
                      <p className="text-[10px] text-[#C5A059] font-medium">{conv.customerMobile}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-slate-300 truncate font-normal">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#C5A059] text-slate-950 font-black text-[10px] shadow shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {conv.orderId && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                        Order #{conv.orderId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Security Footer Notice */}
        <div className="p-3 bg-[#04140E] border-t border-[#C5A059]/20 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Restricted to Owners & Customer only</span>
        </div>
      </div>

      {/* RIGHT MAIN PANEL: Active Chat Thread */}
      <div className={`flex-1 flex flex-col bg-[#04140E] ${!mobileShowThread ? 'hidden lg:flex' : 'flex'}`}>
        
        {activeConversation ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 bg-[#062C1E] border-b border-[#C5A059]/20 flex items-center justify-between">
              
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setMobileShowThread(false)}
                  className="lg:hidden p-1.5 bg-[#04140E] text-slate-300 rounded-xl hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-[#04140E] border border-[#C5A059]/50 overflow-hidden flex items-center justify-center font-bold text-[#C5A059]">
                    {userRole === 'admin' ? (
                      activeConversation.customerAvatar ? (
                        <img src={activeConversation.customerAvatar} alt={activeConversation.customerName} className="w-full h-full object-cover" />
                      ) : (
                        activeConversation.customerName.charAt(0).toUpperCase()
                      )
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#062C1E] rounded-full"></span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#F2F2ED] flex items-center gap-2">
                    <span>
                      {userRole === 'admin' ? activeConversation.customerName : 'Sri Neelam Livestock (Farm Owners)'}
                    </span>
                    {activeConversation.isBlocked && (
                      <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-500/30 rounded text-[9px] font-bold">
                        Blocked
                      </span>
                    )}
                  </h3>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Online
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">
                      {userRole === 'admin' ? activeConversation.customerMobile : 'N. Ramachandraiah & N. Subbaiah'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Action Menu */}
              {userRole === 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      db.toggleBlockCustomer(activeConversation.id, !activeConversation.isBlocked);
                      loadConversations();
                    }}
                    title={activeConversation.isBlocked ? 'Unblock Customer' : 'Block Customer'}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                      activeConversation.isBlocked 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900' 
                        : 'bg-red-950/60 text-red-300 border-red-500/30 hover:bg-red-900'
                    }`}
                  >
                    {activeConversation.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    <span className="hidden sm:inline">{activeConversation.isBlocked ? 'Unblock' : 'Block'}</span>
                  </button>

                  <button
                    onClick={() => {
                      db.toggleArchiveConversation(activeConversation.id, !activeConversation.isArchived);
                      loadConversations();
                    }}
                    title={activeConversation.isArchived ? 'Unarchive' : 'Archive'}
                    className="p-2 bg-[#04140E] border border-[#C5A059]/30 text-slate-300 rounded-xl hover:text-white transition-colors"
                  >
                    {activeConversation.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => requestDeleteConversation(activeConversation.id)}
                    title="Delete Conversation"
                    className="p-2 bg-red-950/80 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-900 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

            {/* End-to-End Encryption Banner */}
            <div className="bg-[#062C1E]/80 border-b border-[#C5A059]/20 p-2.5 text-center text-[11px] text-[#C5A059] flex items-center justify-center gap-2 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Messages are End-to-End Encrypted. Only you and Farm Management can read this chat.</span>
            </div>

            {/* Quick Customer Inquiry Buttons */}
            {userRole === 'customer' && (
              <div className="p-2 bg-[#04140E] border-b border-[#C5A059]/15 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-bold shrink-0 ml-2">Quick Questions:</span>
                {[
                  '📦 What is the current status of my order?',
                  '🐑 What is the price per kg for Local Sheep?',
                  '🌾 Is Super Napier green grass available in stock?',
                  '📍 Can I visit the farm this Sunday?'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickInquiry(chip)}
                    className="px-3 py-1 bg-[#062C1E] border border-[#C5A059]/30 rounded-full text-slate-200 hover:text-white hover:border-[#C5A059] whitespace-nowrap transition-all shadow-sm cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Message Bubble Stream */}
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-3xl bg-[#062C1E] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-[#F2F2ED]">Start a Direct Conversation</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Ask questions about sheep & goat breeds, live weight pricing, fodder delivery, or order status.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSystem = msg.isSystemMessage || msg.senderRole === 'system';
                  const isMine = userRole === msg.senderRole;
                  const decryptedBody = decryptText(msg.text);

                  // System Message Banner
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex flex-col items-center my-3 w-full px-2">
                        <div className="w-full max-w-xl bg-[#062C1E]/95 border-2 border-[#C5A059]/60 rounded-2xl p-4 shadow-xl text-slate-100 space-y-3 relative overflow-hidden backdrop-blur-md">
                          <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-[#C5A059] text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
                                <Sparkles className="w-3 h-3" /> System Message
                              </span>
                              <span className="text-xs font-bold text-[#F2F2ED]">
                                Farm Support Team
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#C5A059] flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-md border border-[#C5A059]/20">
                              <Clock className="w-3 h-3 text-[#C5A059]" />
                              {formatDateTime(msg.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans font-medium">
                            {decryptedBody}
                          </p>

                          <div className="pt-1.5 flex items-center justify-between text-[10px] text-emerald-300/80 border-t border-emerald-900/40 font-mono">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-[#C5A059]" /> Automated Official Welcome
                            </span>
                            <span className="text-slate-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Customer / Admin Message
                  const canDelete = userRole === 'admin' || (userRole === 'customer' && (msg.senderId === user?.id || msg.senderRole === 'customer'));

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Sender Tag */}
                      <span className="text-[10px] text-slate-400 font-semibold px-1">
                        {msg.senderName}
                      </span>

                      {/* Bubble */}
                      <div className="relative group max-w-[85%] sm:max-w-[70%]">
                        <div
                          className={`p-3.5 rounded-2xl shadow-lg border text-xs leading-relaxed space-y-2 ${
                            isMine
                              ? 'bg-[#065F46] border-[#C5A059]/50 text-white rounded-tr-none'
                              : 'bg-[#1E293B] border-slate-700 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          {/* Attached Order Tag */}
                          {msg.orderId && (
                            <div className="p-2 rounded-xl bg-black/40 border border-[#C5A059]/40 text-[#C5A059] font-bold text-[11px] flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="w-3.5 h-3.5" /> Order #{msg.orderId}
                              </span>
                            </div>
                          )}

                          {/* Media Attachment Rendering */}
                          {msg.mediaUrl && (
                            <div className="rounded-xl overflow-hidden border border-black/30 bg-black/20">
                              {msg.mediaType === 'image' ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt="Attachment"
                                  onClick={() => setPreviewImage(msg.mediaUrl!)}
                                  className="w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              ) : (
                                <div className="p-3 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#C5A059]" />
                                    <span className="font-bold text-xs truncate max-w-[150px]">
                                      {msg.mediaName || 'Document.pdf'}
                                    </span>
                                  </div>
                                  <a
                                    href={msg.mediaUrl}
                                    download={msg.mediaName || 'Document.pdf'}
                                    className="p-1.5 bg-[#C5A059] text-slate-950 font-bold rounded-lg hover:bg-white transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Text Message */}
                          {decryptedBody && (
                            <p className="whitespace-pre-wrap break-words">{decryptedBody}</p>
                          )}

                          {/* Footer: Time, Edited Badge, Checkmarks */}
                          <div className={`flex items-center justify-end gap-1.5 text-[10px] ${isMine ? 'text-emerald-200' : 'text-slate-400'} pt-1`}>
                            {msg.isEdited && <span className="italic font-mono">(edited)</span>}
                            <span>{formatTime(msg.createdAt)}</span>

                            {isMine && (
                              <span title={msg.status}>
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-300" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover Action Menu for Edit & Delete */}
                        {(isMine || canDelete) && (
                          <div
                            className={`absolute top-2 ${isMine ? '-left-14' : '-right-14'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#04140E] p-1 rounded-xl border border-[#C5A059]/30 shadow-md`}
                          >
                            {isMine && (
                              <button
                                onClick={() => handleStartEdit(msg)}
                                title="Edit message (within 5m)"
                                className="p-1 hover:text-[#C5A059] text-slate-400 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => requestDeleteMessage(msg.id)}
                                title="Delete message"
                                className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Attachment Preview Box above Input */}
            {attachment && (
              <div className="p-3 bg-[#062C1E] border-t border-[#C5A059]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {attachment.type === 'image' ? (
                    <img src={attachment.url} alt="Attach Preview" className="w-10 h-10 rounded-lg object-cover border border-[#C5A059]" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#04140E] border border-[#C5A059] flex items-center justify-center text-[#C5A059]">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="font-bold text-white block truncate max-w-[200px]">{attachment.name}</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-mono">{attachment.type} attachment ready</span>
                  </div>
                </div>
                <button
                  onClick={() => setAttachment(null)}
                  className="p-1 bg-[#04140E] hover:bg-red-950 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Emoji Quick Drawer */}
            {showEmojiPicker && (
              <div className="p-2 bg-[#062C1E] border-t border-[#C5A059]/20 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold text-[#C5A059] uppercase ml-2">Quick Emoji:</span>
                {QUICK_EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 bg-[#04140E] hover:bg-[#C5A059]/20 rounded-xl text-lg transition-transform hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#062C1E] border-t border-[#C5A059]/30 flex flex-col gap-2">
              
              {/* Optional Order Select dropdown */}
              {customerOrders.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="bg-[#04140E] border border-[#C5A059]/30 rounded-lg px-2 py-1 text-[11px] text-[#F2F2ED] outline-none"
                  >
                    <option value="">Link to Order (Optional)...</option>
                    {customerOrders.map(o => (
                      <option key={o.id} value={o.orderNumber}>
                        Order #{o.orderNumber} - ₹{o.totalAmount.toLocaleString('en-IN')} ({o.orderStatus})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Emoji toggle */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 bg-[#04140E] border border-[#C5A059]/30 text-slate-300 hover:text-[#C5A059] rounded-xl transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Attachment File Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-[#04140E] border border-[#C5A059]/30 text-slate-300 hover:text-[#C5A059] rounded-xl transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Text Field */}
                <input
                  type="text"
                  placeholder={activeConversation.isBlocked ? "Conversation blocked by admin" : "Type your message securely..."}
                  disabled={activeConversation.isBlocked}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] placeholder:text-slate-500 focus:outline-none focus:border-[#C5A059]"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={activeConversation.isBlocked || (!inputText.trim() && !attachment)}
                  className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-40 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Send</span>
                </button>
              </div>
            </form>

          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-[#C5A059]" />
            <h3 className="text-lg font-bold text-white">Select a Customer Thread</h3>
            <p className="text-xs max-w-sm">Choose a conversation from the left panel to reply instantly to customer inquiries.</p>
          </div>
        )}

      </div>

      {/* EDIT MESSAGE MODAL */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#062C1E] border border-[#C5A059] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3">
              <h3 className="text-sm font-extrabold text-[#F2F2ED] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#C5A059]" /> Edit Message (Within 5m)
              </h3>
              <button onClick={() => setEditingMessage(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editError}
              </div>
            )}

            <textarea
              rows={3}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full p-3 bg-[#04140E] border border-[#C5A059]/40 rounded-xl text-xs text-[#F2F2ED] focus:outline-none focus:border-[#C5A059]"
            ></textarea>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 bg-[#04140E] text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#C5A059] text-slate-950 font-black text-xs rounded-xl shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 bg-[#062C1E] text-white rounded-full border border-[#C5A059]"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImage} alt="Full Attachment Preview" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-[#C5A059]/40" />
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#062C1E] border-2 border-[#C5A059]/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 text-[#F2F2ED]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F2F2ED]">
                  {deleteTarget.type === 'conversation' ? 'Delete Entire Conversation' : 'Delete Message'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {deleteTarget.type === 'conversation'
                    ? 'Are you sure you want to delete this entire conversation and all its messages?'
                    : 'Are you sure you want to delete this message?'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-amber-300/80 bg-black/40 p-3 rounded-xl border border-amber-500/20">
              ⚠️ This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SUCCESS NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#062C1E] border-2 border-[#C5A059] text-[#F2F2ED] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-7 h-7 rounded-full bg-[#C5A059] text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow">
            ✓
          </div>
          <span className="font-bold text-xs sm:text-sm text-[#F2F2ED]">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
