// ─── Domain types ────────────────────────────────────────────────────────────

export type Role = 'family' | 'assessor' | 'contractor' | 'admin';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  license_number: string | null;
  specialization: string | null;
  business_name: string | null;
  service_area: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  floors: number;
  rooms: number;
  safety_score: number | null;
  created_at: string;
}

export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AuditPackage = 'Basic' | 'Standard' | 'Premium';

export interface Audit {
  id: string;
  property_id: string;
  family_id: string;
  assessor_id: string | null;
  package: AuditPackage;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: AuditStatus;
  safety_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  property?: Property;
  family_profile?: Profile;
  assessor_profile?: Profile;
}

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditFinding {
  id: string;
  audit_id: string;
  room: string;
  finding: string;
  severity: FindingSeverity;
  resolved: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  audit_id: string;
  family_id: string;
  safety_score: number;
  summary: string | null;
  recommendations: Recommendation[];
  pdf_url: string | null;
  created_at: string;
  audit?: Audit;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_cost?: string;
}

export interface ContractorProfile {
  id: string;
  business_name: string | null;
  license_number: string | null;
  service_area: string | null;
  specialties: string[] | null;
  rating: number;
  jobs_completed: number;
  verified: boolean;
  created_at: string;
  // joined
  profile?: Profile;
}

export type LeadStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type Urgency = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  audit_id: string;
  family_id: string;
  contractor_id: string | null;
  hazard: string;
  urgency: Urgency;
  estimated_value: number | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  family_profile?: Profile;
  audit?: Audit;
}

export type JobStage = 'Quoted' | 'Scheduled' | 'In Progress' | 'Completed';

export interface Job {
  id: string;
  lead_id: string;
  contractor_id: string;
  family_id: string;
  title: string;
  address: string | null;
  stage: JobStage;
  progress: number;
  amount: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  family_profile?: Profile;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  audit_id: string;
  family_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  created_at: string;
}
