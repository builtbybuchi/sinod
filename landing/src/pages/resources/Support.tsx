import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  MessageSquare, 
  Mail, 
  BookOpen, 
  Clock,
  Users,
  ArrowRight,
  Search,
  FileText,
  Play,
  Headphones,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const supportChannels = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get a response within 48 hours from our dedicated support team.',
    availability: '24/7',
    responseTime: '< 48 hours'
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'AI assistance for urgent issues and quick questions. Chats are forwarded to our support team if further help is needed.',
    availability: '24/7',
    responseTime: 'Instant'
  },
  {
    icon: Users,
    title: 'Community Forum',
    description: 'Connect with other users, share tips, and get peer support.',
    availability: '24/7',
    responseTime: 'Community-driven'
  }
];

const helpCategories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    articles: ['Quick start guide', 'Setting up your workspace', 'Inviting team members', 'Importing data']
  },
  {
    icon: FileText,
    title: 'Product Guides',
    articles: ['Events management', 'Form builder', 'Document collaboration', 'Newsletter campaigns']
  },
  {
    icon: Play,
    title: 'Video Tutorials',
    articles: ['Platform overview', 'Advanced features', 'Integrations setup', 'Best practices']
  },
  {
    icon: Headphones,
    title: 'Troubleshooting',
    articles: ['Common issues', 'Error messages', 'Performance tips', 'Browser compatibility']
  }
];

const quickLinks = [
  { title: 'Documentation', description: 'Comprehensive guides for every feature', href: '#' },
  { title: 'API Reference', description: 'Technical documentation for developers', href: '#' },
  { title: 'Status Page', description: 'Check system status and incidents', href: '#' },
  { title: 'Release Notes', description: 'Latest updates and new features', href: '#' }
];

export function SupportPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-sinod-base pt-20" ref={sectionRef}>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-sinod-violet/20 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section text-center max-w-4xl mx-auto">
                       
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              How Can We <span className="text-gradient">Help You?</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto mb-10">
              We're here to help you get the most out of Sinod'. Search our knowledge base 
              or reach out to our support team.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sinod-text-secondary" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass-input text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Get in Touch
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Choose the support channel that works best for you.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportChannels.map((channel) => (
              <div key={channel.title} className="glass-card-strong p-8 text-center">
                <div className="product-icon w-16 h-16 mx-auto mb-6">
                  <channel.icon className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-3">
                  {channel.title}
                </h3>
                <p className="text-sinod-text-secondary mb-6">
                  {channel.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-sinod-cyan" />
                    <span className="text-sinod-text-secondary">{channel.availability}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sinod-cyan" />
                    <span className="text-sinod-text-secondary">{channel.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Browse by Topic
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Find answers organized by category.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 gap-6">
            {helpCategories.map((category) => (
              <div key={category.title} className="glass-card-strong p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="product-icon w-12 h-12">
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-sinod-text">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {category.articles.map((article) => (
                    <li key={article}>
                      <a 
                        href="#"
                        className="flex items-center gap-2 text-sinod-text-secondary hover:text-sinod-cyan transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Quick Links
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <a 
                key={link.title}
                href={link.href}
                className="feature-card text-center group"
              >
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2 group-hover:text-sinod-cyan transition-colors">
                  {link.title}
                </h3>
                <p className="text-sinod-text-secondary text-sm">
                  {link.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Still Have Questions?
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Check out our comprehensive FAQ section for answers to common questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/resources/faq" className="btn-primary">
                View FAQ
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </Link>
              <a href="mailto:contact@sinod.app" className="btn-secondary">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
