import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBox, FiUsers, FiDollarSign, FiSearch, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="flex items-center space-x-2 px-4">
        <FiBox className="h-8 w-8" />
        <span className="text-2xl font-extrabold">E-Analytics</span>
      </div>
      
      <nav className="mt-10">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
          end
        >
          <FiHome className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/products" 
          className={({ isActive }) => 
            `flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <FiBox className="h-5 w-5" />
          <span>Products</span>
        </NavLink>
        
        <NavLink 
          to="/users" 
          className={({ isActive }) => 
            `flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <FiUsers className="h-5 w-5" />
          <span>Users</span>
        </NavLink>
        
        <NavLink 
          to="/sales" 
          className={({ isActive }) => 
            `flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <FiDollarSign className="h-5 w-5" />
          <span>Sales</span>
        </NavLink>
        
        <NavLink 
          to="/search" 
          className={({ isActive }) => 
            `flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <FiSearch className="h-5 w-5" />
          <span>Search</span>
        </NavLink>
      </nav>
      
      <div className="px-4 mt-auto">
        <div className="flex items-center space-x-2 py-2.5 px-4 rounded hover:bg-gray-700 transition duration-200 cursor-pointer">
          <FiSettings className="h-5 w-5" />
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;