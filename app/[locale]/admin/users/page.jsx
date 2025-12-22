"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import { toast } from "react-toastify";
import { IoIosArrowDown } from "react-icons/io";

export default function UsersPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    // First filter by tab
    if (activeTab === "admin" && user.tier !== "admin") return false;
    if (activeTab === "all" && user.tier === "admin") return false;

    // Then filter by selected tier (only for All Users tab)
    if (
      activeTab === "all" &&
      selectedTier !== "all" &&
      user.tier !== selectedTier
    ) {
      return false;
    }

    // Then filter by search term
    return (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="p-6 ml-64">
        <h1 className="text-2xl font-bold mb-6">Users</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 animate-pulse rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-64">
      {/* Header with Tabs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTab === "all" ? "All Users" : "Admin Users"}
            </h1>
            <p className="text-gray-600 mt-2">
              {filteredUsers.length} users found • {users.length} total
            </p>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Users
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {users.filter((u) => u.tier !== "admin").length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "admin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Admin Users
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {users.filter((u) => u.tier === "admin").length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder={
                  activeTab === "all"
                    ? "Search by name or email..."
                    : "Search admins..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
          </div>
          {/* Tier Filter Dropdown (only for All Users tab) */}
          {activeTab === "all" && (
            <div className="relative inline-block text-left mb-6 filter-dropdown">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter by tier:</span>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex justify-between items-center w-40 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <span>
                    {selectedTier === "all"
                      ? "All Tiers"
                      : selectedTier === "free"
                      ? "Free Users"
                      : selectedTier === "tier2"
                      ? "Tier 2 Users"
                      : selectedTier === "tier3"
                      ? "Tier 3 Users"
                      : "Select Tier"}
                  </span>
                  <IoIosArrowDown />
                </button>

                {/* Clear Filter Button */}
                {selectedTier !== "all" && (
                  <button
                    onClick={() => {
                      setSelectedTier("all");
                      setIsFilterOpen(false);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedTier("all");
                        setIsFilterOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        selectedTier === "all"
                          ? "bg-gray-50 text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      <span>All Tiers</span>
                      <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-200 rounded">
                        {users.filter((u) => u.tier !== "admin").length}
                      </span>
                    </button>

                    {["free", "tier2", "tier3"].map((tier) => {
                      const count = users.filter((u) => u.tier === tier).length;
                      const tierColors = {
                        free: "bg-gray-100 text-gray-700",
                        tier2: "bg-green-100 text-green-700",
                        tier3: "bg-red-100 text-red-700",
                      };

                      return (
                        <button
                          key={tier}
                          onClick={() => {
                            setSelectedTier(tier);
                            setIsFilterOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                            selectedTier === tier
                              ? "bg-gray-50 text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="flex items-center">                           
                            <span>
                              {tier === "free"
                                ? "Free Users"
                                : tier === "tier2"
                                ? "Tier 2 Users"
                                : "Tier 3 Users"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-200 rounded">
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

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            {activeTab === "all" ? "No users found" : "No admin users found"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Province
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{user.name || "No Name"}</div>
                    <div className="text-xs text-gray-500">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.tier === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.tier === "tier3"
                            ? "bg-red-100 text-red-800"
                            : user.tier === "tier2"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.tier || "free"}
                      </span>
                      {user.subscription?.tier && (
                        <div className="text-xs text-gray-500">
                          Subscription: {user.subscription.tier}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.province || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>Monthly: {user.monthly_plan_count || 0}</div>
                    <div>Weekly: {user.weekly_plan_count || 0}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      {activeTab === "all" && user.tier !== "admin" && (
                        <button
                          onClick={() =>
                            changeUserTier(user._id, user.name, user.tier)
                          }
                          className="text-green-600 hover:text-green-800 text-sm text-left font-medium transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user._id, user.name)}
                        className="text-red-600 hover:text-red-800 text-sm text-left transition-colors"
                      >
                        Delete User
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Free Users</div>
          <div className="text-2xl font-bold">
            {users.filter((u) => !u.tier || u.tier === "free").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Paid Users</div>
          <div className="text-2xl font-bold">
            {
              users.filter(
                (u) => u.tier && u.tier !== "free" && u.tier !== "admin"
              ).length
            }
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Admins</div>
          <div className="text-2xl font-bold">
            {users.filter((u) => u.tier === "admin").length}
          </div>
        </div>
      </div>
    </div>
  );
}
