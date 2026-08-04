import { 
  Animal, 
  Product, 
  ProductCategory,
  StockStatus,
  PriceHistoryRecord,
  Order, 
  InventoryItem, 
  FinancialRecord, 
  Task, 
  AttendanceRecord, 
  LeaveRequest, 
  ContactMessage, 
  User,
  AppNotification,
  FeedHealthLog,
  ChatMessage,
  ChatConversation,
  PaymentSettings
} from '../types';
import { encryptText, decryptText } from './encryption';
import founder1 from '@/assets/founders/1.jpg';
import founder2 from '@/assets/founders/2.jpg';
import founder3 from '@/assets/founders/3.jpg';

export const AUTHORIZED_OWNERS = [
  { name: 'Neelam Ramachandraiah', mobile: '9502756669', email: 'admin@farm.com' },
  { name: 'Neelam Subbaiah', mobile: '8897288390', email: 'subbaiah@farm.com' },
  { name: 'Sreenu Neelam (Owner)', mobile: '9392589010', email: 'owner9392589010@farm.com' }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    fullName: 'Neelam Ramachandraiah',
    email: 'admin@farm.com',
    mobileNumber: '9502756669',
    username: 'ramachandraiah',
    role: 'admin',
    address: 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.',
    createdAt: '2024-01-01',
    status: 'Active',
    isApproved: true,
    avatarUrl: founder1
  },
  {
    id: 'usr-admin-2',
    fullName: 'Neelam Subbaiah',
    email: 'subbaiah@farm.com',
    mobileNumber: '8897288390',
    username: 'subbaiah',
    role: 'admin',
    address: 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.',
    createdAt: '2024-01-01',
    status: 'Active',
    isApproved: true,
    avatarUrl: founder2
  },
  {
    id: 'usr-admin-3',
    fullName: 'Neelam Sreenivasulu',
    email: 'owner9392589010@farm.com',
    mobileNumber: '9392589010',
    username: 'owner9392589010',
    role: 'admin',
    address: 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.',
    createdAt: '2024-01-01',
    status: 'Active',
    isApproved: true,
    avatarUrl: founder3
  }
];

const INITIAL_ANIMALS: Animal[] = [];

const INITIAL_PRODUCTS: Product[] = [
  // 1. LOCAL SHEEP
  {
    id: 'prd-1',
    name: 'Local Sheep',
    category: 'Sheep',
    breed: 'Local',
    weightRange: '25–50 kg',
    weightKg: 35,
    pricePerKg: 550,
    totalPrice: 19250,
    price: 19250,
    unit: 'per head',
    stockQuantity: 12,
    stockStatus: 'In Stock',
    description: '100% pure Local breed live sheep. Reared on organic leguminous fodder and natural mineral grazing.',
    imageUrl: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=85',
    isActive: true,
    isAvailable: true,
    createdBy: 'Farm Management',
    updatedBy: 'Farm Management',
    updatedAt: new Date().toISOString(),
    priceHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        oldPricePerKg: 550,
        newPricePerKg: 550,
        oldTotalPrice: 19250,
        newTotalPrice: 19250,
        updatedBy: 'System Admin',
        timestamp: new Date().toISOString()
      }
    ]
  },
  // 2. LOCAL GOAT
  {
    id: 'prd-2',
    name: 'Local Goat',
    category: 'Goat',
    breed: 'Local',
    weightRange: '25–50 kg',
    weightKg: 35,
    pricePerKg: 580,
    totalPrice: 20300,
    price: 20300,
    unit: 'per head',
    stockQuantity: 15,
    stockStatus: 'In Stock',
    description: 'Pure Local breed live goat reared in free-range organic farm conditions. Excellent dual-purpose breed.',
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=1200&q=85',
    isActive: true,
    isAvailable: true,
    createdBy: 'Farm Management',
    updatedBy: 'Farm Management',
    updatedAt: new Date().toISOString(),
    priceHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        oldPricePerKg: 580,
        newPricePerKg: 580,
        oldTotalPrice: 20300,
        newTotalPrice: 20300,
        updatedBy: 'System Admin',
        timestamp: new Date().toISOString()
      }
    ]
  },
  // 3. LOCAL NATU KOLLA
  {
    id: 'prd-3',
    name: 'Local Natu Kolla',
    category: 'Natu Kolla',
    breed: 'Local',
    weightRange: '1–5 kg',
    weightKg: 2.5,
    pricePerKg: 750,
    totalPrice: 1875,
    price: 1875,
    unit: 'per bird',
    stockQuantity: 25,
    stockStatus: 'In Stock',
    description: 'Authentic village-reared Local Natu Kolla country chicken. 100% organic free-range, fed on natural millets.',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=85',
    isActive: true,
    isAvailable: true,
    createdBy: 'Farm Management',
    updatedBy: 'Farm Management',
    updatedAt: new Date().toISOString(),
    priceHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        oldPricePerKg: 750,
        newPricePerKg: 750,
        oldTotalPrice: 1875,
        newTotalPrice: 1875,
        updatedBy: 'System Admin',
        timestamp: new Date().toISOString()
      }
    ]
  }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    itemName: 'Subabul & Lucerne Green Fodder Feed',
    type: 'Feed',
    supplierName: 'Sri Venkateshwara Agri Feeds',
    supplierContact: '9848012345',
    currentStock: 120,
    minAlertStock: 30,
    unit: 'Bags',
    costPerUnit: 1100,
    numberOfBagsOrBoxes: 15,
    totalPurchaseAmount: 16500,
    lastRestocked: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'inv-2',
    itemName: 'PPR & LaSota Vaccine Doses',
    type: 'Medicine',
    supplierName: 'Kadapa Veterinary Pharma',
    supplierContact: '9440156789',
    currentStock: 15,
    minAlertStock: 20, // triggers alert
    unit: 'Boxes',
    costPerUnit: 450,
    numberOfBagsOrBoxes: 25,
    totalPurchaseAmount: 11250,
    lastRestocked: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'inv-3',
    itemName: 'Automatic Poultry Nipple Drinkers',
    type: 'Equipment',
    supplierName: 'Deccan Farm Equipment Ltd',
    supplierContact: '9100234567',
    currentStock: 50,
    minAlertStock: 10,
    unit: 'Boxes',
    costPerUnit: 250,
    numberOfBagsOrBoxes: 10,
    totalPurchaseAmount: 2500,
    lastRestocked: new Date().toISOString().slice(0, 10)
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'LVF-2024-001',
    customerId: 'usr-customer',
    customerName: 'Sreenu Neelam',
    customerMobile: '9392589010',
    deliveryAddress: 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289',
    items: [
      {
        productId: 'prd-2',
        productName: 'Pure Natu Kolla (Country Live Rooster / Hen)',
        unitPrice: 1800,
        quantity: 2,
        totalPrice: 3600
      },
      {
        productId: 'prd-3',
        productName: 'Super Napier CO-FS-29 Green Grass (Fresh Fodder)',
        unitPrice: 15,
        quantity: 100,
        totalPrice: 1500
      }
    ],
    totalAmount: 5100,
    paymentMode: 'Cash on Delivery (Pay at Farm / Handover)',
    paymentStatus: 'Pending Payment',
    orderStatus: 'Delivered',
    notes: 'Please deliver before 11 AM.',
    createdAt: '2024-07-25'
  },
  {
    id: 'ord-1002',
    orderNumber: 'LVF-2024-002',
    customerId: 'usr-customer',
    customerName: 'Sreenu Neelam',
    customerMobile: '9392589010',
    deliveryAddress: 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289',
    items: [
      {
        productId: 'prd-1',
        productName: 'Local Jodipi Breeding Sheep (Prime Live)',
        unitPrice: 18500,
        quantity: 1,
        totalPrice: 18500
      },
      {
        productId: 'prd-4',
        productName: 'Lucerne / Hybrid Pasture Green Grass (Fodder Bundle)',
        unitPrice: 120,
        quantity: 20,
        totalPrice: 2400
      }
    ],
    totalAmount: 20900,
    paymentMode: 'Cash on Delivery (Pay at Farm / Handover)',
    paymentStatus: 'Pending Payment',
    orderStatus: 'Confirmed',
    notes: 'Farm pickup arranged for Sunday morning.',
    createdAt: '2024-07-28'
  }
];

