import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Calendar, 
  FileText, 
  Mail, 
  ClipboardList, 
  Award, 
  Sparkles, 
  FormInput,
  ArrowRight,
  Check,
  Users,
  TrendingUp,
  BookOpen,
  Send,
  Target,
  Heart,
  Clock,
  Zap,
  Infinity,
  Star
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const orbitProducts = [
  { name: 'Events', icon: Calendar, path: '/products/events', angle: 90, color: 'from-cyan-400/30 to-cyan-500/10' },
  { name: 'Forms', icon: FormInput, path: '/products/forms', angle: 45, color: 'from-violet-400/30 to-violet-500/10' },
  { name: 'Docs', icon: FileText, path: '/products/documents', angle: 0, color: 'from-cyan-400/30 to-violet-400/10' },
  { name: 'Newsletter', icon: Mail, path: '/products/newsletter', angle: 315, color: 'from-violet-400/30 to-cyan-400/10' },
  { name: 'Quizzes', icon: ClipboardList, path: '/products/quizzes', angle: 270, color: 'from-cyan-400/30 to-cyan-500/10' },
  { name: 'Certificates', icon: Award, path: '/products/certificates', angle: 225, color: 'from-violet-400/30 to-violet-500/10' },
  { name: 'AI', icon: Sparkles, path: '/products/ai-assistant', angle: 180, color: 'from-violet-400/30 to-violet-500/10' },
];

const useCases = [
  { icon: Users, title: 'Coaches', description: 'Client onboarding, scheduling, resources' },
  { icon: TrendingUp, title: 'Businesses', description: 'Marketing, events, team collaboration' },
  { icon: BookOpen, title: 'Educators', description: 'Quizzes, certificates, materials' },
  { icon: Heart, title: 'Communities', description: 'Events, forms, coordination' },
  { icon: Send, title: 'Creators', description: 'Engagement, newsletters, products' },
  { icon: Target, title: 'Non-Profits', description: 'Fundraising, donors, reports' },
];

const stats = [
  { value: '10K+', label: 'Target Users' },
  { value: '7', label: 'Tools in One' },
  { value: '$0', label: 'To Start' },
  { value: '99.9%', label: 'Uptime' },
];

const testimonials = [
  { 
    quote: "Finally, a platform that understands teams don't want 15 subscriptions.", 
    author: 'Chinaza Chinyere', 
    role: 'C.E.O Kernal_systems' 
  },
  { 
    quote: "The pay-per-use model is a game-changer. I only pay when I actually send emails and do some really productive things.", 
    author: 'Grace Mugundu', 
    role: 'Founder/Director of Programs' 
  },
  { 
    quote: "Everything in one place. No more jumping between tools. That's the single reason I love Sinod'", 
    author: 'Dorathy Musa', 
    role: 'Community Manager' 
  },
];

