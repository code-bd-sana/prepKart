"use client";

import { useState, useEffect, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import * as React from "react";
import { RefreshCw, ShoppingCart, DollarSign, Package, AlertCircle } from "lucide-react";
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function InstacartAnalytics({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const { locale } = unwrappedParams;
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Wrap fetchRealData in useCallback to stabilize it
  const fetchRealData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const response = await fetch(`/api/admin/analytics/instacart?months=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(error.message);
      // Set empty data on error
      setData({
        summary: {
          totalClicks: 0,
          tier3Clicks: 0,
          tier2Clicks: 0,
          freeClicks: 0,
          totalItems: 0,
          avgItemsPerClick: 0,
          estimatedCommission: 0,
          commissionRate: 0.50,
          period: `${timeRange} months`,
          lastUpdated: new Date().toISOString()
        },
        monthlyData: []
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]); 

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
        <p className="text-gray-600">Real data from your Click tracking</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center space-x-4">
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="1">Last 1 month</option>
          <option value="3">Last 3 months</option>
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
        </select>
        
        <button
          onClick={fetchRealData}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        
        {data?.summary?.lastUpdated && (
          <span className="text-sm text-gray-500">
            Updated: {new Date(data.summary.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

{data && data.monthlyData && data.monthlyData.length > 0 ? (
  <div className="mt-8">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Click Trends</h3>
    
    {/* Line Chart */}
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h4 className="font-medium text-gray-700 mb-4">Clicks Over Time</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Clicks']}
            />
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Bar Chart */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h4 className="font-medium text-gray-700 mb-4">Clicks by Tier per Month</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'tier3') return [value.toLocaleString(), 'Tier 3'];
                if (name === 'tier2') return [value.toLocaleString(), 'Tier 2'];
                if (name === 'free') return [value.toLocaleString(), 'Free'];
                return [value.toLocaleString(), name];
              }}
            />
            <Bar dataKey="tier3" name="Tier 3" fill="#10b981" stackId="a" />
            <Bar dataKey="tier2" name="Tier 2" fill="#3b82f6" stackId="a" />
            <Bar dataKey="free" name="Free" fill="#6b7280" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
) : (
  <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
    <p className="text-gray-500">No monthly data available yet</p>
    <p className="text-sm text-gray-400 mt-2">Start tracking clicks to see charts</p>
  </div>
)}

      {/* Show setup instructions if Click model not created */}
      {data && data.summary.totalClicks === 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-3">Setup Required</h3>
          <p className="text-sm text-blue-700 mb-4">
            To start tracking Instacart clicks, you need to:
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-600 space-y-2">
            <li><strong>Create the Click model</strong> - Save the Click.js file in your models folder</li>
            <li><strong>Update GroceryList component</strong> - Add click logging to the Instacart button</li>
            <li><strong>Wait for user activity</strong> - Tier 3 users need to click Instacart links</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <code className="text-xs text-blue-800 block">
            </code>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          <div className="text-sm text-gray-400">in last {data?.summary?.period || '0 months'}</div>
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
    </div>
  );
}