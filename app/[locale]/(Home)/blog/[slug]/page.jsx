"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Tag, ArrowLeft, Share2, Bookmark, Eye, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function BlogDetailPage({ params }) {
  const { locale, slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/${slug}`);
        const data = await res.json();

        if (res.ok) {
          setBlog(data.blog);
        } else {
          setError(data.error || "Blog not found");
        }
      } catch (err) {
        setError("Failed to load blog");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Main content skeleton */}
            <div className="lg:col-span-2">
              <div className="animate-pulse">
                <div className="h-10 w-64 bg-gray-200 rounded-lg mb-8"></div>
                <div className="h-[500px] bg-gray-200 rounded-2xl mb-8"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right column - Sidebar skeleton */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded-lg mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6 text-gray-300">📄</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            {error || "Article Not Found"}
          </h2>
          <p className="text-gray-500 mb-8">
            This blog post might have been moved or deleted.
          </p>
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse All Articles
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  const getBlogImage = () => {
    if (blog.featuredImage) return blog.featuredImage;
    return "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop&auto=format";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Articles
            </Link>
            
            <div className="flex items-center gap-4">
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                {blog.category || "General"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content  */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Main Article Content */}
          <div className="lg:col-span-2">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(blog.content)} read</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>{blog.views || 0} views</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  {blog.excerpt}
                </p>
              )}
            </div>

            {/* Featured Image */}
            {blog.featuredImage && (
              <div className="mb-10">
                <div className="relative h-[500px] rounded-2xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
                  <Image
                    src={getBlogImage()}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Article Content */}
            <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10">
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-800 leading-relaxed text-base">
                  {blog.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-6 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </article>

            {/* Tags Section */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {blog.tags.map((tag, index) => (
                    <a
                      key={index}
                      href="#"
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Share & Actions */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Found this helpful? Share it with others
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: blog.title,
                          text: blog.excerpt,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Article
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="md:col-span-1 md:mt-48">
            <div className="sticky top-8 space-y-8">
              {/* Reading Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Read Time</span>
                    <span className="font-medium text-gray-900">{calculateReadTime(blog.content)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Word Count</span>
                    <span className="font-medium text-gray-900">{blog.content.split(/\s+/).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Published</span>
                    <span className="font-medium text-gray-900">{formatDate(blog.publishedAt || blog.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Views</span>
                    <span className="font-medium text-gray-900">{blog.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Category Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">
                      {blog.category?.charAt(0) || "G"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{blog.category || "General"}</h4>
                    <p className="text-sm text-gray-500">Article category</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href={`/${locale}/blog`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Browse More Articles
                  </Link>
                </div>
              </div>

              {/* Author Info (if available) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About PrepKart</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  PrepKart is dedicated to providing quality content on cooking, recipes, and nutrition. 
                  Our articles are crafted to help you improve your culinary skills and knowledge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-2 md:px-2 py-2">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Last updated {formatDate(blog.updatedAt || blog.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}