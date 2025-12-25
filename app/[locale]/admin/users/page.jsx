"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "react-toastify";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import {
  FiSearch,
  FiFilter,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiDollarSign,
  FiTrash2,
  FiUserX,
  FiUserCheck as FiMakeAdmin,
} from "react-icons/fi";
import { TbUser, TbUserStar } from "react-icons/tb";
import { MdAdminPanelSettings } from "react-icons/md";

export default function UsersPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    // Auth check
    const storedUser = localStorage.getItem("user");
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      router.push(`/${locale}/login`);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.tier !== "admin") {
      router.push(`/${locale}`);
      return;
    }

    loadUsers();
  }, [router, locale]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterOpen && !event.target.closest(".filter-dropdown")) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  // Fetch users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || "Failed to load users");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = (userId, userName) => {
    toast.info(
      <div>
        <p className="font-semibold mb-2">Delete {userName || "this user"}?</p>
        <p className="text-sm mb-4 text-gray-600">
          This action cannot be undone. User data will be permanently deleted.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss();
              await performDelete(userId, userName);
            }}
            className="px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => {
              toast.dismiss();
            }}
            className="px-4 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
          >
            No, Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      }
    );
  };

  // Perform actual deletion
  const performDelete = async (userId, userName) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`User "${userName}" deleted successfully!`);
        loadUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  // Change user tier with confirmation
  const changeUserTier = (userId, userName, currentTier) => {
    toast.info(
      <div>
        <p className="font-semibold mb-2">
          Make {userName || "this user"} an Admin?
        </p>
        <p className="text-sm mb-4">Current tier: {currentTier || "free"}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss();
              makeAdmin(userId, userName);
            }}
            className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            Yes, Make Admin
          </button>
          <button
            onClick={() => {
              toast.dismiss();
            }}
            className="px-4 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
          >
            No, Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      }
    );
  };

  // Make user admin function
  const makeAdmin = async (userId, userName) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          tier: "admin",
          subscription: {
            tier: "admin",
            status: "active",
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${userName || "User"} is now an Admin!`);
        loadUsers();
      } else {
        toast.error(data.error || "Failed to make admin");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  // Filter users based on active tab and selected tier
  const filteredUsers = users.filter((user) => {
    if (activeTab === "admin" && user.tier !== "admin") return false;
    if (activeTab === "all" && user.tier === "admin") return false;

    if (
      activeTab === "all" &&
      selectedTier !== "all" &&
      user.tier !== selectedTier
    ) {
      return false;
    }

    return (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Toggle user details expansion
  const toggleUserExpansion = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Tier badge component
  const TierBadge = ({ tier }) => {
    const tierStyles = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      tier3: "bg-red-100 text-red-800 border-red-200",
      tier2: "bg-green-100 text-green-800 border-green-200",
      free: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const tierIcons = {
      admin: <MdAdminPanelSettings className="w-4 h-4 mr-1" />,
      tier3: <TbUserStar className="w-4 h-4 mr-1" />,
      tier2: <FiUserCheck className="w-4 h-4 mr-1" />,
      free: <TbUser className="w-4 h-4 mr-1" />,
    };

    const tierNames = {
      admin: "Admin",
      tier3: "Tier 3",
      tier2: "Tier 2",
      free: "Free",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
          tierStyles[tier] || tierStyles.free
        }`}
      >
        {tierIcons[tier] || tierIcons.free}
        {tierNames[tier] || "Free"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage all users and their access levels
        </p>
      </div>

      {/* Stats Cards - Mobile First Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <FiUsers className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-gray-50 rounded-lg mr-3">
              <TbUser className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Free Users</p>
              <p className="text-xl sm:text-2xl font-bold">
                {users.filter((u) => !u.tier || u.tier === "free").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg mr-3">
              <FiDollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Users</p>
              <p className="text-xl sm:text-2xl font-bold">
                {
                  users.filter(
                    (u) => u.tier && u.tier !== "free" && u.tier !== "admin"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg mr-3">
              <MdAdminPanelSettings className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-xl sm:text-2xl font-bold">
                {users.filter((u) => u.tier === "admin").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Tabs - Mobile scrollable */}
          <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "all"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <FiUsers className="w-4 h-4 mr-2" />
              All Users
              <span className="ml-2 px-2 py-0.5 text-xs bg-white rounded-full">
                {users.filter((u) => u.tier !== "admin").length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <MdAdminPanelSettings className="w-4 h-4 mr-2" />
              Admin Users
              <span className="ml-2 px-2 py-0.5 text-xs bg-white rounded-full">
                {users.filter((u) => u.tier === "admin").length}
              </span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={
                    activeTab === "all"
                      ? "Search users by name or email..."
                      : "Search admin users..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Tier Filter Dropdown (only for All Users tab) */}
              {activeTab === "all" && (
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="inline-flex items-center justify-between w-full sm:w-40 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <div className="flex items-center">
                      <FiFilter className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {selectedTier === "all"
                          ? "All Tiers"
                          : selectedTier === "free"
                          ? "Free Users"
                          : selectedTier === "tier2"
                          ? "Tier 2"
                          : selectedTier === "tier3"
                          ? "Tier 3"
                          : "Filter"}
                      </span>
                    </div>
                    {isFilterOpen ? (
                      <IoIosArrowUp className="ml-2" />
                    ) : (
                      <IoIosArrowDown className="ml-2" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isFilterOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setSelectedTier("all");
                            setIsFilterOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                            selectedTier === "all"
                              ? "bg-gray-50 text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          <span>All Tiers</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {users.filter((u) => u.tier !== "admin").length}
                          </span>
                        </button>

                        {["free", "tier2", "tier3"].map((tier) => {
                          const count = users.filter(
                            (u) => u.tier === tier
                          ).length;
                          return (
                            <button
                              key={tier}
                              onClick={() => {
                                setSelectedTier(tier);
                                setIsFilterOpen(false);
                              }}
                              className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                                selectedTier === tier
                                  ? "bg-gray-50 text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              <div className="flex items-center">
                                {tier === "free" && (
                                  <TbUser className="w-4 h-4 mr-2" />
                                )}
                                {tier === "tier2" && (
                                  <FiUserCheck className="w-4 h-4 mr-2" />
                                )}
                                {tier === "tier3" && (
                                  <TbUserStar className="w-4 h-4 mr-2" />
                                )}
                                <span>
                                  {tier === "free"
                                    ? "Free Users"
                                    : tier === "tier2"
                                    ? "Tier 2 Users"
                                    : "Tier 3 Users"}
                                </span>
                              </div>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Users List - Mobile Cards / Desktop Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
          <div className="text-gray-400 mb-4">
            <FiUserX className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">
            {activeTab === "all" ? "No users found" : "No admin users found"}
          </p>
          <p className="text-sm text-gray-400">
            {searchTerm ? "Try a different search term" : "Add your first user"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.name || "No Name"}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <TierBadge tier={user.tier} />
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Province</p>
                      <p className="text-sm font-medium">
                        {user.province || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Plans</p>
                      <p className="text-sm font-medium">
                        Monthly: {user.monthly_plan_count || 0}
                      </p>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {/* Expandable Details */}
                  {expandedUser === user._id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Joined</p>
                          <p className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {/* ADD MARKETING CONSENT HERE */}
                        <div>
                          <p className="text-xs text-gray-500">
                            Marketing Consent
                          </p>
                          <p className="text-sm font-medium">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                user.marketing_consent
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.marketing_consent
                                ? "✓ Approved"
                                : "✗ Not Approved"}
                            </span>
                          </p>
                        </div>
                        {user.subscription?.tier && (
                          <div>
                            <p className="text-xs text-gray-500">
                              Subscription
                            </p>
                            <p className="text-sm font-medium">
                              {user.subscription.tier}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleUserExpansion(user._id)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {expandedUser === user._id ? "Show Less" : "More Info"}
                    </button>
                    <div className="flex space-x-3">
                      {activeTab === "all" && user.tier !== "admin" && (
                        <button
                          onClick={() =>
                            changeUserTier(user._id, user.name, user.tier)
                          }
                          className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                          title="Make Admin"
                        >
                          <FiMakeAdmin className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Admin</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user._id, user.name)}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center"
                        title="Delete User"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Province
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marketing Consent {/* ADD THIS COLUMN */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <TierBadge tier={user.tier} />
                          {user.subscription?.tier && (
                            <div className="text-xs text-gray-500">
                              Sub: {user.subscription.tier}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.province || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.marketing_consent
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.marketing_consent ? (
                            <>Approved</>
                          ) : (
                            <>Not Approved</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>Monthly: {user.monthly_plan_count || 0}</div>
                          <div>Weekly: {user.weekly_plan_count || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-3">
                          {activeTab === "all" && user.tier !== "admin" && (
                            <button
                              onClick={() =>
                                changeUserTier(user._id, user.name, user.tier)
                              }
                              className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <FiMakeAdmin className="w-4 h-4 mr-1.5" />
                              Make Admin
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user._id, user.name)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Results Count */}
      <div className="mt-6 text-center sm:text-left">
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
          {searchTerm && ` • Searching for: "${searchTerm}"`}
        </p>
      </div>
    </div>
  );
}
