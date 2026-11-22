import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import Home from './components/Home'
import PinDetail from './components/PinDetail'
import Settings from './components/Settings'
import BoardsPage from './components/BoardsPage'
import BoardDetail from './components/BoardDetail'
import UserProfile from './components/UserProfile'
import AdminPanel from './components/AdminPanel'
import './App.css'

const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pin/:id" element={<PinDetail />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/board/:id" element={<BoardDetail />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            } />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

