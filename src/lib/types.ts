export interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  visibility: 'all' | 'targeted';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTarget {
  id: string;
  document_id: string;
  target_email: string;
  created_at: string;
}

export interface Acknowledgment {
  id: string;
  document_id: string;
  user_id: string;
  user_email: string;
  acknowledged_at: string;
}

export interface DocumentWithAcknowledgment extends Document {
  acknowledged?: boolean;
  acknowledgment_count?: number;
}

export interface User {
  id: string;
  email: string;
}

export const ADMIN_EMAIL = 'hr@fleapo.com'; // Deprecated: For seeding
export const ALLOWED_DOMAIN = '@fleapo.com';

export function isAdmin(email: string | undefined, role?: string): boolean {
  // Only check role - email check is removed for access control
  return role === 'admin';
}

export function isAllowedDomain(email: string): boolean {
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}