const INITIAL_FINANCIALS: FinancialRecord[] = [
  {
    id: 'fin-1',
    type: 'Income',
    category: 'Animal Sale',
    title: 'Sale of 2 Local Rams for Festival',
    amount: 37000,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Neelam Ramachandraiah',
    notes: 'Sold to direct local farm buyer.'
  },
  {
    id: 'fin-2',
    type: 'Income',
    category: 'Product Sale',
    title: 'Natu Kolla & Green Grass Bulk Delivery',
    amount: 14200,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Neelam Subbaiah'
  },
  {
    id: 'fin-3',
    type: 'Expense',
    category: 'Feed Purchase',
    title: '50 Bags Green Fodder & Grain Feed',
    amount: 18500,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Neelam Ramachandraiah'
  },
  {
    id: 'fin-4',
    type: 'Expense',
    category: 'Worker Salary',
    title: 'Monthly Wages for 3 Farm Hand Workers',
    amount: 36000,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Neelam Subbaiah'
  },
  {
    id: 'fin-5',
    type: 'Income',
    category: 'Product Sale',
    title: 'Sale of 100 Bundles Super Napier Green Grass',
    amount: 12000,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Neelam Ramachandraiah'
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-1',
    title: 'Morning Sheep Grazing & Shed Cleaning',
    workTask: 'Sheep Grazing',
    description: 'Lead Section B Local sheep to green pasture paddock. Clean water troughs and disinfect floor with lime powder.',
    assignedWorkerId: 'usr-worker',
    assignedWorkerName: 'Neelam Subbaiah',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'High',
    status: 'In Progress'
  },
  {
    id: 'tsk-2',
    title: 'Green Grass Harvesting & Paddock Irrigation',
    workTask: 'Feed Distribution',
    description: 'Harvest Super Napier green grass from Plot C. Irrigate pasture fields and distribute fresh green fodder to sheep pens.',
    assignedWorkerId: 'usr-worker',
    assignedWorkerName: 'Neelam Subbaiah',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'High',
    status: 'Pending'
  },
  {
    id: 'tsk-3',
    title: 'Weekly Deworming & Health Inspection',
    workTask: 'Vaccination',
    description: 'Administer deworming oral suspension to 15 young sheep lambs. Log weights in the system.',
    assignedWorkerId: 'usr-worker',
    assignedWorkerName: 'Farm Staff 1',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'Medium',
    status: 'Pending'
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    workerId: 'usr-worker',
    workerName: 'Neelam Subbaiah',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: '06:30 AM',
    checkOutTime: '05:30 PM',
    totalHours: '11.0 hrs',
    notes: 'Completed all morning & evening feeding duties.'
  },
  {
    id: 'att-2',
    workerId: 'usr-worker-2',
    workerName: 'Farm Staff 1',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: '07:00 AM',
    checkOutTime: '04:30 PM',
    totalHours: '9.5 hrs',
    notes: 'Handled sheep dipping & health inspection.'
  },
  {
    id: 'att-3',
    workerId: 'usr-worker',
    workerName: 'Neelam Subbaiah',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'Present',
    checkInTime: '06:30 AM',
    checkOutTime: '06:00 PM',
    totalHours: '11.5 hrs',
    notes: 'Regular duty shift completed.'
  }
];

const INITIAL_FEED_HEALTH_LOGS: FeedHealthLog[] = [
  {
    id: 'fhl-1',
    animalTag: 'LV-SHP-101',
    category: 'Sheep',
    workerId: 'usr-worker',
    workerName: 'Neelam Subbaiah',
    status: 'Healthy',
    feedLog: 'Distributed 6kg Lucerne green fodder & mineral mixture. All animals active and feeding well.',
    date: new Date().toISOString().split('T')[0],
    createdAt: '07:30 AM'
  },
  {
    id: 'fhl-2',
    animalTag: 'LV-NTK-201',
    category: 'Natu Kolla',
    workerId: 'usr-worker',
    workerName: 'Farm Staff 1',
    status: 'Healthy',
    feedLog: 'Fed native grain mix & fresh water trough refill. Health inspection clear.',
    date: new Date().toISOString().split('T')[0],
    createdAt: '08:15 AM'
  },
  {
    id: 'fhl-3',
    animalTag: 'LV-SHP-102',
    category: 'Sheep',
    workerId: 'usr-worker',
    workerName: 'Neelam Subbaiah',
    status: 'Under Treatment',
    feedLog: 'Deworming suspension administered. Minor sluggishness observed in morning routine.',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    createdAt: '09:00 AM'
  }
];

