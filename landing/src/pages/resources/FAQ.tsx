import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search,
  ChevronDown,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const faqCategories = [
  {
    name: 'General',
    faqs: [
      {
        question: 'What is Sinod\'?',
        answer: 'Sinod\' is a unified community management platform that brings together events, forms, documents, newsletters, quizzes, certificates, and an AI assistant in one workspace. Unlike other platforms, we don\'t charge monthly subscriptions—you only pay for what you use.'
      },
      {
        question: 'When will Sinod\' launch?',
        answer: 'Our public launch is scheduled for March 31, 2026. We\'re currently in the final testing phase, stress-testing the platform with millions of concurrent operations to ensure reliability.'
      },
      {
        question: 'Is there a free plan?',
        answer: 'Yes! Most features are completely free with no limits. This includes unlimited events, forms, documents, and quizzes. You only pay for email sending, certificates, AI requests, and paid event processing.'
      },
      {
        question: 'Can I try Sinod\' before the launch?',
        answer: 'Sign up for a free account to get early access. We\'re inviting users to beta test the platform and provide feedback before the public launch.'
      }
    ]
  },
  {
    name: 'Pricing',
    faqs: [
      {
        question: 'How does the pay-per-use model work?',
        answer: 'Instead of monthly subscriptions, you only pay for specific usage: $0.99 per 1,000 emails sent, $0.50 per 100 certificates issued, $1.99 per 1,000 AI requests, and a 5% fee on paid event transactions. Everything else is free.'
      },
      {
        question: 'Are there any hidden fees?',
        answer: 'Absolutely not. We believe in transparent pricing. You\'ll never be charged for features you don\'t use or hit with unexpected fees.'
      },
      {
        question: 'Do you offer refunds?',
        answer: 'Yes, if you\'re not satisfied with a paid service, contact our support team within 30 days for a full refund.'
      },
      {
        question: 'Can I estimate my costs?',
        answer: 'Yes! Use our price estimator on the pricing page to calculate your expected monthly costs based on your usage patterns.'
      }
    ]
  },
  {
    name: 'Features',
    faqs: [
      {
        question: 'What features are included for free?',
        answer: 'Unlimited events, forms, documents, whiteboards, and quizzes are all completely free. No limits, no restrictions. AI, email sending, and certificates are usage-based paid features.'
      },
      {
        question: 'Can I integrate Sinod\' with other tools?',
        answer: 'Yes! Sinod\' integrates with popular tools like Zoom, Google Meet, Google Calendar, Outlook, Slack, and many more. We also offer an API for custom integrations.'
      },
      {
        question: 'Is there a mobile app?',
        answer: 'We\'re developing mobile apps for iOS and Android. They\'ll be available shortly after the public launch. Until then, the web app is fully responsive and works great on mobile devices.'
      },
    ]
  },

  /*
  {
    name: 'Security',
    faqs: [
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest), are SOC 2 compliant, and conduct regular third-party security audits.'
      },
      {
        question: 'Who owns my data?',
        answer: 'You do. Always. We never sell your data, and you can export or delete everything at any time with no questions asked.'
      },
      {
        question: 'Is Sinod\' GDPR compliant?',
        answer: 'Yes, we\'re fully GDPR compliant. We provide tools for data export, deletion, and consent management to help you comply with data protection regulations.'
      },
      {
        question: 'Where is my data stored?',
        answer: 'We use multiple data centers across different geographic regions. You can choose where your data is stored to meet local compliance requirements.'
      }
    ]
  }, 
  */

  {
    name: 'Support',
    faqs: [
      {
        question: 'How do I get support?',
        answer: 'We offer multiple support channels: email support (24/7, <24h response), live chat (24/7, AI assistance), community forum, and comprehensive documentation.'
      },
      {
        question: 'Do you offer training?',
        answer: 'Yes! We have video tutorials, documentation, and webinars.'
      },
      {
        question: 'What languages do you support?',
        answer: 'Currently, Sinod\' is available in English. We\'re working on adding more languages and plan to support 10+ languages by the end of 2026.'
      }
    ]
  }
];

export function FAQPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
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

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      (activeCategory === 'All' || activeCategory === category.name) &&
      (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
       faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-sinod-base pt-20" ref={sectionRef}>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sinod-cyan/20 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section text-center max-w-4xl mx-auto">
                        
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto mb-10">
              Find answers to common questions about Sinod'. Can't find what you're looking for? 
              Reach out to our support team.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sinod-text-secondary" />
              <input
                type="text"
                placeholder="Search questions..."
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
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'All'
                  ? 'bg-sinod-cyan text-white'
                  : 'bg-white/5 text-sinod-text-secondary hover:bg-white/10'
              }`}
            >
              All
            </button>
            {faqCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.name
                    ? 'bg-sinod-cyan text-white'
                    : 'bg-white/5 text-sinod-text-secondary hover:bg-white/10'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <h2 className="font-heading text-2xl font-semibold text-sinod-text mb-6">
                  {category.name}
                </h2>
                <div className="space-y-4">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.name}-${index}`;
                    const isOpen = openItems[key];
                    
                    return (
                      <div 
                        key={key}
                        className="glass-card overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between p-6 text-left"
                        >
                          <span className="font-heading text-lg font-medium text-sinod-text pr-4">
                            {faq.question}
                          </span>
                          <ChevronDown 
                            className={`w-5 h-5 text-sinod-cyan flex-shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <div 
                          className={`overflow-hidden transition-all duration-300 ${
                            isOpen ? 'max-h-96' : 'max-h-0'
                          }`}
                        >
                          <div className="px-6 pb-6 text-sinod-text-secondary">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-sinod-cyan" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Still Have Questions?
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/resources/support" className="btn-primary">
                Contact Support
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </Link>
              <a href="mailto:contact@sinod.app" className="btn-secondary">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
