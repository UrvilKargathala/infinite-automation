export type Role = "Super Admin" | "Admin" | "Purchase";

export type TicketStatus = "Open" | "In Progress" | "On Hold" | "Resolved" | "Closed";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketCategory = "Installation" | "Repair" | "Maintenance" | "General";

export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export type ProductStatus = "Active" | "Inactive";

export type UserStatus = "Active" | "Inactive";

import type { CurrencyCode } from "@/lib/utils/currency";

/** Master File kit: a named group of products with quantities. No stock of its own; priced from its components. */
export interface Kit {
  id: number;
  sku: string;
  name: string;
  description: string;
  status: ProductStatus;
  /** Kit price = sum of component prices (in the viewer's currency) minus this %. */
  discountPct: number;
  items: KitItem[];
  createdAt: string;
}

export interface KitItem {
  productId: number;
  qty: number;
}

export type KitInput = Omit<Kit, "id" | "createdAt">;

export interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  hsn: string;
  description: string;
  price: number | null;
  prices: Partial<Record<CurrencyCode, number>>;
  status: ProductStatus;
}

export interface Ticket {
  id: number;
  customerId: number | null;
  subject: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned: string;
  lastContact: string;
}

export type CustomerSegment =
  | "Residential" | "Hospitality" | "Government / Council"
  | "Retail" | "Healthcare / Aged Care" | "Industrial";

export interface Customer {
  id: number;
  /** Full display name (first name + surname) — what quotes, CRM and search show. Kept in sync by the API. */
  name: string;
  prefix: string;
  firstName: string;
  surname: string;
  /** Auto-generated on create (first two letters of name + surname), then fixed. */
  customerCode: string;
  segment: CustomerSegment;
  contactName: string;
  email: string;
  phone: string;
  architect: string;
  gstNo: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  /** "YYYY-MM-DD", or "--MM-DD" when the year is unknown; "" when not set. */
  birthday: string;
  notes: string;
  createdAt: string;
}

/** Fields a caller may send when creating/updating a customer. The code is assigned by the API; the
 *  detail fields are optional so quick-add flows (customer picker, Excel import) can send just a name. */
export type CustomerInput = Omit<Customer, "id" | "createdAt" | "customerCode" | "prefix" | "firstName" | "surname" | "architect" | "gstNo" | "city" | "state" | "postcode" | "birthday"> &
  Partial<Pick<Customer, "prefix" | "firstName" | "surname" | "architect" | "gstNo" | "city" | "state" | "postcode" | "birthday">>;

/** A kit's component as it stood when the kit was added to the quote (a snapshot — later kit edits don't change it). */
export interface QuoteKitComponent {
  productId: number;
  name: string;
  sku: string;
  qty: number;
}

export interface QuoteItem {
  id: string;
  /** Null on a kit line — its products are in `components`. */
  productId: number | null;
  /** Set on a kit line: one quote line priced as the kit, stock reserved through its components. */
  kitId?: number | null;
  kitSku?: string;
  components?: QuoteKitComponent[];
  name: string;
  category: string;
  brand: string;
  description: string;
  qty: number;
  price: number;
  discount: number;
}

export interface Section {
  id: string;
  name: string;
  items: QuoteItem[];
}

export interface Quote {
  id: number;
  number: string;
  clientId: number | null;
  customerId: number | null;
  client: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  currency: CurrencyCode;
  sections: Section[];
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  ticketAlerts: boolean;
  quoteAlerts: boolean;
  /** Working currency from Settings — new quotes/POs, product prices and dashboard money use it. */
  currency: CurrencyCode;
}

export interface AppNotification {
  id: number;
  text: string;
  color: string;
  read: boolean;
  createdAt: string;
  /** Where clicking the notification goes (e.g. "/complaints?open=12"); "" for none. */
  href: string;
}

export type ComplaintStatus = "Pending" | "Completed";

