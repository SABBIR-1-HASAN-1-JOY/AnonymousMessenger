export interface User {
  id: string;
  displayName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
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
  overallRating?: number; // Optional since calculated from reviews
  overallrating?: number; // Database lowercase version
  reviewCount?: number; // Optional since calculated from reviews
  reviewcount?: number; // Database lowercase version
  followers?: string[]; // Optional
  createdAt: string;
}

export interface Review {
  id: string;
  entityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userProfilePicture?: string;
  title: string;
  body?: string; // Frontend field
  reviewText?: string; // API field
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
  user_id?: number; // Database field
  userName: string;
  userAvatar?: string;
  description: string;
  image?: string;
  ratings: { userId: string; rating: number }[];
  comments: Comment[];
  createdAt: string;
  averageRating?: number; // Calculated rating display
  ratingpoint?: number; // Backend database field
  totalRatings?: number; // Total number of ratings
  userRating?: number; // Current user's rating
}

export interface SimplePost {
  id: string;
  type: 'simple';
  userId: string;
  user_id?: number; // Database field
  userName: string;
  userAvatar?: string;
  content: string;
  image?: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  createdAt: string;
  averageRating?: number; // For posts that might have rating enabled
  ratingpoint?: number; // Backend database field
  totalRatings?: number; // Total number of ratings
  userRating?: number; // Current user's rating
}

export type Post = RateMyWorkPost | SimplePost;

export interface Comment {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'rating' | 'follow' | 'review';
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export const categories = [
  'Electronics',
  'Restaurants',
  'Travel',
  'Entertainment',
  'Healthcare',
  'Education',
  'Fashion',
  'Sports',
  'Books',
  'Movies',
  'Music',
  'Software',
  'Games',
  'Home & Garden',
  'Beauty',
  'Automotive',
  'Real Estate',
  'Financial Services',
  'Other'
];