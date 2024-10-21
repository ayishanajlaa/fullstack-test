import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Named import

const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token'); 

    if (!token) {
        return <Navigate to="/login" replace />; 
    }

    try {
        const decodedToken = jwtDecode(token); 
        const currentTime = Date.now() / 1000; 

        // Check if the token is expired
        if (decodedToken.exp < currentTime) {
            sessionStorage.removeItem('token'); 
            return <Navigate to="/login" replace />; 
        }
    } catch (error) {
        
        sessionStorage.removeItem('token'); // Remove invalid token
        return <Navigate to="/login" replace />;
    }

    return children; // Render children if authenticated and token is valid
};

export default ProtectedRoute;
