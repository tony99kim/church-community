export interface Post {
  id: number;
  title: string;
  content?: string;
  authorId?: number;
  authorNickname: string;
  categoryId?: number;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked?: boolean;
  notice?: boolean;
  thumbnailUrl?: string | null;
  createdAt: string;
}

export interface Comment {
  id: number;
  content: string;
  authorNickname: string | null;
  authorId: number | null;
  parentId: number | null;
  deleted: boolean;
  replies?: Comment[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  type: string;
  visible?: boolean;
  sortOrder?: number;
  parentId?: number | null;
  children?: Category[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  currentParticipants: number;
  thumbnailUrl: string | null;
  status: 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'ENDED' | 'CANCELLED';
  authorNickname: string;
  joined?: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'COMMENT' | 'LIKE' | 'EVENT' | 'NOTICE';
  content: string;
  senderNickname: string | null;
  relatedId: number;
  relatedType: 'POST' | 'COMMENT' | 'EVENT';
  read: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// Church
export interface Church {
  id: number;
  name: string;
  address: string;
  sundayServiceTime: string | null;
  hasYouthGroup: boolean;
  contactInfo: string | null;
  introduction: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  visible: boolean;
  createdAt: string;
}

// Space Rental
export type RentalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Space {
  id: number;
  churchId: number | null;
  churchName: string | null;
  name: string;
  description: string | null;
  usageTypes: string | null;
  capacity: number | null;
  available: boolean;
  openTime?: string;    // "HH:mm:ss"
  closeTime?: string;   // "HH:mm:ss"
  slotMinutes?: number;
}

export interface SlotInfo {
  startTime: string;  // "HH:mm:ss"
  endTime: string;    // "HH:mm:ss"
  status: 'AVAILABLE' | 'TAKEN' | 'MY_PENDING' | 'MY_APPROVED';
  rentalId?: number | null;
}

export interface SpaceRental {
  id: number;
  spaceId: number;
  spaceName: string;
  applicantNickname: string;
  startDateTime: string;
  endDateTime: string;
  headcount: number | null;
  purpose: string;
  contactPhone: string;
  status: RentalStatus;
  rejectReason: string | null;
  createdAt: string;
}

// Item Rental
export type ItemCategory = 'MOVING' | 'CLEANING' | 'LIVING' | 'EVENT';

export interface Item {
  id: number;
  churchId: number | null;
  churchName: string | null;
  name: string;
  description: string | null;
  category: ItemCategory;
  totalQuantity: number;
  availableQuantity: number;
}

export interface ItemRental {
  id: number;
  itemId: number;
  itemName: string;
  itemCategory: ItemCategory;
  applicantNickname: string;
  quantity: number;
  startDate: string;
  endDate: string;
  contactPhone: string;
  purpose: string | null;
  status: RentalStatus;
  rejectReason: string | null;
  createdAt: string;
}

// Faith
export interface FaithAnswer {
  id: number;
  pastorNickname: string;
  content: string;
  createdAt: string;
}

export interface FaithQuestion {
  id: number;
  authorNickname: string | null;
  anonymous: boolean;
  content: string;
  publicVisible: boolean;
  answers: FaithAnswer[];
  createdAt: string;
}

export interface PrayerRequest {
  id: number;
  authorNickname: string;
  content: string;
  publicVisible: boolean;
  prayerCount: number;
  createdAt: string;
}

// Event category
export type EventCategory = 'NEIGHBORHOOD' | 'FAITH' | 'SERVICE' | 'CHURCH' | 'WELCOME_TABLE';

// WelcomeKit
export interface WelcomeKit {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  message: string | null;
  processed: boolean;
  createdAt: string;
}
