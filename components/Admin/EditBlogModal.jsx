"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function EditBlogModal({ blog, isOpen, onClose, onSave }) {
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

  useEffect(() => {
    if (blog) {
      setForm({
        title: blog.title || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
        category: blog.category || "General",
        tags: blog.tags ? blog.tags.join(", ") : "",
        featuredImage: blog.featuredImage || "",
        published: blog.published || false,
      });
    }
  }, [blog]);

  // Add this useEffect after the other useEffect
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      // Check if click is on the backdrop (not modal content)
      if (e.target.classList.contains("modal-backdrop")) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("click", handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);
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

      const res = await fetch(`/api/admin/blog/${blog._id}`, {
        method: "PUT",
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

      if (res.ok) {
        toast.success("Blog updated successfully!");
        onSave(data.blog);
        onClose();
      } else {
        toast.error(data.error || "Failed to update blog");
      }
    } catch (error) {
      console.error("Update error:", error);
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
      // Convert to base64
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Edit Blog Post</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image
              </label>

              {/* Image Preview */}
              {form.featuredImage && (
                <div className="mb-4">
                  <Image
                  height={100}
                  width={100}
                    src={form.featuredImage}
                    alt="Preview"
                    className="max-h-64 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, featuredImage: "" })}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center space-x-4">
                <label
                  className={`cursor-pointer px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 ${
                    imageUploading ? "opacity-50" : ""
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                    disabled={imageUploading}
                    className="hidden"
                  />
                  {imageUploading ? "Uploading..." : "Upload Image from Device"}
                </label>

                <span className="text-sm text-gray-500">or</span>

                <input
                  type="url"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  value={form.featuredImage}
                  onChange={(e) =>
                    setForm({ ...form, featuredImage: e.target.value })
                  }
                  placeholder="Or paste image URL directly..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload an image (JPG, PNG, max 5MB) or paste a URL
              </p>
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
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
