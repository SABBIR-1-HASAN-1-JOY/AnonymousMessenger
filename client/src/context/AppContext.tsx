import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entity, Review, Post, Notification, SimplePost, RateMyWorkPost } from '../types';

interface AppContextType {
  entities: Entity[];
  reviews: Review[];
  posts: Post[];
  notifications: Notification[];
  categories: string[];
  addEntity: (entity: Omit<Entity, 'id' | 'createdAt'>) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>;
  followEntity: (entityId: string, userId: string) => void;
  unfollowEntity: (entityId: string, userId: string) => void;
  searchEntities: (query: string) => Entity[];
  getEntitiesByCategory: (category: string) => Entity[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  ratePost: (postId: string, userId: string, rating: number) => void;
  votePost: (postId: string, voteType: 'up' | 'down') => Promise<void>;
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
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchDataFromServer = async () => {
      try {
        const entitiesResponse = await fetch('http://localhost:3000/api/entities');
        const postsResponse = await fetch('http://localhost:3000/api/posts');
        const reviewsResponse = await fetch('http://localhost:3000/api/reviews');
        const categoriesResponse = await fetch('http://localhost:3000/api/categories');

        if (entitiesResponse.ok) {
          const entitiesData = await entitiesResponse.json();
          setEntities(entitiesData);
        }

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          // Extract just the category names from the response
          const categoryNames = categoriesData.map((cat: any) => cat.category_name);
          setCategories(categoryNames);
        }

        // TODO: Implement notifications endpoint when ready
        // const notificationsResponse = await fetch('http://localhost:3000/api/notifications');
        // if (notificationsResponse.ok) {
        //   const notificationsData = await notificationsResponse.json();
        //   setNotifications(notificationsData);
        // }
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

  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding review to backend:', reviewData);
      
      const requestBody = {
        userId: reviewData.userId,
        itemId: reviewData.entityId, // Map entityId to itemId for backend
        rating: reviewData.rating,
        reviewText: reviewData.body, // Map body to reviewText for backend
        title: reviewData.title,
        upvotes: reviewData.upvotes || 0,
        pictures: reviewData.pictures || []
      };
      
      const response = await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newReview = await response.json();
      console.log('Review created successfully:', newReview);
      
      // Update local state with the new review
      const updatedReviews = [...reviews, newReview];
      setReviews(updatedReviews);
      
      // Update entity's overall rating
      const entityReviews = updatedReviews.filter(r => r.entityId === reviewData.entityId);
      const avgRating = entityReviews.reduce((sum, r) => sum + r.rating, 0) / entityReviews.length;
      
      const updatedEntities = entities.map(entity =>
        entity.id === reviewData.entityId
          ? { ...entity, overallRating: avgRating, reviewCount: entityReviews.length }
          : entity
      );
      setEntities(updatedEntities);

      // Create notification for entity followers
      const entity = entities.find(e => e.id === reviewData.entityId);
      if (entity) {
        entity?.followers?.forEach(followerId => {
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
      
      return newReview;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  };

  const addPost = async (postData: Omit<Post, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding post to backend:', postData);
      
      const requestBody: any = {
        userId: postData.userId,
        type: postData.type
        // Note: image removed as not supported in current database schema
      };

      if (postData.type === 'simple') {
        requestBody.content = (postData as SimplePost).content;
      } else if (postData.type === 'rate-my-work') {
        requestBody.title = (postData as RateMyWorkPost).title;
        requestBody.description = (postData as RateMyWorkPost).description;
      }
      
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newPost = await response.json();
      console.log('Post created successfully:', newPost);
      
      // Update local state
      const updatedPosts = [...posts, newPost];
      setPosts(updatedPosts);
      
      return newPost;
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
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

  const votePost = async (postId: string, voteType: 'up' | 'down') => {
    try {
      console.log('Voting on post:', postId, 'Vote type:', voteType);
      
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedPostData = await response.json();
      console.log('Vote recorded successfully:', updatedPostData);
      
      // Update local state
      const updatedPosts = posts.map(post => {
        if (post.id === postId && post.type === 'simple') {
          return { 
            ...post, 
            upvotes: updatedPostData.upvotes,
            downvotes: updatedPostData.downvotes
          };
        }
        return post;
      });
      
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error voting on post:', error);
      throw error;
    }
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
        ? { ...entity, followers: [...entity?.followers || [], userId] }
        : entity
    );
    setEntities(updatedEntities);
    localStorage.setItem('jachai_entities', JSON.stringify(updatedEntities));
  };

  const unfollowEntity = (entityId: string, userId: string) => {
    const updatedEntities = entities.map(entity =>
      entity.id === entityId
        ? { ...entity, followers: entity?.followers?.filter(id => id !== userId) }
        : entity
    );
    setEntities(updatedEntities);
    localStorage.setItem('jachai_entities', JSON.stringify(updatedEntities));
  };

  const searchEntities = (query: string): Entity[] => {
    return entities.filter(entity =>
      entity.item_name.toLowerCase().includes(query.toLowerCase()) ||
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
      categories,
      addEntity,
      addReview,
      addPost,
      followEntity,
      unfollowEntity,
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