export function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sLogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Headline reveal
      tl.fromTo(headlineRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        0.1
      );

      // Subheadline + CTAs
      tl.fromTo([subheadRef.current, ctaRef.current],
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
        0.4
      );

      // S Logo segments staggered entrance
      // Non-rotated segments (semi-circles)
      tl.fromTo('.s-segment:not(.s-quarter)',
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(1.4)' },
        0.3
      );

      // Quarter-circle segments — must preserve their 0.25turn (90deg) rotation
      tl.fromTo('.s-quarter',
        { scale: 0.7, opacity: 0, rotation: 90 },
        { scale: 1, opacity: 1, rotation: 90, duration: 0.6, stagger: 0.12, ease: 'back.out(1.4)' },
        0.3
      );

      // Scroll-driven animations
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

      // Stats counter animation
      gsap.utils.toArray<HTMLElement>('.stat-value').forEach((stat) => {
        gsap.fromTo(stat,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: stat,
              start: 'top 90%',
              toggleActions: 'play none none none',
            }
          }
        );
      });
    }, heroRef);

    return () => {
      ctx.revert();
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-sinod-base">
      {/* Hero Section */}
      <div ref={heroRef} className="relative min-h-screen flex items-center gradient-mesh overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sinod-cyan/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sinod-violet/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-24 pb-32 lg:pt-28 lg:pb-36 z-10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left: Text + CTAs */}
            <div className="flex-1 text-center lg:text-left">
              <div ref={headlineRef} className="opacity-0">
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-semibold text-sinod-text tracking-tight leading-tight">
                  One Platform.<br />
                  <span>Multiple Tools.<br /></span>
                  <span className="text-gradient">Zero Subscriptions.</span>
                </h1>
              </div>
              
              <p 
                ref={subheadRef}
                className="mt-6 text-lg sm:text-xl text-sinod-text-secondary max-w-xl mx-auto lg:mx-0 opacity-0"
              >
                Events, forms, docs, quizzes, newsletters & AI—united in one workspace. 
                Pay only for what you use.
              </p>
              
              <div ref={ctaRef} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0">
                <a href="https://my.sinod.app/signup" className="btn-primary text-lg px-8 py-4">
                  Sign Up Free
                  <ArrowRight className="w-5 h-5 inline-block ml-2" />
                </a>
                <a href="https://my.sinod.app/signin" className="btn-secondary text-lg px-8 py-4">
                  Sign In
                </a>
              </div>
            </div>

            {/* Right: S-Logo Mosaic with Images */}
            <div ref={sLogoRef} className="flex-shrink-0 relative">
              {/* Container with a 2:3 aspect ratio to match the 2-unit wide, 3-unit tall S-shape */}
              <div className="w-[240px] h-[360px] sm:w-[280px] sm:h-[420px] lg:w-[340px] lg:h-[510px] xl:w-[380px] xl:h-[570px] flex gap-[6px] sm:gap-[8px]">
                
                {/* LEFT COLUMN */}
                <div className="flex flex-col flex-1 gap-[6px] sm:gap-[8px]">
                  {/* Top-left: Semi-circle (Bulges Left) - 2/3 Height */}
                  <div 
                    className="s-segment relative overflow-hidden basis-2/3 opacity-0"
                    style={{ borderRadius: '500px 0 0 500px' }}
                  >
                    <img 
                      src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/speaker_qanm5u" 
                      alt="Events" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-sinod-cyan/20 to-sinod-base/40" />
                    <div className="absolute inset-0 shadow-[inset_0_0_0_2px_rgba(76,201,240,0.3)] pointer-events-none" style={{ borderRadius: '500px 0 0 500px' }} />
                  </div>

                  {/* Bottom-left: Quarter-circle (Bottom-Left Corner) - 1/3 Height */}
                  <div 
                    className="s-segment s-quarter relative overflow-hidden basis-1/3 opacity-0"
                    style={{ borderRadius: '0 0 0 500px' }}
                  >
                    <img 
                      src="https://res.cloudinary.com/dlvffw5wt/image/upload/v1771998317/taking_a_picture_scpkyv.jpg" 
                      alt="Newsletter" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-sinod-violet/20 to-sinod-base/40" />
                    <div className="absolute inset-0 shadow-[inset_0_0_0_2px_rgba(114,9,183,0.3)] pointer-events-none" style={{ borderRadius: '0 0 0 500px' }} />
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col flex-1 gap-[6px] sm:gap-[8px]">
                  {/* Top-right: Quarter-circle (Top-Right Corner) - 1/3 Height */}
                  <div 
                    className="s-segment s-quarter relative overflow-hidden basis-1/3 opacity-0"
                    style={{ borderRadius: '0 500px 0 0' }}
                  >
                    <img 
                      src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/standing_around_fzoywx" 
                      alt="Forms" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-bl from-sinod-violet/20 to-sinod-base/40" />
                    <div className="absolute inset-0 shadow-[inset_0_0_0_2px_rgba(76,201,240,0.3)] pointer-events-none" style={{ borderRadius: '0 500px 0 0' }} />
                  </div>

                  {/* Bottom-right: Semi-circle (Bulges Right) - 2/3 Height */}
                  <div 
                    className="s-segment relative overflow-hidden basis-2/3 opacity-0"
                    style={{ borderRadius: '0 500px 500px 0' }}
                  >
                    <img 
                      src="https://res.cloudinary.com/dlvffw5wt/image/upload/v1771998163/pressing_phone_ppjajq.jpg" 
                      alt="Documents" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tl from-sinod-cyan/20 to-sinod-base/40" />
                    <div className="absolute inset-0 shadow-[inset_0_0_0_2px_rgba(76,201,240,0.3)] pointer-events-none" style={{ borderRadius: '0 500px 500px 0' }} />
                  </div>
                </div>
              </div>

              {/* Subtle glow behind the S */}
              <div className="absolute -inset-12 bg-sinod-cyan/10 rounded-full blur-3xl pointer-events-none -z-10" />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sinod-base to-transparent pt-20 pb-8">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="glass-card-strong py-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="stat-value font-heading text-3xl lg:text-4xl font-bold text-gradient mb-1">
                      {stat.value}
                    </div>
                    <p className="text-sinod-text-secondary text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section - Visual Cards */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
                Tired of <span className="text-gradient">Subscription Creep?</span>
              </h2>
              <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
                You're paying for multiple tools when you only need one.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card-strong p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-3">Too Many Tools</h3>
                <p className="text-sinod-text-secondary">Luma, Hubspot, Typeform, Mailchimp, Miro... the list never ends.</p>
              </div>

              <div className="glass-card-strong p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Infinity className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-3">Monthly Bills</h3>
                <p className="text-sinod-text-secondary">$10 here, $25 there, $50 somewhere else. It adds up fast.</p>
              </div>

              <div className="glass-card-strong p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-sinod-text mb-3">Wasted Time</h3>
                <p className="text-sinod-text-secondary">Exporting, importing, copying, pasting. Hours lost to admin.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Feature Grid */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Seven Tools. One Platform.
            </h2>
            <p className="text-xl text-sinod-text-secondary max-w-2xl mx-auto">
              Everything you need, connected and ready to use.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {orbitProducts.map((product, i) => (
              <Link 
                key={product.name} 
                to={product.path} 
                className="feature-card group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <product.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">{product.name}</h3>
                <p className="text-sinod-text-secondary text-sm">
                  {i === 0 && 'Physical, virtual & hybrid events with unlimited registrations'}
                  {i === 1 && 'Beautiful forms with conditional logic'}
                  {i === 2 && 'Real-time collaboration & whiteboards'}
                  {i === 3 && 'Send to unlimited contacts'}
                  {i === 4 && 'Live leaderboards & engagement'}
                  {i === 5 && 'Auto-generate & deliver'}
                  {i === 6 && 'Your 24/7 intelligent assistant'}
                </p>
                <div className="mt-4 flex items-center text-sinod-cyan text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
                Pay for What You Use. Nothing More.
              </h2>
              <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
                Most features are free. Only pay for emails, certificates, AI requests, and paid events.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Free Plan */}
              <div className="glass-card-strong p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-sinod-cyan/20 flex items-center justify-center">
                    <Infinity className="w-6 h-6 text-sinod-cyan" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-sinod-text">Free Forever</h3>
                    <p className="text-sinod-text-secondary text-sm">Everything to get started</p>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {['Unlimited events', 'Unlimited forms', 'Unlimited documents', 'Unlimited quizzes', 'team chat', 'Unlimited team members'].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-sinod-cyan flex-shrink-0" />
                      <span className="text-sinod-text">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <span className="font-heading text-4xl font-bold text-sinod-cyan">$0</span>
                  <span className="text-sinod-text-secondary">/month</span>
                </div>
              </div>
              {/* Pay Per Use */}
              <div className="glass-card-strong p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-sinod-violet/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-sinod-violet" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-sinod-text">Pay Per Use</h3>
                    <p className="text-sinod-text-secondary text-sm">Only when you need more</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-sinod-cyan" />
                      <span className="text-sinod-text">Emails</span>
                    </div>
                    <span className="text-sinod-cyan font-medium">$0.99/1000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-sinod-cyan" />
                      <span className="text-sinod-text">Certificates</span>
                    </div>
                    <span className="text-sinod-cyan font-medium">$0.50/100</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-sinod-cyan" />
                      <span className="text-sinod-text">Paid Events</span>
                    </div>
                    <span className="text-sinod-cyan font-medium">5% fee</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-sinod-cyan" />
                      <span className="text-sinod-text">AI Requests</span>
                    </div>
                    <span className="text-sinod-cyan font-medium">$1.99/1000</span>
                  </div>
                </div>
                <Link to="/pricing" className="btn-secondary w-full text-center">
                  Use Price Estimator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-sinod-text-secondary">
              Whoever you are, we've got you covered.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="feature-card text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                  <useCase.icon className="w-7 h-7 text-sinod-cyan" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">{useCase.title}</h3>
                <p className="text-sinod-text-secondary text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
                Loved by Early Users
              </h2>
              <p className="text-lg text-sinod-text-secondary">
                Here's what our beta community is saying.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="glass-card-strong p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sinod-text mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                      <span className="text-sinod-cyan font-medium">{testimonial.author[0]}</span>
                    </div>
                    <div>
                      <p className="text-sinod-text font-medium text-sm">{testimonial.author}</p>
                      <p className="text-sinod-text-secondary text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
