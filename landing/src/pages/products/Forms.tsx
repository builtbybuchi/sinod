import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FormInput, 
  ArrowRight, 
  GitBranch,
  Type,
  AlignLeft,
  CircleDot,
  SquareCheck,
  ChevronDown,
  Upload,
  Calendar,
  Star,
  CreditCard,
  PenLine,
  Eye,
  Briefcase,
  Users,
  ShoppingCart,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const questionTypes = [
  { icon: Type, name: 'Short text' },
  { icon: AlignLeft, name: 'Long text' },
  { icon: CircleDot, name: 'Multiple choice' },
  { icon: SquareCheck, name: 'Checkboxes' },
  { icon: ChevronDown, name: 'Dropdowns' },
  { icon: Upload, name: 'File uploads' },
  { icon: Calendar, name: 'Date pickers' },
  { icon: Star, name: 'Rating scales' },
  { icon: ThumbsUp, name: 'NPS' },
  { icon: CreditCard, name: 'Payment' },
  { icon: PenLine, name: 'Signatures' },
  { icon: Eye, name: 'Hidden fields' },
];

const useCases = [
  { icon: Briefcase, title: 'Client onboarding forms', description: 'Streamline new client intake' },
  { icon: Users, title: 'Job applications', description: 'Collect candidate information' },
  { icon: Calendar, title: 'Event registration', description: 'Manage event signups' },
  { icon: MessageSquare, title: 'Customer surveys', description: 'Gather feedback' },
  { icon: ShoppingCart, title: 'Order forms', description: 'Process orders seamlessly' },
  { icon: FormInput, title: 'Contact forms', description: 'Capture inquiries' },
  { icon: ThumbsUp, title: 'Feedback collection', description: 'Improve with insights' },
];

export function ProductForms() {
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
              Forms That Look Like TypeForm. Priced Like Google Form.
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Unlimited forms. Unlimited responses. Beautiful, conversational design. Zero monthly fees.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* The Form Frustration Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
                  Why Settle for Ugly or Expensive?
                </h2>
                <div className="space-y-4 text-sinod-text-secondary">
                  <p>
                    Google Forms is free—and looks like it. TypeForm is beautiful—and charges you per response.
                  </p>
                  <p>
                    You deserve forms that look professional without breaking your budget. So we built them.
                  </p>
                </div>
              </div>
              <div className="glass-card-strong p-8">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/[0.04]">
                    <p className="text-sinod-text-secondary text-sm">TypeForm Free</p>
                    <p className="text-sinod-text font-semibold">10 responses/month</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/[0.04]">
                    <p className="text-sinod-text-secondary text-sm">TypeForm Paid</p>
                    <p className="text-sinod-text font-semibold">$39/month for 100 responses</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/[0.04]">
                    <p className="text-sinod-text-secondary text-sm">Google Forms</p>
                    <p className="text-sinod-text font-semibold">Unlimited but basic</p>
                  </div>
                  <div className="p-4 rounded-lg bg-sinod-cyan/10 border border-sinod-cyan/20">
                    <p className="text-sinod-cyan text-sm">Sinod'</p>
                    <p className="text-sinod-cyan font-bold">Unlimited, beautiful, and free</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Question Types Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Ask Anything. Capture Everything.
            </h2>
          </div>

          <div className="animate-section grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {questionTypes.map((type) => (
              <div key={type.name} className="glass-card p-4 text-center">
                <type.icon className="w-6 h-6 mx-auto mb-2 text-sinod-cyan" />
                <p className="text-sinod-text text-sm">{type.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logic & Branching Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="glass-card-strong p-6">
                <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/9957ac2a-a335-42b7-bd85-ea008a827835" alt="Sinod' Form" className="rounded-xl w-full" />
              </div>
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Forms That Adapt to Answers
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Show different questions based on previous answers. Create custom paths.
                </p>
                <div className="flex items-center gap-4">
                  <div className="product-icon w-12 h-12">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sinod-text font-medium">Conditional Logic</p>
                    <p className="text-sinod-text-secondary text-sm">Built into every form</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unlimited Everything Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              No Limits. No Surprises.
            </h2>
            <p className="text-sinod-text-secondary mb-12">
              Create 5 forms or 500. Get 50 responses or 50,000. All included.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-8">
                <p className="font-heading text-5xl font-bold text-sinod-cyan mb-2">∞</p>
                <p className="text-sinod-text font-medium">Forms</p>
              </div>
              <div className="glass-card p-8">
                <p className="font-heading text-5xl font-bold text-sinod-cyan mb-2">∞</p>
                <p className="text-sinod-text font-medium">Responses</p>
              </div>
              <div className="glass-card p-8">
                <p className="font-heading text-5xl font-bold text-sinod-cyan mb-2">$0</p>
                <p className="text-sinod-text font-medium">Monthly Cost</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Anywhere Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Put Forms Where People Are
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Embed on your website. Direct link. QR code. Popup. Everywhere.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Website Embed', 'Direct Link', 'QR Code', 'Popup'].map((item) => (
                <div key={item} className="glass-card px-6 py-3">
                  <span className="text-sinod-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              From Client Intake to Customer Feedback
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="glass-card p-5">
                <useCase.icon className="w-6 h-6 text-sinod-cyan mb-3" />
                <h3 className="font-heading text-sm font-semibold text-sinod-text mb-1">{useCase.title}</h3>
                <p className="text-sinod-text-secondary text-xs">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-6">
              Stop Counting Responses. Start Collecting Them.
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