/** CRM complaint: raised by Super Admin/Admin, assigned to one engineer, Pending → Completed. */
export interface Complaint {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  remarks: string;
  engineerId: number | null;
  engineerName: string | null;
  status: ComplaintStatus;
  /** What the engineer did — required when marking Completed. */
  resolution: string;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ComplaintEvent {
  id: number;
  kind: "created" | "assigned" | "edited" | "completed" | "reopened";
  note: string;
  userName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  createdAt: string;
  userId: number;
  fullName: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  fullName: string;
  text: string;
  attachments: Attachment[];
  createdAt: string;
  replyToId: number | null;
  replyToText: string | null;
  replyToFullName: string | null;
  isForwarded: boolean;
  deleted: boolean;
  edited: boolean;
}

/** A CRM pipeline column. The six defaults are fixed; users can add, rename and delete custom stages. */
export interface PipelineStage {
  id: number;
  name: string;
  position: number;
  isDefault: boolean;
  color: string;
}

/** A PipelineStage name, or "Cancelled" (a status outside the pipeline). Names are data, so this is a string. */
export type ProjectStage = string;

export interface Project {
  id: number;
  customerId: number | null;
  customerName: string;
  siteAddress: string;
  assigned: string;
  architect: string;
  quoteId: number | null;
  notes: string;
  stage: ProjectStage;
  createdAt: string;
  lastStageChange: string;
  /** Set once the deal is confirmed and its quote's items are reserved from stock. */
  confirmedAt: string | null;
}

export interface ProjectStageEvent {
  id: number;
  projectId: number;
  stage: ProjectStage;
  changedAt: string;
}

export interface ProjectMessage {
  id: number;
  projectId: number;
  userId: number;
  fullName: string;
  text: string;
  attachments: Attachment[];
  createdAt: string;
  replyToId: number | null;
  replyToText: string | null;
  replyToFullName: string | null;
  isForwarded: boolean;
  deleted: boolean;
  edited: boolean;
  /** Starred in the CRM chat (shared); the chat's star button filters to these. */
  starred: boolean;
}

export type AuditModule = "Master" | "CRM" | "Quote" | "Projects" | "User Management" | "Auth" | "Inventory";

export type AuditAction =
  | "create" | "update" | "delete" | "import" | "export"
  | "status_change" | "stage_change" | "login" | "logout" | "role_change";

export interface AuditChanges {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  userId: number | null;
  userName: string;
  userRole: Role;
  module: AuditModule;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  summary: string;
  changes: AuditChanges | null;
  metadata: Record<string, unknown> | null;
}

// ── Inventory & Procurement ────────────────────────────────────────────────

export type AllocationStatus = "Reserved" | "Shipped" | "Released";

/** Stock reserved for a confirmed project. Outstanding units = qty - shippedQty while Reserved. */
export interface InventoryAllocation {
  id: number;
  projectId: number;
  productId: number;
  qty: number;
  shippedQty: number;
  status: AllocationStatus;
  createdAt: string;
}

export type VendorPOStatus = "Draft" | "Issued" | "Partially Received" | "Received" | "Cancelled";

export interface VendorPOItem {
  id: number;
  productId: number;
  qtyOrdered: number;
  qtyReceived: number;
  unitCost: number | null;
}

export interface VendorPO {
  id: number;
  number: string;
  brand: string;
  vendorName: string;
  status: VendorPOStatus;
  currency: CurrencyCode;
  notes: string;
  createdBy: number | null;
  createdAt: string;
  issuedAt: string | null;
  items: VendorPOItem[];
}

/** Per-product stock inputs from GET /api/inventory/stock — feed to stockStatus() in lib/utils/inventory. */
export interface StockRow {
  productId: number;
  physical: number;
  minBuffer: number;
  allocated: number; // outstanding reserved units on confirmed projects
  quoted: number;    // units on Draft/Sent quotes
  incoming: number;  // units still to arrive on Issued / Partially Received POs
}

export type StockMovementReason = "GRN" | "SHIP" | "ADJUST";

export interface StockMovement {
  id: number;
  productId: number;
  delta: number;
  reason: StockMovementReason;
  note: string;
  projectId: number | null;
  poId: number | null;
  userId: number | null;
  createdAt: string;
}
