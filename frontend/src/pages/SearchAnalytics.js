import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const SearchAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchData, setSearchData] = useState(null);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/search/analytics`);
        setSearchData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching search data:', err);
        setError('Failed to load search analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, []);

  const prepareTopSearchesChartData = () => {
    if (!searchData || !searchData.topSearchTerms || searchData.topSearchTerms.length === 0) return null;

    // Get top 10 search terms
    const topTerms = [...searchData.topSearchTerms].slice(0, 10);

    return {
      labels: topTerms.map(term => term._id),
      datasets: [
        {
          label: 'Search Count',
          data: topTerms.map(term => term.count || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const prepareZeroResultsChartData = () => {
    if (!searchData || !searchData.zeroResultSearches || searchData.zeroResultSearches.length === 0) return null;

    return {
      labels: searchData.zeroResultSearches.map(term => term._id),
      datasets: [
        {
          label: 'Search Count',
          data: searchData.zeroResultSearches.map(term => term.count || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) return <div className="flex justify-center items-center h-full">Loading search data...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  const topSearchesChartData = prepareTopSearchesChartData();
  const zeroResultsChartData = prepareZeroResultsChartData();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Search Analytics</h1>
      
      {/* Top Searches Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">Top Search Terms</h2>
        {topSearchesChartData ? (
          <div className="h-80">
            <Bar 
              data={topSearchesChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                },
                indexAxis: 'y'
              }} 
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">No search data available</div>
        )}
      </div>
      
      {/* Zero Results Searches */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">Searches with No Results</h2>
        {zeroResultsChartData ? (
          <div className="h-80">
            <Bar 
              data={zeroResultsChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                },
                indexAxis: 'y'
              }} 
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">No zero-result searches data available</div>
        )}
      </div>
      
      {/* Search Terms Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">All Search Terms</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Term
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Searched
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {searchData?.topSearchTerms?.map((term, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{term._id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {term.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {term.lastSearched ? new Date(term.lastSearched).toLocaleString() : 'Unknown'}
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

export default SearchAnalytics;