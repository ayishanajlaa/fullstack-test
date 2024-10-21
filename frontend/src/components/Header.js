import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('token');

  const handleLogout = async () => {
    try {
      // Make a request to your backend to log out
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      // Remove token from sessionStorage and navigate to login page
      sessionStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center flex-wrap">
        <Link to="/" className="text-xl font-semibold">
          File Manager App
        </Link>
        <nav className="flex items-center space-x-4">
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
