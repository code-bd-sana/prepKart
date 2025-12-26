"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Eye, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const locale = params?.locale || 'en';

  // Fetch blogs initially
  useEffect(() => {
    fetchAllBlogs();
  }, []);

  // Filter blogs based on search and category
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = searchTerm === '' || 
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const fetchAllBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blog`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBlogs(data.blogs || []);
          const blogCategories = data.blogs?.map(blog => blog.category).filter(Boolean) || [];
          const uniqueCategories = [...new Set(blogCategories)];
          setCategories(["All", ...uniqueCategories]);
        }
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      setCategories(["All"]);
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Elegant gradient backgrounds for cards
  const getCardBackground = (category, index) => {
    const gradients = [
      'from-green-50 to-emerald-50',
      'from-blue-50 to-cyan-50',
      'from-purple-50 to-violet-50',
      'from-amber-50 to-orange-50',
      'from-rose-50 to-pink-50',
      'from-indigo-50 to-blue-50'
    ];
    
    const colors = {
      'General': gradients[0],
      'Recipes': gradients[1],
      'Cooking Tips': gradients[2],
      'Meal Planning': gradients[3],
      'Nutrition': gradients[4],
      'Technology': gradients[5]
    };
    
    return colors[category] || gradients[index % gradients.length];
  };

  // Get category color for badges
  const getCategoryColor = (category) => {
    const colors = {
      'General': 'bg-green-100 text-green-800',
      'Recipes': 'bg-blue-100 text-blue-800',
      'Cooking Tips': 'bg-purple-100 text-purple-800',
      'Meal Planning': 'bg-amber-100 text-amber-800',
      'Nutrition': 'bg-rose-100 text-rose-800',
      'Technology': 'bg-indigo-100 text-indigo-800'
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Calculate read time
  const calculateReadTime = (content) => {
    if (!content) return '2 min read';
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
        <header className="bg-white">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
              <p className="text-gray-600 mt-2">Discover insights and stories</p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-green-500 mb-4"></div>
            <p className="text-gray-600">Loading Prepcart blogs...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto bg-linear-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50">
        <div className=" px-4 md:px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        {filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filteredBlogs.map((blog, index) => (
              <article
                key={blog._id}
                className="group cursor-pointer"
              >
                <Link href={`/${locale}/blog/${blog.slug}`}>
                  <div className={`bg-linear-to-br ${getCardBackground(blog.category, index)} rounded-2xl p-6 h-full border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                    
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(blog.category)}`}>
                        {blog.category || 'General'}
                      </span>
                      <BookOpen className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-700 transition-colors">
                      {blog.title}
                    </h2>
                    
                    {/* Excerpt */}
                    <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed">
                      {blog.excerpt || 'Read this insightful article...'}
                    </p>
                    
                    {/* Meta Info - Minimal */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {calculateReadTime(blog.content)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {blog.views || 0}
                      </span>
                    </div>
                    
                    {/* Tags - Minimal */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {blog.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-white/50 text-gray-600 text-xs rounded-lg border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Read More - Elegant Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                      <span className="text-green-600 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        Read article
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-linear-to-br from-green-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || selectedCategory !== 'All' 
                ? 'No matching articles' 
                : 'No articles yet'
              }
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'All'
                ? 'Try a different search term or category'
                : 'Check back soon for new insights and stories'
              }
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      {/* <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Stay Updated</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get the latest articles and insights delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
              />
              <button className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-8">
              © {new Date().getFullYear()} Blog. All rights reserved.
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}