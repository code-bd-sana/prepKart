"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "react-toastify";

export default function CreateBlogPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "General",
    tags: "",
    published: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const tagsArray = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (res.ok) {
        toast.success("Blog post created successfully!");
        router.push(`/${locale}/admin/blog`);
      } else {
        toast.error(data.error || "Failed to create blog");
        console.error("API Error:", data);
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 ml-64">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Blog Post</h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-xl shadow p-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter blog title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Brief description of the blog post"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.excerpt.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              required
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your blog content here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="General">General</option>
                <option value="Recipes">Recipes</option>
                <option value="Cooking Tips">Cooking Tips</option>
                <option value="Meal Planning">Meal Planning</option>
                <option value="Nutrition">Nutrition</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="healthy, recipe, tips"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              className="h-4 w-4 text-green-600 rounded"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
            <label htmlFor="published" className="ml-2 text-sm text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/admin/blog`)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Blog Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
