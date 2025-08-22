import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import CodeLogin from './components/Auth/CodeLogin';
import UsernameSelection from './components/Auth/UsernameSelection';
import Messaging from './components/Messaging/Messaging';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<CodeLogin />} />
          <Route path="/username" element={<UsernameSelection />} />
          <Route path="/messaging" element={<Messaging />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;