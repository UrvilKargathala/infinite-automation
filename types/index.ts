export type Role = "Super Admin" | "Admin" | "Staff";

export type CustomerSegment =
  | "Residential"
  | "Commercial"
  | "Short Term Rentals"
  | "Agriculture";

export type LeadStage = "New" | "Qualified" | "Quoted" | "Won" | "Lost";

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
  price: number | null;
  status: ProductStatus;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  stage: LeadStage;
  value: number;
  assigned: string;
  lastContact: string;
}

export interface QuoteItem {
  id: string;
  productId: number;
  name: string;
  brand: string;
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
