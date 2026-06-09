import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Palette,
  QrCode,
  Sparkles,
  Check,
  ClipboardList,
  Calendar,
  FormInput,
  GraduationCap,
  Heart,
  TrendingUp,
  Send
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const triggers = [
  { icon: ClipboardList, title: 'Quiz completion', description: 'Reward passing scores' },
  { icon: Calendar, title: 'Event attendance', description: 'Confirm participation' },
  { icon: FormInput, title: 'Form submission', description: 'Acknowledge completion' },
  { icon: GraduationCap, title: 'Course completion', description: 'Celebrate learning' },
  { icon: Heart, title: 'Volunteer hours', description: 'Recognize contributions' },
  { icon: TrendingUp, title: 'Donation milestones', description: 'Thank supporters' },
];

export function ProductCertificates() {
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
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Certificates That Send Themselves
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Generate, customize, and deliver certificates automatically. No manual work. No design skills needed.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Three Steps to Automated Recognition
            </h2>
          </div>

          <div className="animate-section grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { number: '1', title: 'Design', description: 'Upload logo, choose colors, add text', icon: Palette },
              { number: '2', title: 'Connect', description: 'Link to forms, quizzes, or events', icon: Check },
              { number: '3', title: 'Automate', description: 'We send certificates when conditions are met', icon: Send },
            ].map((step) => (
              <div key={step.number} className="glass-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sinod-cyan/10 border border-sinod-cyan/20 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-sinod-cyan" />
                </div>
                <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-sinod-cyan text-sinod-base font-heading font-bold flex items-center justify-center">
                  {step.number}
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-2">{step.title}</h3>
                <p className="text-sinod-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Triggers Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              When to Send Certificates
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {triggers.map((trigger) => (
              <div key={trigger.title} className="glass-card p-5">
                <trigger.icon className="w-6 h-6 text-sinod-cyan mb-3" />
                <h3 className="font-heading text-sm font-semibold text-sinod-text mb-1">{trigger.title}</h3>
                <p className="text-sinod-text-secondary text-xs">{trigger.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Validation Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Verify Instantly
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Every certificate includes a unique QR code and validation link. Anyone can verify authenticity in seconds.
                </p>
                <div className="flex items-center gap-4">
                  <div className="product-icon w-14 h-14">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sinod-text font-medium">QR Code Validation</p>
                    <p className="text-sinod-text-secondary text-sm">Scan to verify instantly</p>
                  </div>
                </div>
              </div>
              <div className="glass-card-strong p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-xl bg-white p-2">
                    <div className="w-full h-full bg-gradient-to-br from-sinod-cyan to-sinod-violet rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Pennies Per Certificate
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              $0.50 per 100 certificates sent. First 10 certificates free monthly.
            </p>

            <div className="glass-card-strong p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="font-heading text-6xl font-bold text-sinod-cyan">$0.50</span>
              </div>
              <p className="text-sinod-text text-lg mb-2">per 100 certificates</p>
              <p className="text-sinod-text-secondary text-sm">That's half a cent per certificate</p>
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-sinod-cyan text-sm">First 10 certificates FREE every month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Everything You Need
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Palette, title: 'Custom Design', description: 'Match your brand with customizable templates' },
              { icon: QrCode, title: 'QR Codes', description: 'Instant verification with unique QR codes' },
              { icon: Sparkles, title: 'Auto-Issue', description: 'Trigger certificates based on conditions' },
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
              Ready to Celebrate Achievements?
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