const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'lev-1',
    workerId: 'usr-worker',
    workerName: 'Farm Staff',
    reason: 'Family temple festival ceremony',
    startDate: '2026-08-05',
    endDate: '2026-08-06',
    status: 'Approved',
    appliedOn: '2026-07-20'
  }
];

const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    customerId: 'CUST-1001',
    name: 'K. Venkat Rao',
    mobile: '9440987654',
    email: 'venkat.rao@gmail.com',
    subject: 'Bulk Local Sheep Purchase for Farm Breeding',
    message: 'Hello, I want to purchase 10 female Local Palla sheep and 1 stud ram. Please send me your best wholesale price and delivery availability.',
    date: new Date().toISOString(),
    status: 'Unread',
    isRead: false
  },
  {
    id: 'msg-2',
    customerId: 'CUST-1002',
    name: 'Dr. Suresh V.',
    mobile: '9849012345',
    email: 'suresh.vet@yahoo.com',
    subject: 'Super Napier Green Grass Bulk Order',
    message: 'We require 500 kg of fresh Super Napier CO-FS-29 green grass fodder for our livestock farm near Kadiri. Can you deliver this Saturday?',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'Read',
    isRead: true
  }
];

export const WELCOME_MESSAGE_TEXT = `👋 Welcome to Lakshmi Venkateshwara Sheep & Natu Kolla Farm!

Thank you for contacting us.

Our Farm Owner or Support Team will review your message and get back to you as soon as possible.

We appreciate your patience and look forward to serving you.

This is an automatic system message.`;

const INITIAL_CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-usr-cust-1',
    customerId: 'usr-cust-1',
    customerName: 'Sreenu Neelam',
    customerMobile: '9876543210',
    customerEmail: 'customer@farm.com',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    lastMessage: '👋 Welcome to Lakshmi Venkateshwara Sheep & Natu Kolla Farm!',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    unreadCountAdmin: 1,
    unreadCountCustomer: 0,
    isArchived: false,
    isBlocked: false,
    orderId: 'ORD-98214',
    lastActive: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    customerOnline: true
  },
  {
    id: 'conv-usr-cust-2',
    customerId: 'usr-cust-2',
    customerName: 'Venkatesh K.',
    customerMobile: '9123456789',
    customerEmail: 'venkatesh@gmail.com',
    lastMessage: '👋 Welcome to Lakshmi Venkateshwara Sheep & Natu Kolla Farm!',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    unreadCountAdmin: 0,
    unreadCountCustomer: 0,
    isArchived: false,
    isBlocked: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    customerOnline: false
  }
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-conv-usr-cust-1',
    conversationId: 'conv-usr-cust-1',
    senderId: 'sys-farm-team',
    senderName: 'Farm System',
    senderRole: 'system',
    recipientId: 'usr-cust-1',
    recipientRole: 'customer',
    text: encryptText(WELCOME_MESSAGE_TEXT),
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    encrypted: true,
    isSystemMessage: true
  },
  {
    id: 'msg-init-1',
    conversationId: 'conv-usr-cust-1',
    senderId: 'usr-admin-1',
    senderName: 'Neelam Ramachandraiah (Farm Owner)',
    senderRole: 'admin',
    recipientId: 'usr-cust-1',
    recipientRole: 'customer',
    text: encryptText('Namaste Sreenu Garu! Welcome to Sri Neelam Livestock & Agro Farm. How can we help you today?'),
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    encrypted: true
  },
  {
    id: 'msg-init-2',
    conversationId: 'conv-usr-cust-1',
    senderId: 'usr-cust-1',
    senderName: 'Sreenu Neelam',
    senderRole: 'customer',
    recipientId: 'usr-admin-1',
    recipientRole: 'admin',
    text: encryptText('Hello Ramachandraiah Garu, is the Local Jodipi Sheep flock available for visit this weekend?'),
    orderId: 'ORD-98214',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    encrypted: true
  },
  {
    id: 'msg-welcome-conv-usr-cust-2',
    conversationId: 'conv-usr-cust-2',
    senderId: 'sys-farm-team',
    senderName: 'Farm System',
    senderRole: 'system',
    recipientId: 'usr-cust-2',
    recipientRole: 'customer',
    text: encryptText(WELCOME_MESSAGE_TEXT),
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    encrypted: true,
    isSystemMessage: true
  },
  {
    id: 'msg-init-3',
    conversationId: 'conv-usr-cust-2',
    senderId: 'usr-cust-2',
    senderName: 'Venkatesh K.',
    senderRole: 'customer',
    recipientId: 'usr-admin-1',
    recipientRole: 'admin',
    text: encryptText('Thank you for delivering the 5kg Natu Kolla! Quality is top-notch.'),
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    encrypted: true
  }
];

export interface FarmDescriptionLog {
  id: string;
  previousDescription: string;
  newDescription: string;
  updatedBy: string;
  timestamp: string;
}

export interface FarmInfo {
  farmName: string;
  farmDescription: string;
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  googleMapsUrl: string;
  primaryContactName: string;
  primaryContactPhone: string;
  lastUpdatedDescriptionAt?: string;
  lastUpdatedDescriptionBy?: string;
  descriptionLogs?: FarmDescriptionLog[];
}

