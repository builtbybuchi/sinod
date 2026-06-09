import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookOpen, 
  Clock, 
  ArrowRight,
  Search,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../../data/blogPosts';

gsap.registerPlugin(ScrollTrigger);

const categories = ['All', 'Company', 'Community', 'Events', 'Technology'];

export function BlogListPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.animate-section').forEach((section) => {
        gsap.fromTo(section,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => post.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-sinod-base pt-20" ref={sectionRef}>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-sinod-violet/20 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sinod-cyan/10 border border-sinod-cyan/20 mb-6">
              <BookOpen className="w-4 h-4 text-sinod-cyan" />
              <span className="text-sm font-medium text-sinod-cyan">Blog</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Insights & <span className="text-gradient">Stories</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto mb-10">
              Thoughts on community building, product updates, and the journey of creating 
              a platform that puts people first.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sinod-text-secondary" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass-input text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-sinod-cyan text-white'
                    : 'bg-white/5 text-sinod-text-secondary hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && activeCategory === 'All' && !searchQuery && (
        <section className="py-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="animate-section">
              <span className="text-sm text-sinod-cyan font-medium mb-4 block">Featured</span>
              <Link 
                to={`/blog/${featuredPost.id}`}
                className="glass-card-strong overflow-hidden block group"
              >
                <div className="grid lg:grid-cols-2">
                  <div className="h-64 lg:h-auto bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-2xl bg-white/10 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-sinod-cyan" />
                    </div>
                  </div>
                  <div className="p-8 lg:p-12">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 rounded-full bg-sinod-cyan/10 text-sinod-cyan text-sm">
                        {featuredPost.category}
                      </span>
                      <span className="text-sinod-text-secondary text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <h2 className="font-heading text-2xl lg:text-3xl font-semibold text-sinod-text mb-4 group-hover:text-sinod-cyan transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sinod-text-secondary mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                        <span className="text-sinod-cyan font-medium text-sm">
                          {featuredPost.author.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sinod-text text-sm font-medium">{featuredPost.author.name}</p>
                        <p className="text-sinod-text-secondary text-xs">{featuredPost.author.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-16 lg:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section">
            <h2 className="font-heading text-2xl font-semibold text-sinod-text mb-8">
              {searchQuery ? 'Search Results' : 'Latest Articles'}
            </h2>
            
            {filteredPosts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(searchQuery ? filteredPosts : regularPosts).map((post) => (
                  <Link 
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="feature-card group flex flex-col"
                  >
                    <div className="h-48 bg-gradient-to-br from-sinod-cyan/10 to-sinod-violet/10 rounded-xl mb-6 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-sinod-cyan/50" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded-full bg-sinod-cyan/10 text-sinod-cyan text-xs">
                        {post.category}
                      </span>
                      <span className="text-sinod-text-secondary text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2 group-hover:text-sinod-cyan transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sinod-text-secondary text-sm mb-4 line-clamp-2 flex-grow">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                          <span className="text-sinod-cyan font-medium text-xs">
                            {post.author.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sinod-text-secondary text-xs">{post.author.name}</span>
                      </div>
                      <span className="text-sinod-text-secondary text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-sinod-text-secondary mx-auto mb-4" />
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-2">
                  No articles found
                </h3>
                <p className="text-sinod-text-secondary">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Stay Updated
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Subscribe to our newsletter for the latest articles, product updates, and community insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 glass-input"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
