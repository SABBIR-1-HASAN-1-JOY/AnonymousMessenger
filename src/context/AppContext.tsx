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
  if (context === undefined) {
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
    // Load data from localStorage
    const savedEntities = localStorage.getItem('jachai_entities');
    const savedReviews = localStorage.getItem('jachai_reviews');
    const savedPosts = localStorage.getItem('jachai_posts');
    const savedNotifications = localStorage.getItem('jachai_notifications');

    if (savedEntities) setEntities(JSON.parse(savedEntities));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    // Initialize with sample data if empty
    if (!savedEntities) {
      const sampleEntities: Entity[] = [
        {
          id: '1',
          name: 'iPhone 15 Pro',
          description: 'Latest Apple smartphone with titanium design and advanced camera system',
          category: 'Electronics',
          sector: 'Smartphones',
          picture: 'https://images.pexels.com/photos/11165799/pexels-photo-11165799.jpeg?auto=compress&cs=tinysrgb&w=800',
          overallRating: 4.5,
          reviewCount: 12,
          followers: ['demo1', 'demo2'],
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'The Cheesecake Factory',
          description: 'Popular restaurant chain known for extensive menu and delicious cheesecakes',
          category: 'Restaurants',
          sector: 'Casual Dining',
          picture: 'https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?auto=compress&cs=tinysrgb&w=800',
          overallRating: 4.2,
          reviewCount: 8,
          followers: ['demo2', 'demo3'],
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Tesla Model 3',
          description: 'Electric sedan with autopilot features and impressive range',
          category: 'Automotive',
          sector: 'Electric Vehicles',
          picture: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
          overallRating: 4.7,
          reviewCount: 15,
          followers: ['demo1', 'demo3'],
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          name: 'MacBook Pro M3',
          description: 'Professional laptop with M3 chip for creative professionals',
          category: 'Electronics',
          sector: 'Laptops',
          picture: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
          overallRating: 4.6,
          reviewCount: 9,
          followers: ['demo1'],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setEntities(sampleEntities);
      localStorage.setItem('jachai_entities', JSON.stringify(sampleEntities));
    }

    // Initialize sample reviews if empty
    if (!savedReviews) {
      const sampleReviews: Review[] = [
        {
          id: 'r1',
          entityId: '1',
          userId: 'demo1',
          userName: 'John Smith',
          title: 'Amazing camera quality!',
          body: 'The iPhone 15 Pro camera is absolutely incredible. The new titanium design feels premium and the battery life is much better than my previous phone.',
          rating: 5,
          upvotes: 8,
          downvotes: 1,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'r2',
          entityId: '2',
          userId: 'demo2',
          userName: 'Sarah Johnson',
          title: 'Great food, long wait times',
          body: 'The food at Cheesecake Factory is always delicious and the portions are huge. However, be prepared to wait for a table, especially on weekends.',
          rating: 4,
          upvotes: 12,
          downvotes: 2,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'r3',
          entityId: '3',
          userId: 'demo3',
          userName: 'Mike Chen',
          title: 'Best car I\'ve ever owned',
          body: 'Tesla Model 3 has completely changed my driving experience. The autopilot is amazing and I love never having to go to gas stations again.',
          rating: 5,
          upvotes: 15,
          downvotes: 0,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setReviews(sampleReviews);
      localStorage.setItem('jachai_reviews', JSON.stringify(sampleReviews));
    }

    // Initialize sample posts if empty
    if (!savedPosts) {
      const samplePosts: Post[] = [
        {
          id: 'p1',
          type: 'rate-my-work',
          userId: 'demo1',
          userName: 'John Smith',
          title: 'My Photography Portfolio Website',
          description: 'Just finished building my photography portfolio website. Would love to get feedback on the design and user experience!',
          image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
          ratings: [
            { userId: 'demo2', rating: 5 },
            { userId: 'demo3', rating: 4 }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'p2',
          type: 'simple',
          userId: 'demo2',
          userName: 'Sarah Johnson',
          content: 'Just tried the new sushi place downtown and it was incredible! The fish was so fresh and the presentation was beautiful. Definitely going back soon! 🍣',
          image: 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=800',
          upvotes: 23,
          downvotes: 1,
          comments: [],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'p3',
          type: 'simple',
          userId: 'demo3',
          userName: 'Mike Chen',
          content: 'Anyone else excited about the new gaming laptop releases this year? The performance improvements are insane compared to last generation.',
          upvotes: 18,
          downvotes: 3,
          comments: [],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        }
      ];
      setPosts(samplePosts);
      localStorage.setItem('jachai_posts', JSON.stringify(samplePosts));
    }

    // Initialize sample notifications if empty
    if (!savedNotifications) {
      const sampleNotifications: Notification[] = [
        {
          id: 'n1',
          userId: 'demo1',
          type: 'rating',
          message: 'Sarah Johnson rated your "Photography Portfolio Website" post 5 stars!',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          relatedId: 'p1'
        },
        {
          id: 'n2',
          userId: 'demo2',
          type: 'follow',
          message: 'Mike Chen started following you!',
          read: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          relatedId: 'demo3'
        },
        {
          id: 'n3',
          userId: 'demo3',
          type: 'review',
          message: 'New review added to Tesla Model 3 that you follow',
          read: true,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          relatedId: '3'
        }
      ];
      setNotifications(sampleNotifications);
      localStorage.setItem('jachai_notifications', JSON.stringify(sampleNotifications));
    }
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