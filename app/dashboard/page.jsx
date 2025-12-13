'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useSelector((state) => state.auth);


  // Tier configuration
  const tierConfig = {
    free: {
      name: 'Free',
      color: 'bg-[#EDF7E0] text-black',
      price: '$0/month',
      swapsAllowed: 1,
      features: ['1 swap per plan', 'Basic recipes', 'Limited saves'],
    },
    tier2: {
      name: 'Plus',
      color: 'bg-[#D9ECF9] text-black',
      price: '$4.99/month',
      swapsAllowed: 2,
      features: ['2 swaps per plan', 'Edamam recipes', 'Unlimited saves'],
    },
    tier3: {
      name: 'Premium',
      color: 'bg-black text-white',
      price: '$9.99/month',
      swapsAllowed: 3,
      features: ['3 swaps per plan', 'Premium recipes', 'Priority support'],
    },
  };

  const currentTier = user?.tier || 'free';
  const config = tierConfig[currentTier];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cc63c] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#8cc63c] hover:bg-[#7ab32f]  text-white px-5 py-2.5 rounded-lg font-medium"
            > <ArrowLeft />
              Back to Home
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome{user?.name ? `, ${user.name}` : ''}! 👋
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium truncate">{user?.email || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{user?.province || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium">
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('en-CA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Subscription Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-medium px-3 py-1 rounded-full text-sm ${config.color}`}>
                        {config.name} Plan
                      </span>
                      <span className="text-sm text-gray-500">{config.price}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Swaps Available</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">
                        {user?.swapsUsed || 0} / {user?.swapsAllowed || config.swapsAllowed} used
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#8cc63c] h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(100, ((user?.swapsUsed || 0) / (user?.swapsAllowed || config.swapsAllowed)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Plan Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Plan</h2>
              
              <div className={`p-4 rounded-lg ${config.color} mb-4`}>
                <div className="font-bold text-lg">{config.name} Plan</div>
                <div className="text-sm opacity-90">{config.price}</div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/#pricing"
                  className="block w-full text-center bg-[#8cc63c] hover:bg-[#7ab32f] text-white py-3 rounded-lg font-medium"
                >
                  {currentTier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                </Link>
                
                {currentTier !== 'free' && (
                  <Link
                    href="/#pricing"
                    className="block w-full text-center border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 font-medium"
                  >
                    Cancel Subscription
                  </Link>
                )}
                
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}