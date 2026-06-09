import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, 
  Lock, 
  Server, 
  Eye, 
  FileCheck,
  Key,
  Fingerprint,
  Database,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const securityPillars = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Your information is protected at every step.',
    features: ['TLS 1.3 in transit', 'AES-256 at rest', 'Encrypted backups']
  },
  {
    icon: Server,
    title: 'SOC 2 Type II Compliant',
    description: 'We maintain the highest security standards with regular third-party audits and continuous monitoring.',
    features: ['Annual audits', 'Continuous monitoring', 'Control validation']
  },
  {
    icon: Eye,
    title: 'Privacy by Design',
    description: 'You own your data. We never sell it, and you can export or delete everything at any time.',
    features: ['Data ownership', 'Easy export', 'Complete deletion']
  },
  {
    icon: FileCheck,
    title: 'Regular Security Audits',
    description: 'Independent security firms conduct penetration testing and vulnerability assessments quarterly.',
    features: ['Penetration testing', 'Vulnerability scans', 'Bug bounty program']
  }
];

const complianceStandards = [
  { name: 'GDPR', description: 'Full compliance with EU data protection regulations', status: 'Compliant' },
  { name: 'CCPA', description: 'California Consumer Privacy Act compliant', status: 'Compliant' },
  { name: 'SOC 2 Type II', description: 'Security, availability, and confidentiality controls', status: 'Certified' },
  { name: 'ISO 27001', description: 'Information security management system', status: 'In Progress' }
];

const securityPractices = [
  {
    icon: Key,
    title: 'Secure Authentication',
    description: 'Multi-factor authentication, SSO support, and passwordless login options keep your accounts secure.'
  },
  {
    icon: Fingerprint,
    title: 'Access Controls',
    description: 'Role-based permissions, audit logs, and session management give you fine-grained control.'
  },
  {
    icon: Database,
    title: 'Data Redundancy',
    description: 'Multiple geographic regions, automatic backups, and disaster recovery ensure your data is always available.'
  },
  {
    icon: Globe,
    title: 'Global Infrastructure',
    description: 'Data centers in multiple regions with local data residency options for compliance.'
  },
  {
    icon: Clock,
    title: '24/7 Monitoring',
    description: 'Our security team monitors systems around the clock with automated threat detection.'
  },
  {
    icon: AlertTriangle,
    title: 'Incident Response',
    description: 'Clear protocols for security incidents with transparent communication to affected users.'
  }
];

export function SecurityPage() {
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sinod-cyan/10 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sinod-cyan/10 border border-sinod-cyan/20 mb-6">
              <Shield className="w-4 h-4 text-sinod-cyan" />
              <span className="text-sm font-medium text-sinod-cyan">Security</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Your Security Is Our <span className="text-gradient">Top Priority</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
              We take a defense-in-depth approach to security. From encryption to compliance, 
              every aspect of Sinod' is designed to protect your data.
            </p>
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Four Pillars of Security
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Our security framework is built on these fundamental principles.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 gap-6">
            {securityPillars.map((pillar) => (
              <div key={pillar.title} className="glass-card-strong p-8">
                <div className="product-icon w-16 h-16 mb-6">
                  <pillar.icon className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sinod-text-secondary mb-6">
                  {pillar.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pillar.features.map((feature) => (
                    <span 
                      key={feature}
                      className="px-3 py-1 rounded-full bg-sinod-cyan/10 text-sinod-cyan text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              We meet and exceed industry standards for data protection and security.
            </p>
          </div>

          <div className="animate-section max-w-4xl mx-auto">
            <div className="glass-card-strong overflow-hidden">
              {complianceStandards.map((standard, index) => (
                <div 
                  key={standard.name}
                  className={`flex items-center justify-between p-6 ${index !== complianceStandards.length - 1 ? 'border-b border-white/10' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sinod-cyan/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-sinod-cyan" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-sinod-text">
                        {standard.name}
                      </h3>
                      <p className="text-sinod-text-secondary text-sm">
                        {standard.description}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    standard.status === 'Certified' 
                      ? 'bg-green-500/20 text-green-400' 
                      : standard.status === 'Compliant'
                      ? 'bg-sinod-cyan/20 text-sinod-cyan'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {standard.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Security Practices
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              The measures we take every day to keep your data safe.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityPractices.map((practice) => (
              <div key={practice.title} className="feature-card">
                <div className="product-icon w-14 h-14 mb-4">
                  <practice.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">
                  {practice.title}
                </h3>
                <p className="text-sinod-text-secondary text-sm">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Report CTA */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-sinod-cyan" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Want to Learn More?
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Download our security whitepaper or contact our security team for detailed information 
              about our security practices and compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:security@sinod.io" className="btn-primary">
                Contact Security Team
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </a>
              <Link to="/resources/faq" className="btn-secondary">
                View Security FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
