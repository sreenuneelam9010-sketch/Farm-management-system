export type UserRole = 'admin' | 'owner' | 'worker' | 'customer';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  mobile?: string;
  username: string;
  role: UserRole;
  address?: string;
  createdAt: string;
  avatarUrl?: string;
  status?: 'Active' | 'Pending Approval' | 'Rejected' | 'Suspended' | 'Inactive';
  isApproved?: boolean;
  password?: string;
  isEmailVerified?: boolean;
  farmName?: string;
  farmDescription?: string;
  farmLogoUrl?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  googleMapsUrl?: string;
}

export interface Animal {
  id: string;
  tagNumber: string; // e.g. LV-SHP-101
  category: 'Sheep' | 'Natu Kolla';
  breed: string; // e.g. Local Jodipi, Deccani, Country Chicken
  gender: 'Male' | 'Female';
  ageMonths: number;
  weightKg: number;
  purchasePrice: number;
  sellingPrice: number;
  status: 'Healthy' | 'Under Treatment' | 'Sold' | 'Quarantine' | 'Breeding';
  vaccinationStatus: 'Up to Date' | 'Pending' | 'Due Soon';
  medicalHistory: string;
  breedingDetails?: string;
  photoUrl: string;
  qrCodeUrl?: string;
  addedDate: string;
}

export type ProductCategory = 'Sheep' | 'Goat' | 'Natu Kolla' | string;
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface PriceHistoryRecord {
  date: string;
  oldPricePerKg?: number;
  newPricePerKg?: number;
  oldTotalPrice?: number;
  newTotalPrice?: number;
  price?: number;
  updatedBy: string;
  timestamp: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  breed: string;
  age?: string;
  weightRange?: string;
  weightKg: number;
  pricePerKg: number;
  totalPrice: number;
  price: number; // Synced with totalPrice
  unit: string;
  stockQuantity: number;
  stockStatus: StockStatus;
  description: string;
  imageUrl: string; // Real image from Supabase Storage bucket only
  isActive: boolean;
  isAvailable?: boolean;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  priceHistory?: PriceHistoryRecord[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMode: 'Cash on Delivery (Pay at Farm / Handover)' | 'Cash on Delivery' | string;
  paymentStatus: 'Pending Payment' | 'Pending' | 'Paid' | 'Failed' | string;
  orderStatus: 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  type: 'Feed' | 'Medicine' | 'Sheep' | 'Goat' | 'Equipment' | 'Natu Kolla';
  supplierName: string;
  supplierContact: string;
  currentStock: number;
  minAlertStock: number;
  unit: string; // e.g., kg, liters, bags, packets, boxes
  costPerUnit: number; // Cost per Bag / Box / Unit
  numberOfBagsOrBoxes?: number; // Number of Bags / Boxes
  totalPurchaseAmount?: number; // Total Purchase Amount (₹) = numberOfBagsOrBoxes * costPerUnit
  lastRestocked: string;
}

export interface FinancialRecord {
  id: string;
  type: 'Income' | 'Expense';
  category: 'Animal Sale' | 'Product Sale' | 'Feed Purchase' | 'Medicine' | 'Worker Salary' | 'Utilities' | 'Equipment' | 'Other';
  title: string;
  amount: number;
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  workTask?: string;
  description: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  status: 'Present' | 'Half Day' | 'Absent' | 'Late' | 'Leave';
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: string;
  notes?: string;
}

export interface FeedHealthLog {
  id: string;
  animalTag: string;
  category?: 'Sheep' | 'Goat' | 'Natu Kolla' | 'General Flock';
  workerId: string;
  workerName: string;
  status: 'Healthy' | 'Under Treatment' | 'Quarantine' | 'Needs Attention';
  feedLog: string;
  date: string;
  createdAt?: string;
}

export interface LeaveRequest {
  id: string;
  workerId: string;
  workerName: string;
  reason: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  adminComment?: string;
  reviewedBy?: string;
  reviewedOn?: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  recipientRole: 'admin' | 'worker' | 'all';
  recipientUserId?: string;
  title: string;
  message: string;
  type: 'leave' | 'task' | 'general' | 'approval';
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'system';
  recipientId: string;
  recipientRole: 'customer' | 'admin';
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'pdf' | 'document';
  mediaName?: string;
  orderId?: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  editedAt?: string;
  isEdited?: boolean;
  deletedForEveryone?: boolean;
  encrypted?: boolean;
  isSystemMessage?: boolean;
}

export interface ChatConversation {
  id: string; // e.g. conv-usr-cust-1
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCountAdmin: number;
  unreadCountCustomer: number;
  isArchived?: boolean;
  isBlocked?: boolean;
  blockedAt?: string;
  orderId?: string;
  lastActive: string;
  customerOnline?: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  message: string;
  subject: string;
  date: string;
  customerId?: string;
  isRead?: boolean;
  status: 'New' | 'Unread' | 'Read' | 'Replied' | 'Closed';
}

export interface OwnerProfile {
  id: string;
  name: string;
  designation: string;
  phone: string;
  image_url: string;
  created_at?: string;
}

export interface GalleryImageItem {
  id: string;
  title: string;
  image_url: string;
  uploaded_at: string;
  created_at?: string;
  category?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  isMissing?: boolean;
  missingFileName?: string;
}

export interface FarmGalleryImage {
  id: string;
  image_url: string;
  image_title: string;
  image_description?: string;
  uploaded_at: string;
  display_order: number;
  is_active: boolean;
  category?: string;
}

export interface PaymentSettings {
  defaultPaymentMethod: string;
  isOnlinePaymentEnabled: boolean;
  noteText: string;
  upiId?: string;
  phonePeNumber?: string;
  googlePayNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  qrCodeUrl?: string;
  additionalInstructions?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}
