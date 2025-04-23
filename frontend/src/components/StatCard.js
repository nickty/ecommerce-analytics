import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const StatCard = ({ title, value, change, icon }) => {
  const isPositive = parseFloat(change) >= 0;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="text-gray-500 text-sm font-medium">{title}</div>
        <div className="bg-gray-100 p-2 rounded-full">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {change !== undefined && (
        <div className="mt-2 flex items-center text-sm">
          {isPositive ? (
            <FiArrowUp className="text-green-500 mr-1" />
          ) : (
            <FiArrowDown className="text-red-500 mr-1" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(parseFloat(change)).toFixed(2)}% {isPositive ? 'increase' : 'decrease'}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;