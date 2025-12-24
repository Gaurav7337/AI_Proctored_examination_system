import React from 'react';
import { useAuth } from '../AuthContext';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-dark bg-dark px-3 mb-4">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">{title}</span>
        <div className="d-flex align-items-center">
          <span className="text-white me-3">
            {user?.username} <span className="badge bg-secondary">{user?.role?.toUpperCase()}</span>
          </span>
          <button onClick={logout} className="btn btn-outline-danger btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;