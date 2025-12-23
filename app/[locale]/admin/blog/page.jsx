"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import EditBlogModal from "@/components/Admin/EditBlogModal";
import { toast } from "react-toastify";
import { Plus, Search, Edit, Eye, Trash2, Calendar, FileText } from "lucide-react";

export default function AdminBlogPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      try {
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

        setUser(parsedUser);
      } catch (error) {
        router.push(`/${locale}/login`);
      }
    };

    checkAuth();
    loadBlogs();
  }, [router, locale]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch("/api/admin/blog", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        setBlogs(data.blogs || []);
      } else {
        console.error("Failed to load blogs:", data.error);
        toast.error(data.error || "Failed to load blogs");
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`/api/admin/blog/${blogId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Blog deleted successfully!");
        loadBlogs();
      } else {
        toast.error(data.error || "Failed to delete blog");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  const handleEditClick = async (blogId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`/api/admin/blog/${blogId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEditingBlog(data.blog);
        setIsModalOpen(true);
      } else {
        toast.error("Failed to load blog for editing");
      }
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const handleSaveSuccess = (updatedBlog) => {
    setBlogs(
      blogs.map((blog) => (blog._id === updatedBlog._id ? updatedBlog : blog))
    );
    toast.success("Blog updated successfully!");
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Blog Posts</h1>
          <div className="w-full sm:w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 sm:h-20 bg-white border border-gray-200 animate-pulse rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Blog Posts</h1>
          <Link
            href={`/${locale}/admin/blog/create`}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create New Post</span>
            <span className="sm:hidden">New Post</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
            />
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4 text-lg">No blog posts yet</p>
            <Link
              href={`/${locale}/admin/blog/create`}
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create your first blog post
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{blog.title}</div>
                        <div className="text-sm text-gray-500">{blog.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            blog.published
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {blog.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditClick(blog._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <Link
                            href={`/${locale}/blog/${blog.slug}`}
                            target="_blank"
                            className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => deleteBlog(blog._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{blog.slug}</p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        blog.published
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {blog.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEditClick(blog._id)}
                      className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <Link
                      href={`/${locale}/blog/${blog.slug}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <button
                      onClick={() => deleteBlog(blog._id)}
                      className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <EditBlogModal
        blog={editingBlog}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBlog(null);
        }}
        onSave={handleSaveSuccess}
      />
    </>
  );
}