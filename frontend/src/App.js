import './index.css';
import { BrowserRouter as Router, Route, Routes, useLocation,Navigate } from 'react-router-dom';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import FileDisplay from './components/FileDisplay';
import Login from './components/Login';
import Register from './components/Register'; // Import Register component
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import styles

function App() {
  const location = useLocation(); // Get the current location

  // Check if the current path is for FileDisplay
  const showHeader = !location.pathname.startsWith('/file/');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Conditionally render Header */}
      {showHeader && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* Add Register route */}
          <Route path="/file/:fileId" element={<FileDisplay />} />
          {/* Protected route for file upload (only logged-in users can access) */}
          <Route path="/" element={<ProtectedRoute><FileUpload /></ProtectedRoute>} />
          {/* Redirect all unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} /> 
        </Routes>
      </main>
      <ToastContainer /> {/* Add ToastContainer for notifications */}

    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
