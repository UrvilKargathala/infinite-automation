export type Role = "Super Admin" | "Admin" | "Staff";

export type TicketStatus = "Open" | "In Progress" | "On Hold" | "Resolved" | "Closed";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketCategory = "Installation" | "Repair" | "Maintenance" | "General";

export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export type ProductStatus = "Active" | "Inactive";

export type UserStatus = "Active" | "Inactive";

export interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  hsn: string;
  description: string;
  price: number | null;
  status: ProductStatus;
}

export interface Ticket {
  id: number;
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

export interface QuoteItem {
  id: string;
  productId: number;
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
  client: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  sections: Section[];
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
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
}

export type ProjectStage =
  | "Inquiry" | "Design" | "Quotation" | "Measurement" | "Marking"
  | "Production" | "Material Requirement" | "Ready to Dispatch"
  | "Installation" | "Completed" | "Cancelled";

export interface Project {
  id: number;
  customerName: string;
  siteAddress: string;
  assigned: string;
  architect: string;
  quoteId: number | null;
  notes: string;
  stage: ProjectStage;
  createdAt: string;
  lastStageChange: string;
}

export interface ProjectStageEvent {
  id: number;
  projectId: number;
  stage: ProjectStage;
  changedAt: string;
}
