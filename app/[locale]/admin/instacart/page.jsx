"use client";

import { useState, useEffect, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import * as React from "react";
import { RefreshCw, ShoppingCart, DollarSign, Package, AlertCircle, Calendar, Database } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function InstacartAnalytics({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const { locale } = unwrappedParams;
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchRealData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      
      // console.log(`Fetching data for range: ${timeRange}`);
      const response = await fetch(`/api/admin/analytics/instacart?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      // console.log('API Response:', result);
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]); 

  const getTimeRangeLabel = (range) => {
    switch(range) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case 'all': return 'All time';
      default: return 'Last 30 days';
    }
  };

  useEffect(() => {
    // Admin check
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      router.push(`/${locale}/login`);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.tier !== "admin") {
      router.push(`/${locale}`);
      return;
    }

    fetchRealData();
  }, [router, locale, fetchRealData]); 

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Time range buttons component
  const TimeRangeSelector = () => {
    const timeOptions = [
      { value: 'today', label: 'Today' },
      { value: '7days', label: 'Last 7 days' },
      { value: '30days', label: 'Last 30 days' },
      { value: 'all', label: 'All time' }
    ];

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {timeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              // console.log(`Changing time range to: ${option.value}`);
              setTimeRange(option.value);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === option.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  // Get appropriate chart data based on time range
  const getChartData = () => {
    if (!data) return [];
    
    // console.log('Getting chart data for range:', timeRange, {
    //   hasHourly: data?.hourlyData?.length,
    //   hasDaily: data?.dailyData?.length,
    //   hasMonthly: data?.monthlyData?.length
    // });
    
    if (timeRange === 'today') {
      // For today, always return hourly data (even if empty)
      return data?.hourlyData || [];
    } else if (timeRange === '7days' || timeRange === '30days') {
      return data?.dailyData || [];
    } else if (timeRange === 'all') {
      return data?.monthlyData || [];
    }
    
    return [];
  };

  // Get X-axis key based on time range
  const getXAxisKey = () => {
    if (timeRange === 'today') return 'hour';
    if (timeRange === 'all') return 'month';
    return 'date';
  };

  // Format X-axis tick for today view
  const formatXAxisTick = (value) => {
    if (timeRange === 'today') {
      // Show only hour part (e.g., "08:00" -> "08")
      return value.split(':')[0];
    }
    return value;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Instacart Analytics</h1>
        <div className="flex items-center gap-2">
          <Database className={`w-5 h-5 ${data?.summary?.hasRealData ? 'text-green-500' : 'text-yellow-500'}`} />
          <p className="text-gray-600">
            {data?.summary?.hasRealData ? 'Live tracking data' : 'No clicks recorded yet'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Time Period</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchRealData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {data?.summary?.lastUpdated && (
              <span className="text-sm text-gray-500 hidden sm:block">
                Updated: {new Date(data.summary.lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        <TimeRangeSelector />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-50 rounded-lg mr-4">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Clicks</div>
              <div className="text-2xl font-bold">
                {data ? data.summary.totalClicks.toLocaleString() : '0'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">{getTimeRangeLabel(timeRange)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-50 rounded-lg mr-4">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                T3
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tier 3 Clicks</div>
              <div className="text-2xl font-bold text-green-600">
                {data ? data.summary.tier3Clicks.toLocaleString() : '0'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {data && data.summary.totalClicks > 0 
              ? Math.round((data.summary.tier3Clicks / data.summary.totalClicks) * 100) 
              : 0}% of total
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-50 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Est. Commission</div>
              <div className="text-2xl font-bold text-purple-600">
                {data ? formatCurrency(data.summary.estimatedCommission) : '$0'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            ${data?.summary?.commissionRate || '0.50'} per item
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-50 rounded-lg mr-4">
              <Package className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Items per Click</div>
              <div className="text-2xl font-bold">
                {data ? data.summary.avgItemsPerClick : '0'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">per shopping session</div>
        </div>
      </div>

      {/* Click Trend Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {timeRange === 'today' ? 'Hourly Click Trend' : 
               timeRange === 'all' ? 'Monthly Click Trend' : 'Daily Click Trend'}
            </h3>
            <p className="text-sm text-gray-500">{getTimeRangeLabel(timeRange)}</p>
          </div>
          <div className="flex items-center text-gray-500">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="text-sm">
              {data?.summary?.hasRealData ? 'Live tracking' : 'No data yet'}
            </span>
          </div>
        </div>
        
        {getChartData().length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={getXAxisKey()}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisTick}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Clicks']}
                  labelFormatter={(label) => {
                    if (timeRange === 'today') return `Time: ${label}`;
                    if (timeRange === 'all') return `Month: ${label}`;
                    return `Date: ${label}`;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No click data available</p>
              <p className="text-sm text-gray-400">
                {timeRange === 'today' ? 'No clicks recorded today yet' : 
                 `No clicks recorded in ${getTimeRangeLabel(timeRange).toLowerCase()} yet`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tier Breakdown Chart */}
      {data && data.summary.totalClicks > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Clicks by User Tier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Tier 3', value: data.summary.tier3Clicks },
                  { name: 'Tier 2', value: data.summary.tier2Clicks },
                  { name: 'Free', value: data.summary.freeClicks }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Clicks']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#6b7280" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && data && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">Debug Info:</h4>
          <p>Time Range: {timeRange}</p>
          <p>Has Real Data: {data.summary.hasRealData ? 'Yes' : 'No'}</p>
          <p>Total Clicks: {data.summary.totalClicks}</p>
          <p>Hourly Data Length: {data.hourlyData?.length || 0}</p>
          <p>Daily Data Length: {data.dailyData?.length || 0}</p>
          <p>Monthly Data Length: {data.monthlyData?.length || 0}</p>
        </div>
      )}
    </div>
  );
}