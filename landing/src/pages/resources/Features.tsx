import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Calendar, 
  FileText, 
  FolderOpen, 
  Mail, 
  ClipboardList, 
  Award, 
  Sparkles,
  Zap,
  Users,
  Shield,
  BarChart3,
  Layers,
  Check,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const allFeatures = [
  {
    icon: Calendar,
    title: 'Events',
    description: 'Create and manage physical, virtual, and hybrid events with ease.',
    features: [
      'Native Zoom & Google Meet integration',
      'Automated reminder emails',
      'Custom registration forms',
      'Check-in management',
      'Recurring events support',
      'Calendar sync (Google, Outlook)'
    ],
    color: 'from-sinod-cyan/20 to-sinod-cyan/5'
  },
  {
    icon: FileText,
    title: 'Forms',
    description: 'Build powerful forms with conditional logic and real-time collaboration.',
    features: [
      '30+ field types',
      'Conditional logic',
      'Real-time collaboration',
      'Response analytics',
      'Export to CSV/Excel',
      'Embed anywhere'
    ],
    color: 'from-sinod-violet/20 to-sinod-violet/5'
  },
  {
    icon: FolderOpen,
    title: 'Documents',
    description: 'Create and collaborate on documents in real-time.',
    features: [
      'Real-time editing',
      'Version history',
      'Comments & mentions',
      'Templates library',
      'Export to multiple formats',
      'Offline mode'
    ],
    color: 'from-sinod-cyan/20 to-sinod-violet/10'
  },
  {
    icon: Mail,
    title: 'Newsletter',
    description: 'Design and send beautiful emails with powerful analytics.',
    features: [
      'Drag-and-drop editor',
      'Custom templates',
      'A/B testing',
      'Advanced analytics',
      'List segmentation',
      'Automation workflows'
    ],
    color: 'from-sinod-violet/20 to-sinod-cyan/10'
  },
  {
    icon: ClipboardList,
    title: 'Quizzes',
    description: 'Create engaging quizzes with leaderboards and analytics.',
    features: [
      'Multiple question types',
      'Live leaderboards',
      'Time limits',
      'Auto-grading',
      'Detailed analytics',
      'Gamification'
    ],
    color: 'from-sinod-cyan/20 to-sinod-cyan/5'
  },
  {
    icon: Award,
    title: 'Certificates',
    description: 'Design and issue professional certificates.',
    features: [
      'Custom templates',
      'Bulk generation',
      'QR code verification',
      'LinkedIn integration',
      'Auto-delivery',
      'Analytics dashboard'
    ],
    color: 'from-sinod-violet/20 to-sinod-violet/5'
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Get help with content creation and data analysis.',
    features: [
      'Content generation',
      'Data insights',
      'Smart suggestions',
      'Natural language queries',
      'Automated summaries',
      '24/7 availability'
    ],
    color: 'from-sinod-cyan/20 to-sinod-violet/10'
  }
];

const platformFeatures = [
  { icon: Zap, title: 'Lightning Fast', description: 'Optimized performance for smooth experience' },
  { icon: Users, title: 'Team Collaboration', description: 'Work together in real-time' },
  { icon: Shield, title: 'Enterprise Security', description: 'SOC 2 compliant with end-to-end encryption' },
  { icon: BarChart3, title: 'Advanced Analytics', description: 'Deep insights into your community' },
  { icon: Layers, title: 'Seamless Integration', description: 'Connects with 100+ tools' },
  { icon: Check, title: '99.9% Uptime', description: 'Reliable infrastructure you can trust' }
];

export function FeaturesPage() {
  const sectionRef = useRef<HTMLDivElement>(null);

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
          <div className="absolute top-20 left-10 w-72 h-72 bg-sinod-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sinod-violet/20 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section text-center max-w-4xl mx-auto">
                        
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Everything You Need, <span className="text-gradient">All in One Place</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
              Seven powerful tools working together seamlessly. No more juggling multiple subscriptions 
              or dealing with incompatible software.
            </p>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section grid gap-8">
            {allFeatures.map((feature, index) => (
              <div 
                key={feature.title} 
                className={`glass-card-strong p-8 lg:p-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''} flex flex-col lg:flex-row gap-8 lg:gap-12 items-center`}
              >
                <div className={`w-full lg:w-1/3 flex justify-center`}>
                  <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="w-16 h-16 text-sinod-cyan" />
                  </div>
                </div>
                
                <div className="w-full lg:w-2/3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-sinod-text-secondary text-lg mb-6">
                    {feature.description}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    {feature.features.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-sinod-cyan/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-sinod-cyan" />
                        </div>
                        <span className="text-sinod-text-secondary text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    to={`/products/${feature.title.toLowerCase()}`}
                    className="inline-flex items-center gap-2 mt-6 text-sinod-cyan hover:text-sinod-cyan-light transition-colors"
                  >
                    Learn more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Built for Performance
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Under the hood, Sinod' is engineered for speed, security, and reliability.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature) => (
              <div key={feature.title} className="feature-card text-center">
                <div className="product-icon w-14 h-14 mx-auto mb-4">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-sinod-text-secondary text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
