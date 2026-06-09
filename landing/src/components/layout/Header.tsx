import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  Mail, 
  ClipboardList, 
  Award, 
  Sparkles, 
  FormInput,
  ChevronDown,
  Menu,
  X,
  BookOpen,
  // Shield,
  HelpCircle,
  Users,
  Briefcase,
  Send,
  Image,
  Newspaper
} from 'lucide-react';

const productLinks = [
  { name: 'Events', path: '/products/events', icon: Calendar, description: 'Plan and manage community events' },
  { name: 'Forms', path: '/products/forms', icon: FormInput, description: 'Build smart forms with logic' },
  { name: 'Documents', path: '/products/documents', icon: FileText, description: 'Create and share knowledge' },
  { name: 'Newsletter', path: '/products/newsletter', icon: Mail, description: 'Send personalized updates' },
  { name: 'Quizzes', path: '/products/quizzes', icon: ClipboardList, description: 'Engage and measure learning' },
  { name: 'Certificates', path: '/products/certificates', icon: Award, description: 'Issue verified credentials' },
  { name: 'AI Assistant', path: '/products/ai-assistant', icon: Sparkles, description: 'Your intelligent teammate' },
];

const exploreLinks = [
  { name: 'Explore Events', path: '/explore/events', description: 'Discover upcoming events' },
  { name: 'Explore Quizzes', path: '/explore/quizzes', description: 'Test your knowledge' },
];

const resourceLinks = [
  { name: 'Features', path: '/resources/features', icon: BookOpen, description: 'Platform capabilities' },
  // { name: 'Security', path: '/resources/security', icon: Shield, description: 'How we protect your data' },
  { name: 'Support', path: '/resources/support', icon: HelpCircle, description: 'Get help when you need it' },
  { name: 'FAQ', path: '/resources/faq', icon: BookOpen, description: 'Answers to common questions' },
];

const companyLinks = [
  { name: 'About', path: '/company/about', icon: Users, description: 'Our story and mission' },
  { name: 'Careers', path: '/company/careers', icon: Briefcase, description: 'Join our team' },
  { name: 'Contact', path: '/company/contact', icon: Send, description: 'Get in touch' },
  { name: 'Media Kit', path: '/company/media-kit', icon: Image, description: 'Brand resources' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const isActive = (path: string) => location.pathname === path;
  const isActiveSection = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'nav-glass' : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854019/3_jy0mnr.png" 
              alt="Sinod'" 
              className="w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-heading text-xl lg:text-2xl font-semibold text-sinod-text tracking-tight">
              Sinod'
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Products Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('products')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActiveSection('/products') 
                    ? 'text-sinod-cyan' 
                    : 'text-sinod-text-secondary hover:text-sinod-text'
                }`}
              >
                Products
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'products' && (
                <div className="absolute top-full left-0 pt-2 w-80">
                  <div className="glass-card-strong p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {productLinks.map((product) => (
                      <Link
                        key={product.path}
                        to={product.path}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                          isActive(product.path) 
                            ? 'bg-sinod-cyan/10 border border-sinod-cyan/20' 
                            : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="product-icon w-10 h-10 flex-shrink-0">
                          <product.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sinod-text text-sm">{product.name}</p>
                          <p className="text-xs text-sinod-text-secondary mt-0.5">{product.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Explore Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('explore')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActiveSection('/explore') 
                    ? 'text-sinod-cyan' 
                    : 'text-sinod-text-secondary hover:text-sinod-text'
                }`}
              >
                Explore
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'explore' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'explore' && (
                <div className="absolute top-full left-0 pt-2 w-56">
                  <div className="glass-card-strong p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {exploreLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`block p-3 rounded-xl transition-all duration-200 ${
                          isActive(link.path) 
                            ? 'bg-sinod-cyan/10 border border-sinod-cyan/20' 
                            : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <p className="font-medium text-sinod-text text-sm">{link.name}</p>
                        <p className="text-xs text-sinod-text-secondary mt-0.5">{link.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link 
              to="/pricing" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/pricing') 
                  ? 'text-sinod-cyan' 
                  : 'text-sinod-text-secondary hover:text-sinod-text'
              }`}
            >
              Pricing
            </Link>

          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link 
              to="/blog" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActiveSection('/blog') 
                  ? 'text-sinod-cyan' 
                  : 'text-sinod-text-secondary hover:text-sinod-text'
              }`}
            >
              Blog
            </Link>
            <a href="https://my.sinod.app/signin" className="px-4 py-2 text-sm font-medium text-sinod-text-secondary hover:text-sinod-text transition-colors">
              Sign in
            </a>
            <a href="https://my.sinod.app/signup" className="btn-primary text-sm">
              Sign up
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 rounded-lg text-sinod-text hover:bg-white/[0.06] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden nav-glass border-t border-white/[0.06]">
          <div className="px-4 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-sinod-text-secondary px-2">Products</p>
              {productLinks.map((product) => (
                <Link
                  key={product.path}
                  to={product.path}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <product.icon className="w-5 h-5 text-sinod-cyan" />
                  <span className="text-sinod-text">{product.name}</span>
                </Link>
              ))}
            </div>
            
            <div className="space-y-2 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-sinod-text-secondary px-2">Explore</p>
              {exploreLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors text-sinod-text"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-white/[0.06]">
              <Link to="/pricing" className="block px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors text-sinod-text">Pricing</Link>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-sinod-text-secondary px-2">Resources</p>
              {resourceLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <link.icon className="w-5 h-5 text-sinod-cyan" />
                  <span className="text-sinod-text">{link.name}</span>
                </Link>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-sinod-text-secondary px-2">Company</p>
              {companyLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <link.icon className="w-5 h-5 text-sinod-cyan" />
                  <span className="text-sinod-text">{link.name}</span>
                </Link>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-white/[0.06]">
              <Link to="/blog" className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors">
                <BookOpen className="w-5 h-5 text-sinod-cyan" />
                <span className="text-sinod-text">Blog</span>
              </Link>
              <Link to="/news" className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-white/[0.06] transition-colors">
                <Newspaper className="w-5 h-5 text-sinod-cyan" />
                <span className="text-sinod-text">News</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <a href="https://my.sinod.app/signin" className="w-full py-3 text-sinod-text font-medium hover:bg-white/[0.06] rounded-lg transition-colors block text-center">
                Sign in
              </a>
              <a href="https://my.sinod.app/signup" className="w-full btn-primary block text-center">
                Sign up
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
