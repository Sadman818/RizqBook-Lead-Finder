export enum BusinessCategory {
  SALON = "Salon",
  BEAUTY_PARLOUR = "Beauty Parlour",
  BARBER_SHOP = "Barber Shop",
  CLINIC = "Clinic",
  DENTAL_CLINIC = "Dental Clinic",
  DIAGNOSTIC_CENTER = "Diagnostic Center",
  PHYSIOTHERAPY_CENTER = "Physiotherapy Center",
  TURF_SPORTS_GROUND = "Turf / Sports Ground",
  COACHING_CENTER = "Coaching Center",
  GYM = "Fitness Center / Gym"
}

export enum LeadStatus {
  NEW = "New",
  CONTACTED = "Contacted",
  INTERESTED = "Interested",
  CLOSED = "Closed",
  LOST = "Lost"
}

export enum LeadPriorityTag {
  HOT = "HOT",
  WARM = "WARM",
  COLD = "COLD"
}

export interface OutreachScripts {
  whatsappBangla: string;
  whatsappEnglish: string;
  coldCallScript: string;
  followUpMessage: string;
  objectionHandling: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Lead {
  id: string;
  businessName: string;
  category: string;
  fullAddress: string;
  city: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  whatsappNumber?: string;
  whatsappDetected: boolean;
  googleMapsRating: number;
  totalReviews: number;
  websiteUrl?: string;
  facebookPage?: string;
  instagramHandle?: string;
  linkedinHandle?: string;
  businessHours: string;
  isClaimed: boolean;
  
  // Owner Details
  ownerName?: string;
  ownerPhone?: string;
  ownerLinkedIn?: string;
  ownerFacebook?: string;

  // Detection & Analysis
  hasOnlineBooking: boolean;
  bookingMethod: string;
  bookingSystemName: string; 
  isManualBooking: boolean;
  
  // Pain & Scoring
  bookingPainScore: number; 
  leadScore: number; 
  priorityTag: LeadPriorityTag;
  scoreBreakdown: {
    noBookingSystem: number;
    highReviewManual: number;
    whatsappDependency: number;
    marketMaturity: number;
  };
  missedBookingRisk: string;
  businessMaturity: string; 
  
  // Sales Insights
  whyNeedsRizqBook: string;
  topPainPoints: string[];
  estMonthlyVolume: string;
  suggestedPlan: "Basic" | "Pro" | "Premium";
  
  // Outreach
  outreachScripts: OutreachScripts;
  
  // Management
  status: LeadStatus;
  notes: string;
  savedAt?: number;
}

export interface LeadAnalysis {
  totalLeads: number;
  hotLeadsCount: number;
  marketInsights: string;
  averagePainScore: number;
  suggestedOutreachStrategy: string;
  categoryDistribution: Record<string, number>;
}

export interface LeadSearchResult {
  leads: Lead[];
  analysis: LeadAnalysis;
  sources: GroundingSource[];
}