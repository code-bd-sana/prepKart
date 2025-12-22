"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import EditBlogModal from "@/components/Admin/EditBlogModal";
import { toast } from "react-toastify";

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
  // fetch blogs
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
  // delete blog
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
      console.log("Delete failed:", error);
      toast.error("Network error. Please try again.");
    }
  };
  // edit blog
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
  // save after edit
  const handleSaveSuccess = (updatedBlog) => {
    setBlogs(
      blogs.map((blog) => (blog._id === updatedBlog._id ? updatedBlog : blog))
    );
    toast.success("Blog updated successfully!");
  };
  // filter
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 ">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <div className="w-32 h-10 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 animate-pulse rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 ml-64">
        <div className="flex justify-between items-center mb-6">
          <div className="flex justify-start items-center gap-x-3">
            <h1 className="text-2xl font-bold">Blog Posts</h1>
          <div className="">
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
          </div>
          <Link
            href={`/${locale}/admin/blog/create`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            + Create New Post
          </Link>
        </div>
        

        {filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No blog posts yet</p>
            <Link
              href={`/${locale}/admin/blog/create`}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Create your first blog post
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{blog.title}</div>
                      <div className="text-sm text-gray-500">{blog.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          blog.published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(blog._id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/${locale}/blog/${blog.slug}`}
                          target="_blank"
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteBlog(blog._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
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
