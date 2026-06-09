import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  Mail, 
  ClipboardList, 
  Award, 
  Sparkles, 
  FormInput,
  Shield,
  BadgeCheck,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  ArrowRight,
  Check,
  BookOpen,
  HelpCircle,
  Users,
  Briefcase,
  Send,
  Image,
  Newspaper
} from 'lucide-react';

const productLinks = [
  { name: 'Events', path: '/products/events', icon: Calendar },
  { name: 'Forms', path: '/products/forms', icon: FormInput },
  { name: 'Documents', path: '/products/documents', icon: FileText },
  { name: 'Newsletter', path: '/products/newsletter', icon: Mail },
  { name: 'Quizzes', path: '/products/quizzes', icon: ClipboardList },
  { name: 'Certificates', path: '/products/certificates', icon: Award },
  { name: 'AI Assistant', path: '/products/ai-assistant', icon: Sparkles },
];

const resourceLinks = [
  { name: 'Features', path: '/resources/features', icon: BookOpen },
  { name: 'Pricing', path: '/pricing', icon: Check },
  // { name: 'Security', path: '/resources/security', icon: Shield },
  { name: 'Support', path: '/resources/support', icon: HelpCircle },
  { name: 'FAQ', path: '/resources/faq', icon: HelpCircle },
];

const companyLinks = [
  { name: 'About', path: '/company/about', icon: Users },
  { name: 'Careers', path: '/company/careers', icon: Briefcase },
  { name: 'Contact', path: '/company/contact', icon: Send },
  { name: 'Media Kit', path: '/company/media-kit', icon: Image },
];

const contentLinks = [
  { name: 'Blog', path: '/blog', icon: BookOpen },
  { name: 'News', path: '/news', icon: Newspaper },
];

const legalLinks = [
  { name: 'Privacy Policy', path: '/legal/privacy' },
  { name: 'Terms of Service', path: '/legal/terms' },
  { name: 'Cookie Policy', path: '/legal/cookies' },
  { name: 'User Agreement', path: '/legal/agreement' },
  { name: 'BuyerTrust', path: '/legal/buyertrust' },
  { name: 'Refund Policy', path: '/legal/refunds' },
  { name: 'BestPrice', path: '/legal/bestprice' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [certNumber, setCertNumber] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Verifying certificate: ${certNumber}`);
  };

  return (
    <footer className="relative bg-sinod-base border-t border-white/[0.06]">
      {/* CTA Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-16 lg:py-24">
        <div className="glass-card-strong max-w-4xl mx-auto text-center p-8 lg:p-12">
          <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-sinod-text mb-4">
            Ready to Stop Paying for Tools You Barely Use?
          </h2>
          <p className="text-sinod-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Get started today and experience a platform that puts you first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://my.sinod.app/signup" className="btn-primary">
              Sign Up Free
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </a>
            <a href="https://my.sinod.app/signin" className="btn-secondary">
              Sign In
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-12 lg:py-16 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/logo-mark.png" 
                alt="Sinod'" 
                className="w-10 h-10 transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-heading text-2xl font-semibold text-sinod-text tracking-tight">
                Sinod'
              </span>
            </Link>
            <p className="text-sinod-text-secondary text-sm leading-relaxed">
              One workspace for your community. Events, forms, docs, newsletters, quizzes, certificates, and AI—connected.
            </p>
            
            {/* Newsletter Subscription */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-sinod-text">Subscribe for launch updates</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="glass-input flex-1 text-sm"
                />
                <button 
                  type="submit"
                  className="px-4 py-3 rounded-xl bg-sinod-cyan text-sinod-base font-medium hover:opacity-90 transition-opacity"
                >
                  {isSubscribed ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
              {isSubscribed && (
                <p className="text-sinod-cyan text-sm animate-in fade-in">Thanks for subscribing!</p>
              )}
            </div>

            {/* Certificate Verification */}
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-sinod-text flex items-center gap-2">
                <Award className="w-4 h-4 text-sinod-cyan" />
                Verify Certificate
              </p>
              <form onSubmit={handleVerify} className="flex gap-2">
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="Certificate number"
                  className="glass-input flex-1 text-sm"
                />
                <button 
                  type="submit"
                  className="px-4 py-3 rounded-xl border border-white/[0.15] text-sinod-text text-sm font-medium hover:bg-white/[0.06] transition-colors"
                >
                  Verify
                </button>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Shield className="w-4 h-4 text-sinod-cyan" />
                <span className="text-xs text-sinod-text-secondary">BuyerTrust</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <BadgeCheck className="w-4 h-4 text-sinod-cyan" />
                <span className="text-xs text-sinod-text-secondary">BestPrice</span>
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-sm font-semibold text-sinod-text uppercase tracking-wider mb-4">
              Products
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-sinod-text-secondary hover:text-sinod-text transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-sm font-semibold text-sinod-text uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-sm text-sinod-text-secondary hover:text-sinod-text transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-sm font-semibold text-sinod-text uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-sm text-sinod-text-secondary hover:text-sinod-text transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-heading text-sm font-semibold text-sinod-text uppercase tracking-wider mb-4 mt-8">
              Content
            </h3>
            <ul className="space-y-3">
              {contentLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-sm text-sinod-text-secondary hover:text-sinod-text transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-sm font-semibold text-sinod-text uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-sinod-text-secondary hover:text-sinod-text transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 border-t border-white/[0.06]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sinod-text-secondary">
            © 2026 Sinod'. Tools for everyone. Not for subscription margins.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sinod-text-secondary hover:text-sinod-cyan transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-sinod-text-secondary hover:text-sinod-cyan transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-sinod-text-secondary hover:text-sinod-cyan transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-sinod-text-secondary hover:text-sinod-cyan transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
