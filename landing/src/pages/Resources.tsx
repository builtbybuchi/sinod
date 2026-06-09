import { 
  // Shield, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  ArrowRight,
  // Lock,
  // Server,
  // Eye,
  // FileCheck
} from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Documentation', description: 'Comprehensive guides for every feature' },
  { icon: MessageSquare, title: 'Community Forum', description: 'Connect with other Sinod\' users' },
  { icon: HelpCircle, title: 'Help Center', description: 'FAQs and troubleshooting guides' },
  // { icon: Shield, title: 'Security', description: 'Learn about our security practices' },
];

// const securityFeatures = [
//   { icon: Lock, title: 'End-to-End Encryption', description: 'Your data is encrypted in transit and at rest' },
//   { icon: Server, title: 'SOC 2 Compliant', description: 'Enterprise-grade security standards' },
//   { icon: Eye, title: 'Privacy First', description: 'You own your data, always' },
//   { icon: FileCheck, title: 'Regular Audits', description: 'Third-party security assessments' },
// ];

const faqs = [
  {
    question: 'What is Sinod\'?',
    answer: 'Sinod\' is a unified community management platform that brings together events, forms, documents, newsletters, quizzes, certificates, and an AI assistant in one workspace—all without monthly subscriptions.'
  },
  {
    question: 'How does the free plan work?',
    answer: 'Most features are completely free with no limits. You only pay for email sending ($0.99/1,000 emails), certificates ($0.50/100), AI requests ($1.99/1,000 requests), and a 5% fee on paid events.'
  },
  {
    question: 'When will Sinod\' launch?',
    answer: 'Our public launch is scheduled for March 31, 2026. Sign up for a free account to get early access and updates.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, are SOC 2 compliant, and never sell your data. You can export or delete your data at any time.'
  },
  {
    question: 'How do I get support?',
    answer: 'We offer multiple support channels including our Help Center, Community Forum, and direct email support.'
  },
];

export function ResourcesPage() {
  return (
    <div className="min-h-screen bg-sinod-base pt-20">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Resources & <span className="text-gradient">Support</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary">
              Everything you need to get the most out of Sinod'. 
              Documentation, guides, FAQs, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card text-center cursor-pointer group">
                <div className="product-icon w-14 h-14 mx-auto mb-4 group-hover:scale-110 transition-transform">
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

      {/* Security Section - commented out
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="glass-card-strong p-8 lg:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sinod-cyan/10 border border-sinod-cyan/20 mb-6">
                <Shield className="w-4 h-4 text-sinod-cyan" />
                <span className="text-sm font-medium text-sinod-cyan">Security</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                Your Security Is Our Priority
              </h2>
              <p className="text-sinod-text-secondary max-w-2xl mx-auto">
                We take security seriously. Learn about the measures we take to protect your data.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {securityFeatures.map((feature) => (
                <div key={feature.title} className="text-center">
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
        </div>
      </section>
      */}

      {/* FAQ Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-card p-6">
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-3">
                  {faq.question}
                </h3>
                <p className="text-sinod-text-secondary">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="glass-card-strong text-center p-8 lg:p-12 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Need More Help?
            </h2>
            <p className="text-sinod-text-secondary mb-6">
              Our support team is here to help you get the most out of Sinod'.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:hello@sinod.io" className="btn-primary">
                Contact Support
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </a>
              <button className="btn-secondary">
                Visit Help Center
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