export const DEFAULT_FARM_INFO: FarmInfo = {
  farmName: 'Lakshmi Venkateshwara Sheep & Natu Kolla Farm',
  farmDescription: 'Lakshmi Venkateshwara Sheep & Natu Kolla Farm is dedicated to breeding and supplying healthy Local Jodipi Sheep and Free-Range Natu Kolla. We follow natural farming practices and focus on quality livestock, animal welfare, customer satisfaction, and sustainable farming.',
  address: 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.',
  village: 'Devarajapalli Village',
  mandal: 'Kamalapuram Mandal',
  district: 'YSR Kadapa District',
  state: 'Andhra Pradesh',
  pincode: '516289',
  country: 'India',
  googleMapsUrl: 'https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6',
  primaryContactName: 'Neelam Ramachandraiah',
  primaryContactPhone: '+91 9502756669',
  lastUpdatedDescriptionAt: new Date().toISOString(),
  lastUpdatedDescriptionBy: 'Neelam Ramachandraiah (Admin)',
  descriptionLogs: []
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  defaultPaymentMethod: 'Cash on Delivery (Pay at Farm / On Handover)',
  isOnlinePaymentEnabled: false,
  noteText: 'Currently, payments are accepted only at the time of product delivery or farm handover. Online payment methods such as UPI, PhonePe, Google Pay, and Direct Bank Transfer are disabled until enabled by the Owner/Admin.',
  upiId: '',
  phonePeNumber: '',
  googlePayNumber: '',
  bankAccountName: '',
  bankAccountNumber: '',
  ifscCode: '',
  bankName: '',
  qrCodeUrl: '',
  additionalInstructions: 'Pay cash or hand over payment directly at farm pickup or to the delivery executive upon receiving products.',
  lastUpdatedBy: 'Owner / Admin',
  lastUpdatedAt: new Date().toISOString()
};

// Local Storage Helper
class LocalDB {
  getPaymentSettings(): PaymentSettings {
    return this.getItem<PaymentSettings>('lvf_payment_settings', DEFAULT_PAYMENT_SETTINGS);
  }

  savePaymentSettings(settings: Partial<PaymentSettings>, updatedBy?: string): PaymentSettings {
    const current = this.getPaymentSettings();
    const updated: PaymentSettings = {
      ...current,
      ...settings,
      lastUpdatedBy: updatedBy || 'Owner / Admin',
      lastUpdatedAt: new Date().toISOString()
    };
    this.setItem('lvf_payment_settings', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payment_settings_updated', { detail: updated }));
    }
    return updated;
  }

  getFarmInfo(): FarmInfo {
    return this.getItem<FarmInfo>('lvf_farm_info', DEFAULT_FARM_INFO);
  }

  saveFarmInfo(info: Partial<FarmInfo>, updatedBy?: string): FarmInfo {
    const current = this.getFarmInfo();
    const updatedLogs = current.descriptionLogs ? [...current.descriptionLogs] : [];
    
    if (info.farmDescription !== undefined && info.farmDescription.trim() !== current.farmDescription) {
      const now = new Date().toISOString();
      const newLog: FarmDescriptionLog = {
        id: 'log-' + Date.now(),
        previousDescription: current.farmDescription,
        newDescription: info.farmDescription.trim(),
        updatedBy: updatedBy || 'Owner / Admin',
        timestamp: now
      };
      updatedLogs.unshift(newLog);
      info.lastUpdatedDescriptionAt = now;
      info.lastUpdatedDescriptionBy = updatedBy || 'Owner / Admin';
    }

    const updated = {
      ...current,
      ...info,
      descriptionLogs: updatedLogs
    };
    this.setItem('lvf_farm_info', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farm_info_updated', { detail: updated }));
    }
    return updated;
  }
  private getItem<T>(key: string, initial: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : initial;
    } catch {
      return initial;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }

  // Users
  getUsers(): User[] {
    const stored = this.getItem<User[]>('lvf_users', INITIAL_USERS);
    const cleaned = stored.filter(u => 
      u.fullName && 
      !u.fullName.toLowerCase().includes('ramesh') && 
      u.username !== 'rameshworker' && 
      u.id !== 'usr-worker-1' && 
      u.id !== 'usr-customer-1'
    );
    if (cleaned.length !== stored.length) {
      this.saveUsers(cleaned);
    }
    return cleaned;
  }
  saveUsers(users: User[]) { this.setItem('lvf_users', users); }

  getAdmins(): User[] {
    return this.getUsers().filter(u => u.role === 'admin' || u.role === 'owner');
  }

  getWorkers(): User[] {
    return this.getUsers().filter(u => u.role === 'worker');
  }

  getCustomers(): User[] {
    return this.getUsers().filter(u => u.role === 'customer');
  }

  // Animals
  getAnimals(): Animal[] {
    const stored = this.getItem<Animal[]>('lvf_animals', INITIAL_ANIMALS);
    const demoIds = ['anm-101', 'anm-102', 'anm-103', 'anm-201', 'anm-202', 'anm-203'];
    const cleaned = stored.filter(a => 
      !demoIds.includes(a.id) && 
      !a.tagNumber.startsWith('LV-SHP-10') && 
      !a.tagNumber.startsWith('LV-NTK-20')
    );
    if (cleaned.length !== stored.length) {
      this.saveAnimals(cleaned);
    }
    return cleaned;
  }
  saveAnimals(animals: Animal[]) { this.setItem('lvf_animals', animals); }

  adjustProductStock(category: string, delta: number) {
    const products = this.getProducts();
    const updated = products.map(p => {
      const matchCat = p.category === category || 
        (category === 'Natu Kolla' && p.id === 'prd-3') || 
        (category === 'Sheep' && p.id === 'prd-1') || 
        (category === 'Goat' && p.id === 'prd-2');
      if (matchCat) {
        const newQty = Math.max(0, (p.stockQuantity || 0) + delta);
        const newStatus: StockStatus = newQty <= 0 ? 'Out of Stock' : newQty <= 5 ? 'Low Stock' : 'In Stock';
        return {
          ...p,
          stockQuantity: newQty,
          stockStatus: newStatus,
          isAvailable: newQty > 0
        };
      }
      return p;
    });
    this.saveProducts(updated);
    return updated;
  }

