import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import StatCard from '../components/StatCard';
import RecentOrdersTable from '../components/RecentOrdersTable';
import TopProductsTable from '../components/TopProductsTable';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

// Register Chart.js components
Chart.register(...registerables);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/dashboard/overview`);
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRealtimeData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/realtime/metrics`);
        setRealtimeData(response.data);
      } catch (err) {
        console.error('Error fetching realtime data:', err);
      }
    };

    fetchDashboardData();
    fetchRealtimeData();

    // Set up polling for real-time data
    const interval = setInterval(fetchRealtimeData, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Prepare chart data for real-time metrics
  const prepareChartData = () => {
    if (!realtimeData || realtimeData.length === 0) return null;

    const labels = realtimeData.map(item => {
      const date = new Date(item.timestamp);
      return format(date, 'HH:mm');
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Events',
          data: realtimeData.map(item => item.total || 0),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Page Views',
          data: realtimeData.map(item => item.page_view || 0),
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Product Views',
          data: realtimeData.map(item => item.product_view || 0),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Add to Cart',
          data: realtimeData.map(item => item.add_to_cart || 0),
          borderColor: 'rgb(255, 159, 64)',
          tension: 0.1,
          fill: false
        }
      ]
    };
  };

  if (loading) return <div className="flex justify-center items-center h-full">Loading dashboard data...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  const chartData = prepareChartData();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Page Views" 
          value={dashboardData?.pageViews?.today?.toLocaleString() || '0'} 
          change={dashboardData?.pageViews?.change || '0'} 
          icon={<FiUsers className="h-6 w-6" />} 
        />
        <StatCard 
          title="Orders" 
          value={(dashboardData?.sales?.today?.count || 0).toLocaleString()} 
          change={dashboardData?.sales?.change || '0'} 
          icon={<FiShoppingBag className="h-6 w-6" />} 
        />
        <StatCard 
          title="Revenue" 
          value={`$${(dashboardData?.sales?.today?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          change={dashboardData?.sales?.change || '0'} 
          icon={<FiDollarSign className="h-6 w-6" />} 
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${dashboardData?.conversionRate || '0'}%`} 
          icon={<FiTrendingUp className="h-6 w-6" />} 
        />
      </div>
      
      {/* Real-time Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">Real-time Activity</h2>
        {chartData ? (
          <div className="h-64">
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} 
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">No real-time data available</div>
        )}
      </div>
      
      {/* Two Column Layout for Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Top Products</h2>
          <TopProductsTable products={dashboardData?.topProducts || []} />
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
          <RecentOrdersTable orders={dashboardData?.recentOrders || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;