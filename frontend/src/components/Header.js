import React, { useState } from 'react';
import { FiMenu, FiBell, FiUser, FiSearch } from 'react-icons/fi';

const Header = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-4 sticky top-0 z-10">
      <div className="flex-1 flex items-center justify-between">
        {/* Left side - Mobile menu button */}
        <button className="p-1 rounded-md text-gray-500 md:hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span className="sr-only">Open menu</span>
          <FiMenu className="h-6 w-6" />
        </button>

        {/* Search bar */}
        <div className="max-w-lg w-full lg:max-w-xs ml-4 md:ml-0">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search"
              type="search"
            />
          </div>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">View notifications</span>
              <FiBell className="h-6 w-6" />
            </button>
            
            {/* Notification badge */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            
            {/* Dropdown menu */}
            {isNotificationsOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">Notifications</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b" role="menuitem">
                      <p className="font-medium">New order received</p>
                      <p className="text-xs text-gray-500">5 minutes ago</p>
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b" role="menuitem">
                      <p className="font-medium">Product stock low</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      <p className="font-medium">New user registered</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </a>
                  </div>
                  <div className="border-t">
                    <a href="#" className="block px-4 py-2 text-sm text-center text-indigo-600 font-medium" role="menuitem">
                      View all notifications
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative ml-3">
            <div>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                id="user-menu"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FiUser className="h-5 w-5 text-gray-500" />
                </div>
              </button>
            </div>
            
            {/* Dropdown menu */}
            {isProfileOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Your Profile
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Settings
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;