import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AdminProvider } from './context/AdminContext';
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';  
import EntityList from './components/Entities/EntityList';
import EntityDetail from './components/Entities/EntityDetail';
import CreateEntity from './components/Entities/CreateEntity';
import CategoryList from './components/Categories/CategoryList';
import CategoryDetail from './components/Categories/CategoryDetail';
import CreatePost from './components/Posts/CreatePost';
import PostDetail from './components/Posts/PostDetail';
import ReviewDetail from './components/Reviews/ReviewDetail';
import RateMyWorkDetail from './components/RateMyWork/RateMyWorkDetail';
import Feed from './components/Feed/Feed';
import Profile from './components/Profile/Profile';
import Notifications from './components/Notifications/Notifications';
import SearchResults from './components/Search/SearchResults';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminReports from './components/Admin/AdminReports';
import EntityRequestsAdmin from './components/Admin/EntityRequestsAdmin';
import AdminRouteGuard from './components/Auth/AdminRouteGuard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AdminProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/entities" element={<EntityList />} />
              <Route path="/entities/:id" element={<EntityDetail />} />
              <Route path="/entities/create" element={<CreateEntity />} />
              <Route path="/categories" element={<CategoryList />} />
              <Route path="/categories/:category" element={<CategoryDetail />} />
              <Route path="/create-post" element={
                <AdminRouteGuard>
                  <CreatePost />
                </AdminRouteGuard>
              } />
              <Route path="/feed" element={
                <AdminRouteGuard>
                  <Feed />
                </AdminRouteGuard>
              } />
              <Route path="/posts/:id" element={
                <AdminRouteGuard>
                  <PostDetail />
                </AdminRouteGuard>
              } />
              <Route path="/reviews/:reviewId" element={
                <AdminRouteGuard>
                  <ReviewDetail />
                </AdminRouteGuard>
              } />
              <Route path="/rate-my-work/:id" element={
                <AdminRouteGuard>
                  <RateMyWorkDetail />
                </AdminRouteGuard>
              } />
              <Route path="/profile" element={
                <AdminRouteGuard>
                  <Profile />
                </AdminRouteGuard>
              } />
              <Route path="/profile/:id" element={
                <AdminRouteGuard>
                  <Profile />
                </AdminRouteGuard>
              } />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/notifications" element={
                <AdminRouteGuard>
                  <Notifications />
                </AdminRouteGuard>
              } />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/entity-requests" element={<EntityRequestsAdmin />} />
            </Route>
          </Routes>
        </AdminProvider>
      </AppProvider>
    </AuthProvider>
  </Router>
);
}

export default App;