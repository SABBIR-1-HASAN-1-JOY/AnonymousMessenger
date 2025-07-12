export interface User {
  id: string;
  displayName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
}

export interface Entity {
  id: string;
  item_id?: string; // Database uses item_id instead of id
  item_name: string; // Database uses item_name instead of name
  name?: string; // Keep for backward compatibility
  description: string;
  category: string;
  sector?: string;
  picture?: string;
  images?: string[];
  overallRating: number;
  reviewCount: number;
  followers: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  entityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  body: string;
  rating: number;
  pictures?: string[];
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

export interface RateMyWorkPost {
  id: string;
  type: 'rate-my-work';
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  images: string[];
  createdAt: string;
  likes: number;
  comments: Comment[];
  location?: string;
  tags?: string[];
}

export interface ComparePost {
  id: string;
  type: 'comparison';
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  entityA: Entity;
  entityB: Entity;
  criteria: string[];
  results?: {
    entityAScore: number;
    entityBScore: number;
    comments: Comment[];
  };
  createdAt: string;
  likes: number;
  comments: Comment[];
}

export type Post = RateMyWorkPost | ComparePost;

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  entityCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'review' | 'mention';
  title: string;
  message: string;
  relatedId?: string; // ID of the related entity (post, review, etc.)
  relatedType?: 'post' | 'review' | 'entity' | 'user';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface SearchResult {
  id: string;
  type: 'entity' | 'user' | 'post';
  title: string;
  description: string;
  image?: string;
  category?: string;
  rating?: number;
  createdAt: string;
}
