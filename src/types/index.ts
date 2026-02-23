// ==================== ENUMS ====================

export type UserRole = 'admin' | 'member';
export type TeamPlan = 'solo' | 'team' | 'business';
export type CustomerStatus = 'active' | 'pending_delivery' | 'overdue_payment' | 'inactive';
export type BoardStatus = 'new' | 'contacted' | 'interested' | 'won' | 'lost';
export type DealStatus = 'proposal' | 'in_progress' | 'completed' | 'cancelled';
export type DealPaymentStatus = 'unpaid' | 'partial' | 'paid';
export type TaskCategory = 'sales' | 'delivery' | 'finance' | 'meeting' | 'other';
export type ActivityType = 'call' | 'line' | 'email' | 'meeting' | 'note' | 'status_change' | 'payment' | 'task_completed';
export type DocumentType = 'quotation' | 'invoice';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'overdue';
export type PaymentMethod = 'transfer' | 'promptpay' | 'cash' | 'other';
export type CustomerSource = 'lead_search' | 'manual' | 'referral';
export type DiscountType = 'percentage' | 'fixed';

// ==================== ENTITIES ====================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  team_id: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  plan: TeamPlan;
  created_at: string;
}

export interface Customer {
  id: string;
  team_id: string;
  business_name: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  line_id: string;
  website_url: string;
  facebook_url: string;
  google_maps_url: string;
  google_rating: number;
  google_review_count: number;
  contact_person_name: string;
  contact_person_position: string;
  contact_person_phone: string;
  contact_person_email: string;
  secondary_contact_name: string;
  secondary_contact_phone: string;
  important_notes: string;
  status: CustomerStatus;
  is_pinned: boolean;
  assigned_to: string;
  source: CustomerSource;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  team_id: string;
  search_id: string | null;
  business_name: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  line_id: string;
  website_url: string;
  facebook_url: string;
  google_maps_url: string;
  google_rating: number;
  google_review_count: number;
  fb_followers: number;
  has_website: boolean;
  fb_active: boolean;
  ai_score: number;
  ai_score_fit: number;
  ai_score_need: number;
  ai_score_potential: number;
  ai_tags: string[];
  board_status: BoardStatus;
  assigned_to: string;
  converted_customer_id: string | null;
  next_followup_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadSearch {
  id: string;
  team_id: string;
  created_by: string;
  name: string;
  filters: Record<string, unknown>;
  result_count: number;
  created_at: string;
}

export interface Deal {
  id: string;
  customer_id: string;
  team_id: string;
  name: string;
  value: number;
  status: DealStatus;
  payment_status: DealPaymentStatus;
  assigned_to: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  team_id: string;
  customer_id: string | null;
  deal_id: string | null;
  title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  category: TaskCategory;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface Activity {
  id: string;
  customer_id: string;
  lead_id: string | null;
  team_id: string;
  type: ActivityType;
  content: string;
  followup_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Document {
  id: string;
  team_id: string;
  customer_id: string;
  deal_id: string | null;
  type: DocumentType;
  document_number: string;
  items: DocumentItem[];
  subtotal: number;
  discount_type: DiscountType;
  discount_value: number;
  total: number;
  terms: string;
  valid_until: string | null;
  due_date: string | null;
  payment_method: string | null;
  status: DocumentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  team_id: string;
  document_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface Service {
  id: string;
  team_id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface PersonGoal {
  user_id: string;
  revenue_target: number;
  deals_target: number;
  contacts_target: number;
}

export interface Goal {
  id: string;
  team_id: string;
  month: string; // YYYY-MM
  revenue_target: number;
  deals_target: number;
  leads_target: number;
  contacts_target: number;
  collection_target: number;
  person_goals: PersonGoal[];
  created_at: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'task' | 'payment' | 'lead' | 'general';
  link: string;
  is_read: boolean;
  created_at: string;
}

// ==================== NAV ====================

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavSection {
  title: string;
  isMarketplace?: boolean;
  items: NavItem[];
}

// ==================== MARKETPLACE ====================

export interface Product {
  id: string;
  name: string;
  description: string;
  startingPrice: number;
  moq: number;
  leadTime: string;
  tags: string[];
  images: string[];
}

export interface BuyingNeed {
  id: string;
  name: string;
  category: string;
  description: string;
  frequency: 'regular' | 'occasional' | 'onetime';
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: 'manufacturer' | 'service' | 'agent' | 'wholesale' | 'retail';
  categories: string[];
  subCategories: string[];
  province: string;
  district: string;
  description: string;
  products: Product[];
  buyingNeeds: BuyingNeed[];
  trustLevel: 1 | 2 | 3 | 4;
  rating: number;
  reviewCount: number;
  dealsCompleted: number;
  responseRate: number;
  avgResponseTime: string;
  portfolioImages: string[];
  contactPhone: string;
  contactEmail: string;
  lineId: string;
  website: string;
  verified: boolean;
  memberSince: string;
  matchPowerScore: number;
}

export interface RFQ {
  id: string;
  buyerId: string;
  buyerName: string;
  title: string;
  category: string;
  type: 'product' | 'service' | 'both';
  quantity: number;
  unit: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  requirements: string;
  supplierQualifications: {
    minTrustLevel: number;
    mustHavePortfolio: boolean;
    minDealsCompleted: number;
    sameProvince: boolean;
  };
  area: string;
  attachments: string[];
  visibility: 'everyone' | 'verified_only';
  status: 'open' | 'in_progress' | 'closed' | 'cancelled';
  proposalCount: number;
  matchedSellers: number;
  createdAt: string;
  expiresAt: string;
}

export interface Proposal {
  id: string;
  rfqId: string;
  sellerId: string;
  sellerName: string;
  sellerTrustLevel: number;
  sellerRating: number;
  price: number;
  unit: string;
  leadTime: string;
  description: string;
  attachments: string[];
  status: 'sent' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected';
  matchScore: number;
  createdAt: string;
}

export interface Review {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MarketplaceDeal {
  id: string;
  rfqId: string;
  proposalId: string;
  buyerId: string;
  sellerId: string;
  title: string;
  value: number;
  status: 'negotiating' | 'agreed' | 'completed' | 'cancelled';
  buyerReview?: Review;
  sellerReview?: Review;
  completedAt?: string;
}
