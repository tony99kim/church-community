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
  status: 'UPCOMING' | 'ONGOING' | 'ENDED' | 'CANCELLED';
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
