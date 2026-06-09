import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowLeft, 
  Clock, 
  Calendar,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  BookOpen,
  Newspaper,
  ChevronRight
} from 'lucide-react';
import { getPostById, getRelatedPosts } from '../../data/blogPosts';

gsap.registerPlugin(ScrollTrigger);

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function extractTOC(content: string): TOCItem[] {
  const lines = content.split('\n');
  const toc: TOCItem[] = [];
  
  lines.forEach((line) => {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      toc.push({ id, text, level });
    }
  });
  
  return toc;
}

function renderContent(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      // H2 headings
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<h2 id="${id}" class="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mt-12 mb-6">${text}</h2>`;
      }
      // H3 headings
      if (line.startsWith('### ')) {
        const text = line.replace('### ', '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<h3 id="${id}" class="font-heading text-xl sm:text-2xl font-semibold text-sinod-text mt-8 mb-4">${text}</h3>`;
      }
      // Empty lines
      if (line.trim() === '') {
        return '';
      }
      // Regular paragraphs
      return `<p class="text-sinod-text-secondary leading-relaxed mb-4">${line}</p>`;
    })
    .join('\n');
}

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const isNews = location.pathname.startsWith('/news');
  const post = id ? getPostById(id, isNews ? 'news' : 'blog') : undefined;
  const relatedPosts = id ? getRelatedPosts(id, isNews ? 'news' : 'blog', 3) : [];
  
  const toc = post ? extractTOC(post.content) : [];

  useEffect(() => {
    if (!post) return;
    
    const ctx = gsap.context(() => {
      // Animate content sections
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

      // Track active section for TOC
      toc.forEach((item) => {
        ScrollTrigger.create({
          trigger: `#${item.id}`,
          start: 'top 30%',
          end: 'bottom 30%',
          onEnter: () => setActiveSection(item.id),
          onEnterBack: () => setActiveSection(item.id),
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [post, toc]);

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const text = post?.title || '';
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-sinod-base pt-32 pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
            {isNews ? <Newspaper className="w-10 h-10 text-sinod-cyan" /> : <BookOpen className="w-10 h-10 text-sinod-cyan" />}
          </div>
          <h1 className="font-heading text-3xl font-semibold text-sinod-text mb-4">
            Article Not Found
          </h1>
          <p className="text-sinod-text-secondary mb-8">
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Link to={isNews ? '/news' : '/blog'} className="btn-primary">
            <ArrowLeft className="w-5 h-5 inline-block mr-2" />
            Back to {isNews ? 'News' : 'Blog'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sinod-base pt-20" ref={sectionRef}>
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 gradient-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sinod-cyan/10 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section max-w-4xl mx-auto">
            <Link 
              to={isNews ? '/news' : '/blog'}
              className="inline-flex items-center gap-2 text-sinod-text-secondary hover:text-sinod-cyan transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {isNews ? 'News' : 'Blog'}
            </Link>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 rounded-full bg-sinod-cyan/10 text-sinod-cyan text-sm">
                {post.category}
              </span>
              <span className="text-sinod-text-secondary text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
            
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-6">
              {post.title}
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                  <span className="text-sinod-cyan font-medium">
                    {post.author.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sinod-text font-medium">{post.author.name}</p>
                  <p className="text-sinod-text-secondary text-sm">{post.author.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sinod-text-secondary text-sm">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 lg:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-12">
              {/* Table of Contents - Desktop */}
              {toc.length > 0 && (
                <div className="hidden lg:block">
                  <div className="sticky top-24">
                    <h3 className="font-heading text-sm font-semibold text-sinod-text mb-4 uppercase tracking-wider">
                      Table of Contents
                    </h3>
                    <nav className="space-y-2">
                      {toc.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`block text-left text-sm transition-colors ${
                            item.level === 3 ? 'pl-4' : ''
                          } ${
                            activeSection === item.id
                              ? 'text-sinod-cyan'
                              : 'text-sinod-text-secondary hover:text-sinod-text'
                          }`}
                        >
                          {item.text}
                        </button>
                      ))}
                    </nav>

                    {/* Share Buttons */}
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <h3 className="font-heading text-sm font-semibold text-sinod-text mb-4 uppercase tracking-wider">
                        Share
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleShare('twitter')}
                          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                        >
                          <Twitter className="w-5 h-5 text-sinod-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleShare('linkedin')}
                          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                        >
                          <Linkedin className="w-5 h-5 text-sinod-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleShare('copy')}
                          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                        >
                          <LinkIcon className={`w-5 h-5 ${copied ? 'text-green-400' : 'text-sinod-text-secondary'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className={`${toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                <article 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
                />

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/5 text-sinod-text-secondary text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mobile Share */}
                <div className="lg:hidden mt-8 pt-8 border-t border-white/10">
                  <h3 className="font-heading text-sm font-semibold text-sinod-text mb-4 uppercase tracking-wider">
                    Share
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-sinod-text-secondary" />
                    </button>
                    <button 
                      onClick={() => handleShare('linkedin')}
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-sinod-text-secondary" />
                    </button>
                    <button 
                      onClick={() => handleShare('copy')}
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                    >
                      <LinkIcon className={`w-5 h-5 ${copied ? 'text-green-400' : 'text-sinod-text-secondary'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-24 lg:py-32 gradient-mesh">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="animate-section max-w-6xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-8">
                Related {isNews ? 'News' : 'Articles'}
              </h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link 
                    key={relatedPost.id}
                    to={`/${isNews ? 'news' : 'blog'}/${relatedPost.id}`}
                    className="feature-card group"
                  >
                    <div className="h-40 bg-gradient-to-br from-sinod-cyan/10 to-sinod-violet/10 rounded-xl mb-4 flex items-center justify-center">
                      {isNews ? (
                        <Newspaper className="w-10 h-10 text-sinod-cyan/50" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-sinod-cyan/50" />
                      )}
                    </div>
                    
                    <span className="px-2 py-1 rounded-full bg-sinod-cyan/10 text-sinod-cyan text-xs mb-2 inline-block">
                      {relatedPost.category}
                    </span>
                    
                    <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2 group-hover:text-sinod-cyan transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sinod-text-secondary text-xs">
                      <Clock className="w-3 h-3" />
                      {relatedPost.readTime}
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Enjoyed This {isNews ? 'Update' : 'Article'}?
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Subscribe to our newsletter for more {isNews ? 'updates' : 'insights'} delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 glass-input"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
