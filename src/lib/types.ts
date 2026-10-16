export interface Year {
  id: string;
  year: number;
  title: string;
  status: 'upcoming' | 'active' | 'archived';
  starts_on: string | null;
  ends_on: string | null;
}

export interface Mandapa {
  id: string;
  year_id: string;
  name: string;
  address: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  contact: string | null;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
}

export interface Schedule {
  id: string;
  mandapa_id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  details: string | null;
}

export interface Notice {
  id: string;
  title: string;
  body: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string | null;
  submitter_name: string | null;
  submitter_phone: string | null;
  kind: 'new_mandapa' | 'correction' | 'schedule';
  payload: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface MandapaComment {
  id: string;
  mandapa_id: string | null;
  parent_id: string | null;
  author_name: string;
  body: string;
  is_anonymous: boolean;
  by_admin: boolean;
  like_count: number;
  image_path?: string | null;
  created_at: string;
}

export const YEAR_STATUS: Record<string, string> = {
  upcoming: 'আসন্ন',
  active: 'সক্রিয়',
  archived: 'আর্কাইভ',
};
export const MANDAPA_STATUS: Record<string, string> = {
  draft: 'খসড়া',
  published: 'প্রকাশিত',
  archived: 'আর্কাইভ',
};
export const SUBMISSION_STATUS: Record<string, string> = {
  pending: 'অনুমোদনের অপেক্ষায়',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
};
export const KIND_LABEL: Record<string, string> = {
  new_mandapa: 'নতুন মণ্ডপ',
  correction: 'ভুল তথ্যের সংশোধন',
  schedule: 'সময়সূচি',
};
