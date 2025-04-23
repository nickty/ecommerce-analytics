import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const UserAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/analytics`);
        setUserData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const prepareRetentionChartData = () => {
    if (!userData) return null;

    const returningUsers = userData.returningUsers || 0;
    const oneTimeUsers = (userData.totalUsers || 0) - returningUsers;

    return {
      labels: ['Returning Users', 'One-time Users'],
      datasets: [
        {
          data: [returningUsers, oneTimeUsers],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) return <div className="flex justify-center items-center h-full">Loading user data...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  const retentionChartData = prepareRetentionChartData();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-6">User Analytics</h1>
      
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm font-medium">Total Users</div>
          <div className="mt-2 text-2xl font-semibold">{(userData?.totalUsers || 0).toLocaleString()}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm font-medium">New Users (24h)</div>
          <div className="mt-2 text-2xl font-semibold">{(userData?.newUsers || 0).toLocaleString()}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm font-medium">Returning Users</div>
          <div className="mt-2 text-2xl font-semibold">{(userData?.returningUsers || 0).toLocaleString()}</div>
        </div>
      </div>
      
      {/* User Retention Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">User Retention</h2>
        {retentionChartData ? (
          <div className="h-64 flex justify-center">
            <div className="w-64">
              <Pie 
                data={retentionChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }} 
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No user retention data available</div>
        )}
      </div>
      
      {/* Top Users Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Top Users by Spending</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Orders
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userData?.topUsers?.map((user, index) => (
                <tr key={user.userId || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.userId || `User-${index}`}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.totalOrders || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(user.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;