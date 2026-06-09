import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Users,
  BarChart3,
  Palette,
  Clock,
  Sparkles,
  Check,
  Send,
  List,
  Ban,
  MousePointer,
  FlaskConical,
  Eye
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Palette, title: 'Drag-and-drop editor', description: 'Beautiful emails without coding' },
  { icon: Sparkles, title: 'Custom templates', description: 'Start with professionally designed templates' },
  { icon: Users, title: 'Contact management', description: 'Organize and segment your audience' },
  { icon: List, title: 'List segmentation', description: 'Target specific groups with relevant content' },
  { icon: Ban, title: 'Unsubscribe handling', description: 'Automatic unsubscribe management' },
  { icon: Send, title: 'Bounce management', description: 'Keep your list clean automatically' },
  { icon: BarChart3, title: 'Analytics & opens', description: 'Track engagement in real-time' },
  { icon: MousePointer, title: 'Click tracking', description: 'See what resonates with your audience' },
  { icon: FlaskConical, title: 'A/B testing', description: 'Optimize with split testing' },
  { icon: Clock, title: 'Scheduled sending', description: 'Send at the perfect time' },
  { icon: Eye, title: 'RSS-to-email', description: 'Automate blog digests' },
];

export function ProductNewsletter() {
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
              Email That Reaches Inboxes. Not Just Sent Folders.
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Send newsletters to unlimited subscribers. No monthly fees. No per-subscriber charges. 
              Just powerful deliverability at $0.99 per 1000 emails.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* The Email Problem Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
                  You Shouldn't Need HubSpot to Send a Newsletter
                </h2>
                <div className="space-y-4 text-sinod-text-secondary">
                  <p>
                    You build a beautiful email in Mailchimp, but you've hit your contact limit. 
                    Or you're paying ConvertKit $100/month when you email once a quarter.
                  </p>
                  <p>
                    Email tools punish you for growing your audience. The more people you reach, 
                    the more you pay.
                  </p>
                </div>
              </div>
              <div className="glass-card-strong p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04]">
                    <span className="text-sinod-text-secondary">Mailchimp</span>
                    <span className="text-sinod-text font-semibold">$20-350/mo</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04]">
                    <span className="text-sinod-text-secondary">ConvertKit</span>
                    <span className="text-sinod-text font-semibold">$29-119/mo</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04]">
                    <span className="text-sinod-text-secondary">Constant Contact</span>
                    <span className="text-sinod-text font-semibold">$9.95-449/mo</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-sinod-cyan/10 border border-sinod-cyan/20">
                    <span className="text-sinod-cyan font-medium">Sinod'</span>
                    <span className="text-sinod-cyan font-bold">$0/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing That Makes Sense Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Pay for What You Send. Not Who You Know.
            </h2>
            <p className="text-sinod-text-secondary mb-12">
              Most platforms charge per subscriber. We charge per email sent.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <p className="text-sinod-text-secondary text-sm mb-2">5,000 contacts weekly</p>
                <p className="font-heading text-3xl font-bold text-sinod-text">~$20/mo</p>
              </div>
              <div className="glass-card p-6">
                <p className="text-sinod-text-secondary text-sm mb-2">20,000 contacts monthly</p>
                <p className="font-heading text-3xl font-bold text-sinod-text">~$20/mo</p>
              </div>
              <div className="glass-card p-6">
                <p className="text-sinod-text-secondary text-sm mb-2">100,000 contacts quarterly</p>
                <p className="font-heading text-3xl font-bold text-sinod-text">~$25/qtr</p>
              </div>
            </div>

            <p className="text-sinod-text-secondary mt-8">
              No tiered plans. No sudden price jumps.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Professional Email. Fair Price.
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-5">
                <div className="product-icon w-10 h-10 mb-3">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-sinod-text mb-1">{feature.title}</h3>
                <p className="text-sinod-text-secondary text-xs">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* List Management Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="glass-card-strong p-6">
                <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/Capture_d_%C3%A9cran_du_2026-02-24_14-22-24_jak1rr" alt="Sinod' Email drag and drop" className="rounded-xl w-full" />
              </div>
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Your Contacts. Your Control.
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Import from any CSV. Tag and segment. Track engagement. Get notified when someone unsubscribes.
                </p>
                <ul className="space-y-3">
                  {['CSV import', 'Custom tags', 'Engagement tracking', 'Unsubscribe notifications'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sinod-text">
                      <Check className="w-5 h-5 text-sinod-cyan flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-8 text-center">
              The Math Is Simple
            </h2>

            <div className="glass-card-strong overflow-hidden">
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-white/[0.06] text-sm font-medium text-sinod-text-secondary">
                <span className="col-span-1">Feature</span>
                <span className="text-center">Mailchimp</span>
                <span className="text-center">ConvertKit</span>
                <span className="text-center">Constant Contact</span>
                <span className="text-center text-sinod-cyan">Sinod'</span>
              </div>
              {[
                { feature: 'Monthly Fee', mc: '$20-350', ck: '$29-119', cc: '$9.95-449', us: '$0' },
                { feature: 'Per-Contact Charges', mc: 'Yes', ck: 'Yes', cc: 'Yes', us: 'No' },
                { feature: 'Send Unlimited', mc: 'No', ck: 'No', cc: 'No', us: 'Yes' },
                { feature: 'Cancel Anytime', mc: 'Yes', ck: 'Yes', cc: 'Yes', us: 'Yes' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-white/[0.06] text-sm">
                  <span className="col-span-1 text-sinod-text">{row.feature}</span>
                  <span className="text-center text-sinod-text-secondary">{row.mc}</span>
                  <span className="text-center text-sinod-text-secondary">{row.ck}</span>
                  <span className="text-center text-sinod-text-secondary">{row.cc}</span>
                  <span className="text-center text-sinod-cyan font-medium">{row.us}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-6">
              Stop Paying Per Person. Start Paying Per Send.
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
