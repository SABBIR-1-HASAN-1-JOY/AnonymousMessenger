import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
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
import Feed from './components/Feed/Feed';
import Profile from './components/Profile/Profile';
import Notifications from './components/Notifications/Notifications';
import SearchResults from './components/Search/SearchResults';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
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
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/search" element={<SearchResults />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;