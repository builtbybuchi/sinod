export enum View {
  DASHBOARD = 'dashboard',
  EVENT = 'event',
  SIGN_UP = 'signup',
  SIGN_IN = 'signin',
  SIGN_UP_SUCCESS = 'signup_success',
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  attendees: number;
  isPast: boolean;
  recordingUrl?: string;
  summary?: string;
}

export interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHost: boolean;
}

export enum EventType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical',
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  visibility: EventVisibility;
  address?: string; // For physical events
  virtualLink?: string; // For virtual events
  startDate: Date;
  endDate: Date;
  createdBy: string; // User ID
  attendees: Attendee[];
  maxAttendees?: number;
  tags?: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  eventPageUrl?: string; // Short event ID for public URLs
  paid?: boolean; // Whether this is a paid event
  eventPrice?: number; // Price for paid events
}

export interface Attendee {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'attended';
  qrCode?: string;
  registrationDate: Date;
  approvalDate?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  uniqueId: string;
  qrCode?: string;
  avatar?: string;
}

export interface EventAnalytics {
  eventId: string;
  totalRegistrations: number;
  approvedAttendees: number;
  rejectedAttendees: number;
  attendedCount: number;
  registrationTrend: { date: string; count: number }[];
  attendanceByTime: { time: string; count: number }[];
}

export interface City {
  name: string;
  slug: string;
  country: string;
  description?: string;
  imageUrl?: string;
}

export const TOP_CITIES: City[] = [
  // Zimbabwe (Primary Focus - First Two)
  { name: 'Harare', slug: 'harare', country: 'Zimbabwe' },
  { name: 'Bulawayo', slug: 'bulawayo', country: 'Zimbabwe' },
  
  // Nigeria (Primary Focus)
  { name: 'Lagos', slug: 'lagos', country: 'Nigeria' },
  { name: 'Abuja', slug: 'abuja', country: 'Nigeria' },
  
  // Top African Cities
  { name: 'Cape Town', slug: 'cape-town', country: 'South Africa' },
  { name: 'Johannesburg', slug: 'johannesburg', country: 'South Africa' },
  { name: 'Nairobi', slug: 'nairobi', country: 'Kenya' },
  { name: 'Cairo', slug: 'cairo', country: 'Egypt' },
  { name: 'Accra', slug: 'accra', country: 'Ghana' },
  { name: 'Kigali', slug: 'kigali', country: 'Rwanda' },
  { name: 'Dar es Salaam', slug: 'dar-es-salaam', country: 'Tanzania' },
  { name: 'Addis Ababa', slug: 'addis-ababa', country: 'Ethiopia' },
  
  // Global Cities
  { name: 'London', slug: 'london', country: 'UK' },
  { name: 'New York', slug: 'new-york', country: 'USA' },
  { name: 'Dubai', slug: 'dubai', country: 'UAE' },
  { name: 'Singapore', slug: 'singapore', country: 'Singapore' },
  { name: 'Paris', slug: 'paris', country: 'France' },
  { name: 'Tokyo', slug: 'tokyo', country: 'Japan' },
];