  // Products
  getProducts(): Product[] {
    const stored = this.getItem<Product[]>('lvf_products', INITIAL_PRODUCTS);
    const validCategories: ProductCategory[] = ['Sheep', 'Goat', 'Natu Kolla'];
    // Filter out obsolete initial product IDs from previous schema version
    const obsoleteIds = ['prd-4', 'prd-5', 'prd-6', 'prd-7', 'prd-8', 'prd-9'];
    const filtered = stored.filter(p => validCategories.includes(p.category as any) && !obsoleteIds.includes(p.id));

    if (filtered.length === 0) {
      this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }

    const defaultCategoryImg = (cat: ProductCategory) => {
      if (cat === 'Sheep') return 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=85';
      if (cat === 'Goat') return 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=1200&q=85';
      return 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=85';
    };

    const deduplicated: Product[] = [];
    let hasNatuKolla = false;
    let hasSheep = false;
    let hasGoat = false;

    for (const p of filtered) {
      const cat = p.category as ProductCategory;
      const isNatuKolla = cat === 'Natu Kolla' || p.name.includes('Natu Kolla') || p.name.includes('Chicks') || p.id === 'prd-3';
      const isSheep = (cat === 'Sheep' && (p.id === 'prd-1' || p.name.includes('Sheep'))) || p.id === 'prd-1';
      const isGoat = (cat === 'Goat' && (p.id === 'prd-2' || p.name.includes('Goat'))) || p.id === 'prd-2';

      if (isNatuKolla) {
        if (!hasNatuKolla) {
          hasNatuKolla = true;
          const nkWeight = (p.weightKg && p.weightKg >= 1 && p.weightKg <= 5) ? Number(p.weightKg) : 2.5;
          const nkRate = Number(p.pricePerKg) || 750;
          deduplicated.push({
            ...p,
            id: 'prd-3',
            name: 'Local Natu Kolla',
            category: 'Natu Kolla',
            breed: 'Local',
            weightRange: '1–5 kg',
            weightKg: nkWeight,
            pricePerKg: nkRate,
            totalPrice: Math.round(nkWeight * nkRate),
            price: Math.round(nkWeight * nkRate),
            unit: 'per bird'
          });
        }
      } else if (isSheep) {
        if (!hasSheep) {
          hasSheep = true;
          deduplicated.push({
            ...p,
            id: 'prd-1',
            name: 'Local Sheep',
            category: 'Sheep',
            breed: 'Local',
            weightRange: '25–50 kg',
            weightKg: Number(p.weightKg) || 35,
            pricePerKg: Number(p.pricePerKg) || 550,
            unit: 'per head'
          });
        }
      } else if (isGoat) {
        if (!hasGoat) {
          hasGoat = true;
          deduplicated.push({
            ...p,
            id: 'prd-2',
            name: 'Local Goat',
            category: 'Goat',
            breed: 'Local',
            weightRange: '25–50 kg',
            weightKg: Number(p.weightKg) || 35,
            pricePerKg: Number(p.pricePerKg) || 580,
            unit: 'per head'
          });
        }
      } else {
        deduplicated.push(p);
      }
    }

    if (!hasSheep) deduplicated.push(INITIAL_PRODUCTS[0]);
    if (!hasGoat) deduplicated.push(INITIAL_PRODUCTS[1]);
    if (!hasNatuKolla) deduplicated.push(INITIAL_PRODUCTS[2]);

    const sanitized = deduplicated.map(p => {
      const cat = p.category as ProductCategory;
      let name = p.name;
      let breed = p.breed || 'Local';
      let weightRange = p.weightRange;

      if (p.id === 'prd-1' || cat === 'Sheep') {
        name = 'Local Sheep';
        breed = 'Local';
        weightRange = '25–50 kg';
      } else if (p.id === 'prd-2' || cat === 'Goat') {
        name = 'Local Goat';
        breed = 'Local';
        weightRange = '25–50 kg';
      } else if (p.id === 'prd-3' || cat === 'Natu Kolla') {
        name = 'Local Natu Kolla';
        breed = 'Local';
        weightRange = '1–5 kg';
      }

      if (!weightRange) {
        weightRange = cat === 'Natu Kolla' ? '1–5 kg' : (cat === 'Sheep' || cat === 'Goat' ? '25–50 kg' : `${p.weightKg || 1} kg`);
      }

      const isNatuKollaCat = cat === 'Natu Kolla' || p.id === 'prd-3';
      const weightKg = isNatuKollaCat
        ? (Number(p.weightKg) >= 1 && Number(p.weightKg) <= 5 ? Number(p.weightKg) : 2.5)
        : (Number(p.weightKg) || 35);

      const pricePerKg = Number(p.pricePerKg) || (cat === 'Natu Kolla' ? 750 : cat === 'Sheep' ? 550 : 580);
      const calculatedTotal = Math.round(weightKg * pricePerKg);

      return {
        ...p,
        name,
        category: cat,
        breed,
        weightRange,
        weightKg,
        pricePerKg,
        totalPrice: calculatedTotal,
        price: calculatedTotal,
        unit: p.unit || (cat === 'Natu Kolla' ? 'per bird' : 'per head'),
        stockStatus: p.stockStatus || (p.stockQuantity <= 0 ? 'Out of Stock' : p.stockQuantity <= 5 ? 'Low Stock' : 'In Stock'),
        imageUrl: p.imageUrl || defaultCategoryImg(cat)
      };
    });

    if (sanitized.length !== stored.length) {
      this.saveProducts(sanitized);
    }

    return sanitized;
  }

  saveProducts(products: Product[]) { this.setItem('lvf_products', products); }

  updateCategoryPricePerKg(category: ProductCategory, newPricePerKg: number, updatedBy: string = 'Farm Management'): Product[] {
    const products = this.getProducts();
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const updated = products.map(p => {
      if (p.category === category) {
        const isNatuKollaCat = p.category === 'Natu Kolla' || p.id === 'prd-3';
        const effectiveWeight = isNatuKollaCat
          ? (p.weightKg >= 1 && p.weightKg <= 5 ? p.weightKg : 2.5)
          : (p.weightKg || 1);

        const oldPricePerKg = p.pricePerKg || 0;
        const oldTotalPrice = p.totalPrice || Math.round(effectiveWeight * oldPricePerKg);
        const newTotalPrice = Math.round(effectiveWeight * newPricePerKg);

        const newHistoryRecord: PriceHistoryRecord = {
          date: today,
          oldPricePerKg,
          newPricePerKg,
          oldTotalPrice,
          newTotalPrice,
          updatedBy,
          timestamp
        };

        const existingHistory = p.priceHistory || [];

        return {
          ...p,
          weightKg: effectiveWeight,
          pricePerKg: newPricePerKg,
          totalPrice: newTotalPrice,
          price: newTotalPrice,
          updatedBy,
          updatedAt: timestamp,
          priceHistory: [newHistoryRecord, ...existingHistory]
        };
      }
      return p;
    });

    this.saveProducts(updated);
    return updated;
  }

