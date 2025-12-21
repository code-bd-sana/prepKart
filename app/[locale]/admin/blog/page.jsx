"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";

export default function AdminBlogPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
        if (parsedUser.tier !== "tier3" && parsedUser.tier !== "admin") {
          router.push(`/${locale}`);
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        router.push(`/${locale}/login`);
      }
    };

    const loadBlogs = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");

        const res = await fetch("/api/admin/blog", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setBlogs(data.blogs || []);
        }
      } catch (error) {
        console.log("Failed to load blogs:", error);
      } finally {
        setLoading(false);
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
      console.log("Blogs API Response:", data);

      if (res.ok) {
        setBlogs(data.blogs || data || []);
      } else {
        console.error("Failed to load blogs:", data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
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
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Delete Response:", data);

      if (res.ok) {
        loadBlogs(); 
        toast.success("Blog deleted successfully!");
      } else {
        toast.error(data.error || "Failed to delete blog");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Network error. Please try again.");
    }
  };

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
    <div className="p-6 ml-64">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link
          href={`/${locale}/admin/blog/create`}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          + Create New Post
        </Link>
      </div>

      {blogs.length === 0 ? (
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
              {blogs.map((blog) => (
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
                      <Link
                        href={`/${locale}/admin/blog/${blog._id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
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
  );
}
