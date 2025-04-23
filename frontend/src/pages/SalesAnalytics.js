import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/sales/analytics?period=${period}`);
        setSalesData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Failed to load sales analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [period]);

  const prepareSalesChartData = () => {
    if (!salesData || !salesData.salesData || salesData.salesData.length === 0) return null;

    return {
      labels: salesData.salesData.map(item => item._id),
      datasets: [
        {
          label: 'Revenue',
          data: salesData.salesData.map(item => item.revenue || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          yAxisID: 'y',
          fill: true
        },
        {
          label: 'Orders',
          data: salesData.salesData.map(item => item.count || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          yAxisID: 'y1',
          fill: true
        }
      ]
    };
  };

  const preparePaymentMethodsChartData = () => {
    if (!salesData || !salesData.paymentMethods || salesData.paymentMethods.length === 0) return null;

    return {
      labels: salesData.paymentMethods.map(item => item._id),
      datasets: [
        {
          data: salesData.paymentMethods.map(item => item.revenue || 0),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) return <div className="flex justify-center items-center h-full">Loading sales data...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  const salesChartData = prepareSalesChartData();
  const paymentMethodsChartData = preparePaymentMethodsChartData();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Sales Analytics</h1>
      
      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPeriod('hourly')}
              className={`px-3 py-1 text-sm rounded-md ${
                period === 'hourly' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1 text-sm rounded-md ${
                period === 'daily' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1 text-sm rounded-md ${
                period === 'weekly' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1 text-sm rounded-md ${
                period === 'monthly' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
      
      {/* Sales Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">Sales Trend</h2>
        {salesChartData ? (
          <div className="h-80">
            <Line 
              data={salesChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Revenue ($)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                      drawOnChartArea: false
                    },
                    title: {
                      display: true,
                      text: 'Orders'
                    }
                  }
                }
              }} 
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">No sales data available</div>
        )}
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Payment Methods</h2>
          {paymentMethodsChartData ? (
            <div className="h-64 flex justify-center">
              <div className="w-64">
                <Doughnut 
                  data={paymentMethodsChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No payment method data available</div>
          )}
        </div>
        
        {/* Sales Summary */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Sales Summary</h2>
          <div className="space-y-4">
            {salesData?.salesData ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-semibold">
                    ${salesData.salesData.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                  <p className="text-2xl font-semibold">
                    {salesData.salesData.reduce((sum, item) => sum + (item.count || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
                  <p className="text-2xl font-semibold">
                    ${(salesData.salesData.reduce((sum, item) => sum + (item.revenue || 0), 0) / 
                      salesData.salesData.reduce((sum, item) => sum + (item.count || 0), 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">No summary data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;