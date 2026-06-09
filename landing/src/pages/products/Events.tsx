import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Calendar, 
  ArrowRight, 
  Video,
  Building2,
  Layers,
  Check,
  Bell
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const eventTypes = [
  { icon: Building2, title: 'Physical Events', description: 'Venue details, maps, on-site check-in' },
  { icon: Video, title: 'Virtual Events', description: 'Google Meet, automated links' },
  { icon: Layers, title: 'Hybrid Events', description: 'Seamless in-person + virtual sync' },
];

const registrationFeatures = [
  'Custom registration forms',
  'Automatic confirmation emails',
  'Waitlist management',
  'Ticket types (free/paid)',
  'Group registrations',
  'QR code check-in',
];

const reminderFeatures = [
  '24-hour reminders',
  '1-hour reminders',
  'Post-event follow-ups',
  'Custom templates',
  '$0.99/1000 emails',
];

const useCases = [
  {
    title: 'For Non-Profits & Educators',
    items: ['Classes and trainings', 'Fundraising events', 'Community meetings', 'Volunteer orientations'],
  },
  {
    title: 'For Coaches & Consultants',
    items: ['Client workshops', 'Group coaching sessions', 'Paid webinars', 'Q&A sessions'],
  },
  {
    title: 'For Businesses',
    items: ['Product launches', 'Team offsites', 'Customer events', 'Networking mixers'],
  },

];

export function ProductEvents() {
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
              Event Management That Actually Manages Itself
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Unlimited events. Unlimited registrations. Physical, virtual, or hybrid. 
              No subscription fees. No attendee limits. No stress.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* Who Uses Events Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              From Workshops to Webinars to Galas
            </h2>
          </div>

          <div className="animate-section grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="glass-card p-8">
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-4">{useCase.title}</h3>
                <ul className="space-y-3">
                  {useCase.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sinod-text-secondary">
                      <Check className="w-4 h-4 text-sinod-cyan flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Every Event Type. Every Feature Included.
            </h2>
          </div>

          <div className="animate-section grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {eventTypes.map((type) => (
              <div key={type.title} className="feature-card text-center">
                <div className="product-icon w-14 h-14 mx-auto mb-4">
                  <type.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-2">{type.title}</h3>
                <p className="text-sinod-text-secondary">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Unlimited Registrations. Unlimited Possibilities.
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Whether you're hosting 10 people or 10,000, you pay the same amount: nothing.
                </p>
                <ul className="space-y-3">
                  {registrationFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sinod-text">
                      <Check className="w-5 h-5 text-sinod-cyan flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-card-strong p-6">
                <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_webp/q_auto:low/Capture_d_%C3%A9cran_du_2026-02-24_14-42-31_k0ntgf" alt="Event Registration" className="rounded-xl w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Reminders Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 glass-card-strong p-6 flex items-center justify-center h-64">
                <Bell className="w-24 h-24 text-sinod-cyan/30" />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Never Manually Email an Attendee Again
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Set it once. We handle the rest.
                </p>
                <ul className="space-y-3">
                  {reminderFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sinod-text">
                      <Check className="w-5 h-5 text-sinod-cyan flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Integration Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              One Click. Added to Calendar.
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Google Calendar, Apple Calendar, Outlook—instantly.
            </p>
            <div className="flex justify-center gap-4">
              <div className="glass-card p-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-sinod-cyan" />
                <span className="text-sinod-text">Google</span>
              </div>
              <div className="glass-card p-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-sinod-cyan" />
                <span className="text-sinod-text">Apple</span>
              </div>
              <div className="glass-card p-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-sinod-cyan" />
                <span className="text-sinod-text">Outlook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Collaboration Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Your Whole Team. One Dashboard.
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Invite staff, volunteers, or co-hosts. No extra seats to purchase.
            </p>
          </div>
        </div>
      </section>

      {/* Paid Events Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="glass-card-strong p-8 lg:p-12">
              <div className="text-center mb-8">
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  The Only Time You Pay Is When You Get Paid
                </h2>
                <p className="text-sinod-text-secondary">
                  Free events are completely free. Paid events include a 5% platform fee + 1.6% gateway fee—that's it.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <p className="text-sinod-text-secondary text-sm mb-2">Eventbrite</p>
                  <p className="font-heading text-2xl font-semibold text-sinod-text mb-2">$49–$199/month</p>
                  <p className="text-sinod-text-secondary text-sm">+ 2-3% per ticket</p>
                </div>
                <div className="glass-card p-6 border-sinod-cyan/30">
                  <p className="text-sinod-cyan text-sm mb-2">Sinod'</p>
                  <p className="font-heading text-2xl font-semibold text-sinod-text mb-2">$0/month</p>
                  <p className="text-sinod-text-secondary text-sm">+ 5% only on paid tickets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-6">
              Ready to Stop Paying for Event Tools?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://my.sinod.app/signup" className="btn-primary whitespace-nowrap">
                Sign Up Free
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </a>
              <a href="https://my.sinod.app/signin" className="btn-secondary whitespace-nowrap">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