  // Inventory
  getInventory(): InventoryItem[] {
    const stored = this.getItem<InventoryItem[]>('lvf_inventory', INITIAL_INVENTORY);
    const sanitized = stored.map(item => {
      const bags = Number(item.numberOfBagsOrBoxes) > 0 
        ? Number(item.numberOfBagsOrBoxes) 
        : (Number(item.currentStock) > 0 ? Number(item.currentStock) : 10);
      const cost = Number(item.costPerUnit) || 0;
      const total = item.totalPurchaseAmount !== undefined && item.totalPurchaseAmount !== null
        ? Number(item.totalPurchaseAmount)
        : Math.round(bags * cost);

      return {
        ...item,
        numberOfBagsOrBoxes: bags,
        costPerUnit: cost,
        totalPurchaseAmount: total,
        unit: item.unit || 'Bags',
        lastRestocked: item.lastRestocked || new Date().toISOString().slice(0, 10)
      };
    });

    return sanitized;
  }
  saveInventory(inv: InventoryItem[]) { this.setItem('lvf_inventory', inv); }

  // Orders
  getOrders(): Order[] { return this.getItem('lvf_orders', INITIAL_ORDERS); }
  saveOrders(orders: Order[]) { this.setItem('lvf_orders', orders); }
  deleteOrder(orderId: string): Order[] {
    const currentOrders = this.getOrders();
    const targetOrder = currentOrders.find(o => o.id === orderId);

    if (targetOrder && targetOrder.items && targetOrder.items.length > 0) {
      const products = this.getProducts();
      let productUpdated = false;
      const updatedProducts = products.map(p => {
        const matchedItem = targetOrder.items.find(item => item.productId === p.id);
        if (matchedItem && matchedItem.quantity > 0) {
          productUpdated = true;
          const newQty = (p.stockQuantity || 0) + matchedItem.quantity;
          const newStatus: StockStatus = newQty <= 0 ? 'Out of Stock' : newQty <= 5 ? 'Low Stock' : 'In Stock';
          return {
            ...p,
            stockQuantity: newQty,
            stockStatus: newStatus,
            isAvailable: newQty > 0
          };
        }
        return p;
      });
      if (productUpdated) {
        this.saveProducts(updatedProducts);
      }
    }

    const updatedOrders = currentOrders.filter(o => o.id !== orderId);
    this.saveOrders(updatedOrders);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lvf_orders_updated', { detail: { deletedId: orderId } }));
    }
    return updatedOrders;
  }

  // Financials
  getFinancials(): FinancialRecord[] { return this.getItem('lvf_financials', INITIAL_FINANCIALS); }
  saveFinancials(fin: FinancialRecord[]) { this.setItem('lvf_financials', fin); }

  // Tasks
  getTasks(): Task[] { return this.getItem('lvf_tasks', INITIAL_TASKS); }
  saveTasks(tasks: Task[]) { this.setItem('lvf_tasks', tasks); }

  // Attendance
  getAttendance(): AttendanceRecord[] { return this.getItem('lvf_attendance', INITIAL_ATTENDANCE); }
  saveAttendance(att: AttendanceRecord[]) { this.setItem('lvf_attendance', att); }

  // Feed & Health Logs
  getFeedHealthLogs(): FeedHealthLog[] { return this.getItem('lvf_feed_health_logs', INITIAL_FEED_HEALTH_LOGS); }
  saveFeedHealthLogs(logs: FeedHealthLog[]) { this.setItem('lvf_feed_health_logs', logs); }

  // Leave Requests
  getLeaves(): LeaveRequest[] { 
    const leaves = this.getItem<LeaveRequest[]>('lvf_leaves', INITIAL_LEAVES);
    return leaves.map(l => {
      if (!l.totalDays) {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate || l.startDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          l.totalDays = diffDays > 0 ? diffDays : 1;
        } else {
          l.totalDays = 1;
        }
      }
      return l;
    });
  }
  saveLeaves(leaves: LeaveRequest[]) { this.setItem('lvf_leaves', leaves); }

  // App Notifications
  getAppNotifications(): AppNotification[] {
    return this.getItem<AppNotification[]>('lvf_app_notifications', []);
  }
  saveAppNotifications(notes: AppNotification[]) {
    this.setItem('lvf_app_notifications', notes);
  }
  addAppNotification(note: {
    recipientRole: 'admin' | 'worker' | 'all';
    recipientUserId?: string;
    title: string;
    message: string;
    type?: 'leave' | 'task' | 'general' | 'approval';
  }) {
    const list = this.getAppNotifications();
    const newNote: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      recipientRole: note.recipientRole,
      recipientUserId: note.recipientUserId,
      title: note.title,
      message: note.message,
      type: note.type || 'general',
      isRead: false,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };
    this.saveAppNotifications([newNote, ...list]);
    return newNote;
  }

  // Contact Messages
  getMessages(): ContactMessage[] { return this.getItem('lvf_messages', INITIAL_MESSAGES); }
  saveMessages(msgs: ContactMessage[]) { this.setItem('lvf_messages', msgs); }

  // In-App Chat Conversations & Messages
  getChatConversations(): ChatConversation[] {
    return this.getItem<ChatConversation[]>('lvf_chat_conversations', INITIAL_CHAT_CONVERSATIONS);
  }

  saveChatConversations(convs: ChatConversation[]) {
    this.setItem('lvf_chat_conversations', convs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lvf_chat_updated'));
    }
  }

  getChatMessages(conversationId?: string): ChatMessage[] {
    const all = this.getItem<ChatMessage[]>('lvf_chat_messages', INITIAL_CHAT_MESSAGES);
    if (conversationId) {
      return all.filter(m => m.conversationId === conversationId);
    }
    return all;
  }

  saveChatMessages(messages: ChatMessage[]) {
    this.setItem('lvf_chat_messages', messages);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lvf_chat_updated'));
    }
  }

  ensureWelcomeMessage(conversationId: string, customerId?: string): void {
    const allMessages = this.getChatMessages();
    const convMsgs = allMessages.filter(m => m.conversationId === conversationId);
    const hasWelcome = convMsgs.some(m => m.isSystemMessage || m.senderRole === 'system');

    if (!hasWelcome) {
      const conversations = this.getChatConversations();
      const conv = conversations.find(c => c.id === conversationId);
      const targetCustId = customerId || (conv ? conv.customerId : 'customer');

      const welcomeMsg: ChatMessage = {
        id: `msg-welcome-${conversationId}`,
        conversationId: conversationId,
        senderId: 'sys-farm-team',
        senderName: 'Farm System',
        senderRole: 'system',
        recipientId: targetCustId,
        recipientRole: 'customer',
        text: encryptText(WELCOME_MESSAGE_TEXT),
        status: 'delivered',
        createdAt: new Date().toISOString(),
        encrypted: true,
        isSystemMessage: true
      };

      this.saveChatMessages([welcomeMsg, ...allMessages]);

      if (conv) {
        if (conv.lastMessage === 'Conversation started' || !conv.lastMessage) {
          conv.lastMessage = '👋 Welcome to Lakshmi Venkateshwara Sheep & Natu Kolla Farm!';
          conv.lastMessageTimestamp = welcomeMsg.createdAt;
          conv.lastActive = welcomeMsg.createdAt;
          this.saveChatConversations(conversations);
        }
      }
    }
  }

  getOrCreateConversation(customer: { id: string; fullName: string; mobileNumber?: string; email?: string; avatarUrl?: string }): ChatConversation {
    const conversations = this.getChatConversations();
    const convId = `conv-${customer.id}`;
    let existing = conversations.find(c => c.customerId === customer.id || c.id === convId);

    if (!existing) {
      existing = {
        id: convId,
        customerId: customer.id,
        customerName: customer.fullName,
        customerMobile: customer.mobileNumber || '',
        customerEmail: customer.email || '',
        customerAvatar: customer.avatarUrl,
        lastMessage: '👋 Welcome to Lakshmi Venkateshwara Sheep & Natu Kolla Farm!',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
        isArchived: false,
        isBlocked: false,
        lastActive: new Date().toISOString(),
        customerOnline: true
      };
      this.saveChatConversations([existing, ...conversations]);
    } else {
      let changed = false;
      if (customer.fullName && existing.customerName !== customer.fullName) {
        existing.customerName = customer.fullName;
        changed = true;
      }
      if (customer.mobileNumber && existing.customerMobile !== customer.mobileNumber) {
        existing.customerMobile = customer.mobileNumber;
        changed = true;
      }
      if (customer.avatarUrl && existing.customerAvatar !== customer.avatarUrl) {
        existing.customerAvatar = customer.avatarUrl;
        changed = true;
      }
      if (changed) {
        this.saveChatConversations(conversations.map(c => c.id === existing!.id ? existing! : c));
      }
    }

    this.ensureWelcomeMessage(existing.id, customer.id);
    return existing;
  }

  sendChatMessage(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'admin';
    recipientId: string;
    recipientRole: 'customer' | 'admin';
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'pdf' | 'document';
    mediaName?: string;
    orderId?: string;
  }): ChatMessage {
    const allMessages = this.getChatMessages();
    const encryptedText = encryptText(params.text);

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      recipientId: params.recipientId,
      recipientRole: params.recipientRole,
      text: encryptedText,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      mediaName: params.mediaName,
      orderId: params.orderId,
      status: 'delivered',
      createdAt: new Date().toISOString(),
      encrypted: true
    };

    const updatedMessages = [...allMessages, newMessage];
    this.saveChatMessages(updatedMessages);

    // Update conversation state
    const conversations = this.getChatConversations();
    const convIndex = conversations.findIndex(c => c.id === params.conversationId);

    const snippetText = params.text.length > 50 ? params.text.substring(0, 50) + '...' : params.text;
    const mediaSnippet = params.mediaUrl ? `[${params.mediaType === 'image' ? '📷 Image' : '📄 Document'}] ${snippetText}` : snippetText;

    if (convIndex !== -1) {
      const conv = conversations[convIndex];
      conv.lastMessage = mediaSnippet;
      conv.lastMessageTimestamp = newMessage.createdAt;
      conv.lastActive = newMessage.createdAt;
      if (params.orderId) conv.orderId = params.orderId;

      if (params.senderRole === 'customer') {
        conv.unreadCountAdmin = (conv.unreadCountAdmin || 0) + 1;
      } else {
        conv.unreadCountCustomer = (conv.unreadCountCustomer || 0) + 1;
      }

      this.saveChatConversations(conversations);
    }

    // Trigger Notification for recipient
    if (params.senderRole === 'customer') {
      this.addAppNotification({
        recipientRole: 'admin',
        title: `💬 New Message from ${params.senderName}`,
        message: mediaSnippet,
        type: 'general'
      });
    } else {
      this.addAppNotification({
        recipientRole: 'all',
        recipientUserId: params.recipientId,
        title: `💬 Farm Owner replied: ${params.senderName}`,
        message: mediaSnippet,
        type: 'general'
      });
    }

    return newMessage;
  }

  editChatMessage(messageId: string, newText: string): boolean {
    const allMessages = this.getChatMessages();
    const msg = allMessages.find(m => m.id === messageId);
    if (!msg) return false;

    // Check 5 min window limit
    const createdAtTime = new Date(msg.createdAt).getTime();
    const now = Date.now();
    if (now - createdAtTime > 5 * 60 * 1000) {
      return false; // Time limit expired
    }

    msg.text = encryptText(newText);
    msg.isEdited = true;
    msg.editedAt = new Date().toISOString();

    this.saveChatMessages(allMessages);
    return true;
  }

  deleteChatMessage(messageId: string, userId: string, role: string): boolean {
    const allMessages = this.getChatMessages();
    const msg = allMessages.find(m => m.id === messageId);
    if (!msg) return false;

    // System welcome messages cannot be deleted
    if (msg.isSystemMessage || msg.senderRole === 'system') {
      return false;
    }

    // Customer can only delete their own messages
    if (role === 'customer' && msg.senderId !== userId && msg.senderRole !== 'customer') {
      return false;
    }

    const updated = allMessages.filter(m => m.id !== messageId);
    this.saveChatMessages(updated);

    // Update conversation snippet if the last message was deleted
    const conversations = this.getChatConversations();
    const conv = conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      const remainingForConv = updated.filter(m => m.conversationId === msg.conversationId);
      if (remainingForConv.length > 0) {
        const lastMsg = remainingForConv[remainingForConv.length - 1];
        const decText = decryptText(lastMsg.text);
        conv.lastMessage = decText.length > 50 ? decText.substring(0, 50) + '...' : decText;
        conv.lastMessageTimestamp = lastMsg.createdAt;
      } else {
        conv.lastMessage = 'No messages';
      }
      this.saveChatConversations(conversations);
    }

    return true;
  }

  markChatAsRead(conversationId: string, readerRole: 'admin' | 'customer') {
    const conversations = this.getChatConversations();
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      if (readerRole === 'admin') conv.unreadCountAdmin = 0;
      else conv.unreadCountCustomer = 0;
      this.saveChatConversations(conversations);
    }

    const allMessages = this.getChatMessages();
    let updated = false;
    allMessages.forEach(m => {
      if (m.conversationId === conversationId && m.recipientRole === readerRole && m.status !== 'read') {
        m.status = 'read';
        updated = true;
      }
    });
    if (updated) {
      this.saveChatMessages(allMessages);
    }
  }

  toggleBlockCustomer(conversationId: string, block: boolean) {
    const conversations = this.getChatConversations();
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isBlocked = block;
      conv.blockedAt = block ? new Date().toISOString() : undefined;
      this.saveChatConversations(conversations);
    }
  }

  toggleArchiveConversation(conversationId: string, archive: boolean) {
    const conversations = this.getChatConversations();
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isArchived = archive;
      this.saveChatConversations(conversations);
    }
  }

  deleteConversation(conversationId: string) {
    const conversations = this.getChatConversations().filter(c => c.id !== conversationId);
    this.saveChatConversations(conversations);

    const allMessages = this.getChatMessages().filter(m => m.conversationId !== conversationId);
    this.saveChatMessages(allMessages);
  }

  // Staff Approval Map & Deleted Staff
  getStaffApprovalMap(): Record<string, boolean> {
    const defaultMap: Record<string, boolean> = {
      'Neelam Ramachandraiah': true,
      'Neelam Sreenivasulu (Owner/Admin)': true,
      'Neelam Subbaiah': true,
      'Farm Staff 1': true,
    };
    return this.getItem<Record<string, boolean>>('lvf_staff_approval_map', defaultMap);
  }
  saveStaffApprovalMap(map: Record<string, boolean>) {
    this.setItem('lvf_staff_approval_map', map);
  }

  getDeletedStaff(): string[] {
    return this.getItem<string[]>('lvf_deleted_staff', []);
  }
  saveDeletedStaff(list: string[]) {
    this.setItem('lvf_deleted_staff', list);
  }

  // Unified Staff Status Management Helpers
  approveWorkerOrStaff(identifier: { userId?: string; staffName?: string; email?: string }) {
    const map = this.getStaffApprovalMap();
    let targetName = identifier.staffName;

    const users = this.getUsers();
    const updatedUsers = users.map(u => {
      const isMatch = (identifier.userId && u.id === identifier.userId) ||
                      (identifier.email && u.email.toLowerCase() === identifier.email.toLowerCase()) ||
                      (identifier.staffName && u.fullName.toLowerCase() === identifier.staffName.toLowerCase());
      if (isMatch) {
        if (!targetName) targetName = u.fullName;
        return {
          ...u,
          status: 'Active' as const,
          isApproved: true,
          isEmailVerified: true
        };
      }
      return u;
    });

    if (targetName) {
      map[targetName] = true;
      this.saveStaffApprovalMap(map);

      const deleted = this.getDeletedStaff().filter(s => s !== targetName && s !== identifier.staffName);
      this.saveDeletedStaff(deleted);
    }
    this.saveUsers(updatedUsers);
  }

  removeWorkerOrStaffApproval(identifier: { userId?: string; staffName?: string; email?: string }) {
    const map = this.getStaffApprovalMap();
    let targetName = identifier.staffName;

    const users = this.getUsers();
    const updatedUsers = users.map(u => {
      const isMatch = (identifier.userId && u.id === identifier.userId) ||
                      (identifier.email && u.email.toLowerCase() === identifier.email.toLowerCase()) ||
                      (identifier.staffName && u.fullName.toLowerCase() === identifier.staffName.toLowerCase());
      if (isMatch) {
        if (!targetName) targetName = u.fullName;
        return {
          ...u,
          status: 'Inactive' as const,
          isApproved: false
        };
      }
      return u;
    });

    if (targetName) {
      map[targetName] = false;
      this.saveStaffApprovalMap(map);
    }
    this.saveUsers(updatedUsers);
  }

  deleteWorkerOrStaff(identifier: { userId?: string; staffName?: string; email?: string }) {
    const map = this.getStaffApprovalMap();
    let targetName = identifier.staffName;

    const users = this.getUsers();
    const remainingUsers = users.filter(u => {
      const isMatch = (identifier.userId && u.id === identifier.userId) ||
                      (identifier.email && u.email.toLowerCase() === identifier.email.toLowerCase()) ||
                      (identifier.staffName && u.fullName.toLowerCase() === identifier.staffName.toLowerCase());
      if (isMatch) {
        if (!targetName) targetName = u.fullName;
        return false; // delete user
      }
      return true;
    });

    if (targetName) {
      delete map[targetName];
      this.saveStaffApprovalMap(map);

      const deleted = Array.from(new Set([...this.getDeletedStaff(), targetName]));
      this.saveDeletedStaff(deleted);
    }
    if (identifier.staffName && identifier.staffName !== targetName) {
      const deleted = Array.from(new Set([...this.getDeletedStaff(), identifier.staffName]));
      this.saveDeletedStaff(deleted);
    }

    this.saveUsers(remainingUsers);
  }

  resetToDefaults() {
    this.saveUsers(INITIAL_USERS);
    this.saveAnimals(INITIAL_ANIMALS);
    this.saveProducts(INITIAL_PRODUCTS);
    this.saveInventory(INITIAL_INVENTORY);
    this.saveOrders(INITIAL_ORDERS);
    this.saveFinancials(INITIAL_FINANCIALS);
    this.saveTasks(INITIAL_TASKS);
    this.saveAttendance(INITIAL_ATTENDANCE);
    this.saveLeaves(INITIAL_LEAVES);
    this.saveMessages(INITIAL_MESSAGES);
  }
}

export const db = new LocalDB();
