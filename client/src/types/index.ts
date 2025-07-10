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
  name: string;
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
  image?: string;
  ratings: { userId: string; rating: number }[];
  comments: Comment[];
  createdAt: string;
}

export interface SimplePost {
  id: string;
  type: 'simple';
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  image?: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  createdAt: string;
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