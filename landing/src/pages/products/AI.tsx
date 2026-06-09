import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Sparkles, 
  ArrowRight, 
  MessageSquare,
  FileText,
  Search,
  PenTool,
  Lightbulb,
  Calendar,
  FormInput,
  Mail,
  Quote
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  {
    tool: 'Events',
    icon: Calendar,
    actions: ['Draft event descriptions', 'Suggest agendas', 'Write reminder emails'],
  },
  {
    tool: 'Documents',
    icon: FileText,
    actions: ['Outline content', 'Summarize notes', 'Generate ideas'],
  },
  {
    tool: 'Forms',
    icon: FormInput,
    actions: ['Suggest questions', 'Improve wording', 'Create logic flows'],
  },
  {
    tool: 'Newsletter',
    icon: Mail,
    actions: ['Write subject lines', 'Draft articles', 'Personalize content'],
  },
  {
    tool: 'Quizzes',
    icon: MessageSquare,
    actions: ['Generate questions', 'Create explanations', 'Set difficulty levels'],
  },
];

const examples = [
  {
    prompt: '"Write a welcome email for my workshop on public speaking"',
    result: 'Generates a complete draft in seconds',
  },
  {
    prompt: '"Suggest 10 quiz questions about climate change for high school students"',
    result: 'Creates age-appropriate questions with answers',
  },
  {
    prompt: '"Help me outline a strategic plan for my small business"',
    result: 'Builds a structured document ready to fill',
  },
];

export function ProductAI() {
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
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sinod-cyan/10 border border-sinod-cyan/20 mb-6">
              <Sparkles className="w-4 h-4 text-sinod-cyan" />
              <span className="text-sm font-medium text-sinod-cyan">Coming soon</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Your 24/7 Partner for Getting Things Done
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Draft, plan, write, and create faster. Built into every part of the platform.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* What It Does Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Help When You Need It. Where You Need It.
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {capabilities.map((cap) => (
              <div key={cap.tool} className="glass-card p-5">
                <cap.icon className="w-8 h-8 mb-4 text-sinod-cyan" />
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-3">In {cap.tool}</h3>
                <ul className="space-y-2">
                  {cap.actions.map((action) => (
                    <li key={action} className="text-sinod-text-secondary text-sm">
                      • {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Examples Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              See It in Action
            </h2>
          </div>

          <div className="animate-section max-w-4xl mx-auto space-y-6">
            {examples.map((example, i) => (
              <div key={i} className="glass-card-strong p-6">
                <div className="flex items-start gap-4">
                  <Quote className="w-8 h-8 text-sinod-cyan flex-shrink-0" />
                  <div>
                    <p className="text-sinod-text text-lg mb-2">{example.prompt}</p>
                    <p className="text-sinod-cyan">→ {example.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
              Transparent Pay‑Per‑Use Pricing
            </h2>
            <p className="text-sinod-text-secondary text-lg mb-8">
              Most platforms lock AI behind expensive monthly add-ons. With Sinod', you pay only for what you use—no 
              subscriptions, no minimums, no surprises.
            </p>
            <div className="glass-card-strong p-8 inline-block">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-sinod-text-secondary text-sm mb-1">Other Platforms</p>
                  <p className="font-heading text-2xl font-bold text-sinod-text">$10-50/mo</p>
                  <p className="text-sinod-text-secondary text-xs">Monthly AI add-on</p>
                </div>
                <ArrowRight className="w-8 h-8 text-sinod-text-secondary" />
                <div className="text-center">
                  <p className="text-sinod-cyan text-sm mb-1">Sinod'</p>
                  <p className="font-heading text-2xl font-bold text-sinod-cyan">$1.99</p>
                  <p className="text-sinod-cyan text-xs">per 1,000 requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Interface Preview */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="glass-card-strong p-6">
              <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/4da8c045-74f3-4a0d-90e8-768871ecaeb2" alt="Sinod' AI Assistant" className="rounded-xl w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Your Intelligent Teammate
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: PenTool, title: 'Smart Drafting', description: 'AI helps you write faster and better' },
              { icon: MessageSquare, title: 'Summarization', description: 'Get quick summaries of long threads' },
              { icon: Lightbulb, title: 'Suggestions', description: 'Smart next-step recommendations' },
              { icon: Search, title: 'Universal Search', description: 'Find answers across your entire workspace' },
              { icon: FileText, title: 'Content Generation', description: 'Generate docs, emails, and more' },
              { icon: Sparkles, title: '24/7 Available', description: 'Your AI assistant is always ready to help' },
            ].map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="product-icon w-12 h-12 mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">{feature.title}</h3>
                <p className="text-sinod-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-6">
              Ready to Work Smarter?
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
