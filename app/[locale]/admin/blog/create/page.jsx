"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import { ArrowLeft, Upload, Link as LinkIcon, Globe, Tag, FolderOpen, CheckCircle } from "lucide-react";

export default function CreateBlogPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "General",
    tags: "",
    featuredImage: "",
    published: true,
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          tags: tagsArray,
          featuredImage: form.featuredImage,
          published: form.published,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          form.published
            ? "Blog published successfully!"
            : "Blog saved as draft!"
        );
        router.push(`/${locale}/admin/blog`);
      } else {
        toast.error(data.error || "Failed to save blog");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onloadend = async () => {
        const base64 = reader.result;

        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");
        const res = await fetch("/api/upload/cloudinary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ file: base64 }),
        });

        const data = await res.json();
        if (res.ok) {
          setForm({ ...form, featuredImage: data.url });
          toast.success("Image uploaded successfully!");
        } else {
          toast.error(data.error || "Image upload failed");
        }
        setImageUploading(false);
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
      setImageUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header with Back Button */}
      <div className="mb-6 sm:mb-8 max-w-6xl mx-auto">
        <button
          onClick={() => router.push(`/${locale}/admin/blog`)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4 sm:mb-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog Dashboard
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">Create New Blog Post</h1>
        <p className="text-gray-600 mt-1">Write and publish your blog content</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter blog title"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Brief description of the blog post"
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Keep it under 200 characters
              </p>
              <span className={`text-xs ${form.excerpt.length >= 190 ? 'text-red-500' : 'text-gray-500'}`}>
                {form.excerpt.length}/200
              </span>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y min-h-[200px] sm:min-h-[300px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your blog content here..."
            />
          </div>

          {/* Featured Image */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Featured Image
            </label>

            {/* Image Preview */}
            {form.featuredImage && (
              <div className="mb-4">
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={form.featuredImage}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 168px) 20vw, 20vw"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, featuredImage: "" })}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  Remove Image
                </button>
              </div>
            )}

            {/* Upload Options */}
            <div className="space-y-3">
              <div>
                <label className={`inline-flex items-center justify-center w-full px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors ${imageUploading ? 'opacity-50' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                    disabled={imageUploading}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-gray-700">
                      {imageUploading ? "Uploading..." : "Upload from device"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, max 5MB</p>
                  </div>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={form.featuredImage}
                  onChange={(e) =>
                    setForm({ ...form, featuredImage: e.target.value })
                  }
                  placeholder="Or paste image URL here..."
                />
              </div>
            </div>
          </div>

          {/* Category & Tags Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                Category
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="healthy, recipe, tips"
              />
              <p className="text-xs text-gray-500 mt-2">
                Separate with commas
              </p>
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <input
              type="checkbox"
              id="published"
              className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
            <label htmlFor="published" className="ml-3 flex items-center">
              <div>
                <p className="font-medium text-gray-900">Publish immediately</p>
                <p className="text-sm text-gray-600">
                  {form.published ? "Post will be live immediately" : "Save as draft"}
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/admin/blog`)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium w-full sm:w-auto flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Blog Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}