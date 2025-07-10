import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entity, Review, Post, Notification } from '../types';

interface AppContextType {
  entities: Entity[];
  reviews: Review[];
  posts: Post[];
  notifications: Notification[];
  addEntity: (entity: Omit<Entity, 'id' | 'createdAt'>) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
  followEntity: (entityId: string, userId: string) => void;
  unfollowEntity: (entityId: string, userId: string) => void;
  isFollowingEntity: (entityId: string, userId: string) => boolean;
  searchEntities: (query: string) => Entity[];
  getEntitiesByCategory: (category: string) => Entity[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  ratePost: (postId: string, userId: string, rating: number) => void;
  votePost: (postId: string, userId: string, voteType: 'up' | 'down') => void;
  addComment: (postId: string, comment: { userId?: string; userName?: string; content: string; isAnonymous: boolean }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if( context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchDataFromServer = async () => {
      try {
        const entitiesResponse = await fetch('http://localhost:3000/api/entities');
        const reviewsResponse = await fetch('http://localhost:3000/api/reviews');
        const postsResponse = await fetch('http://localhost:3000/api/posts');
        const notificationsResponse = await fetch('http://localhost:3000/api/notifications');

        if (entitiesResponse.ok) {
          const entitiesData = await entitiesResponse.json();
          setEntities(entitiesData);
        }

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }

        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error('Error fetching data from server:', error);
      }
    };

    fetchDataFromServer();
  }, []);

  const addEntity = (entityData: Omit<Entity, 'id' | 'createdAt'>) => {
    const newEntity: Entity = {
      ...entityData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedEntities = [...entities, newEntity];
    setEntities(updatedEntities);
    localStorage.setItem('jachai_entities', JSON.stringify(updatedEntities));
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    localStorage.setItem('jachai_reviews', JSON.stringify(updatedReviews));

    // Update entity's overall rating
    const entityReviews = updatedReviews.filter(r => r.entityId === reviewData.entityId);
    const avgRating = entityReviews.reduce((sum, r) => sum + r.rating, 0) / entityReviews.length;
    
    const updatedEntities = entities.map(entity =>
      entity.id === reviewData.entityId
        ? { ...entity, overallRating: avgRating, reviewCount: entityReviews.length }
        : entity
    );
    setEntities(updatedEntities);
    localStorage.setItem('jachai_entities', JSON.stringify(updatedEntities));

    // Create notification for entity followers
    const entity = entities.find(e => e.id === reviewData.entityId);
    if (entity) {
      entity.followers.forEach(followerId => {
        if (followerId !== reviewData.userId) {
          addNotification({
            userId: followerId,
            type: 'review',
            message: `New review added to ${entity.name} that you follow`,
            read: false,
            relatedId: reviewData.entityId
          });
        }
      });
    }
  };

  const addPost = (postData: Omit<Post, 'id' | 'createdAt'>) => {
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    } as Post;
    
    const updatedPosts = [...posts, newPost];
    setPosts(updatedPosts);
    localStorage.setItem('jachai_posts', JSON.stringify(updatedPosts));
  };

  const ratePost = (postId: string, userId: string, rating: number) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId && post.type === 'rate-my-work') {
        const existingRatingIndex = post.ratings.findIndex(r => r.userId === userId);
        let newRatings;
        
        if (existingRatingIndex >= 0) {
          newRatings = [...post.ratings];
          newRatings[existingRatingIndex] = { userId, rating };
        } else {
          newRatings = [...post.ratings, { userId, rating }];
        }
        
        // Create notification for post owner
        if (post.userId !== userId) {
          addNotification({
            userId: post.userId,
            type: 'rating',
            message: `Someone rated your "${post.title}" post ${rating} stars!`,
            read: false,
            relatedId: postId
          });
        }
        
        return { ...post, ratings: newRatings };
      }
      return post;
    });
    
    setPosts(updatedPosts);
    localStorage.setItem('jachai_posts', JSON.stringify(updatedPosts));
  };

  const votePost = (postId: string, userId: string, voteType: 'up' | 'down') => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId && post.type === 'simple') {
        if (voteType === 'up') {
          return { ...post, upvotes: post.upvotes + 1 };
        } else {
          return { ...post, downvotes: post.downvotes + 1 };
        }
      }
      return post;
    });
    
    setPosts(updatedPosts);
    localStorage.setItem('jachai_posts', JSON.stringify(updatedPosts));
  };

  const addComment = (postId: string, comment: { userId?: string; userName?: string; content: string; isAnonymous: boolean }) => {
    const newComment = {
      id: Date.now().toString(),
      ...comment,
      createdAt: new Date().toISOString()
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedPost = { ...post, comments: [...post.comments, newComment] };
        
        // Create notification for post owner
        if (post.userId !== comment.userId && !comment.isAnonymous) {
          addNotification({
            userId: post.userId,
            type: 'comment',
            message: `${comment.userName || 'Someone'} commented on your post`,
            read: false,
            relatedId: postId
          });
        }
        
        return updatedPost;
      }
      return post;
    });
    
    setPosts(updatedPosts);
    localStorage.setItem('jachai_posts', JSON.stringify(updatedPosts));
  };

  const followEntity = (entityId: string, userId: string) => {
    const updatedEntities = entities.map(entity =>
      entity.id === entityId
        ? { ...entity, followers: [...entity.followers, userId] }
        : entity
    );
    setEntities(updatedEntities);
    localStorage.setItem('jachai_entities', JSON.stringify(updatedEntities));
  };

  const unfollowEntity = (entityId: string, userId: string) => {
    const updatedEntities = entities.map(entity =>
      entity.id === entityId
        ? { ...entity, followers: entity.followers.filter(id => id !== userId) }
        : entity
    );
    setEntities(updatedEntities);
    localStorage.setItem('jachai_entities', JSON.stringify(updatedEntities));
  };

  const isFollowingEntity = (entityId: string, userId: string): boolean => {
    const entity = entities.find(e => e.id === entityId);
    return entity?.followers.includes(userId) || false;
  };

  const searchEntities = (query: string): Entity[] => {
    return entities.filter(entity =>
      entity.name.toLowerCase().includes(query.toLowerCase()) ||
      entity.description.toLowerCase().includes(query.toLowerCase()) ||
      entity.category.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getEntitiesByCategory = (category: string): Entity[] => {
    return entities.filter(entity => entity.category === category);
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedNotifications = [...notifications, newNotification];
    setNotifications(updatedNotifications);
    localStorage.setItem('jachai_notifications', JSON.stringify(updatedNotifications));
  };

  const markNotificationAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('jachai_notifications', JSON.stringify(updatedNotifications));
  };

  return (
    <AppContext.Provider value={{
      entities,
      reviews,
      posts,
      notifications,
      addEntity,
      addReview,
      addPost,
      followEntity,
      unfollowEntity,
      isFollowingEntity,
      searchEntities,
      getEntitiesByCategory,
      addNotification,
      markNotificationAsRead,
      ratePost,
      votePost,
      addComment
    }}>
      {children}
    </AppContext.Provider>
  );
};