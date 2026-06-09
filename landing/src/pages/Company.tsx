import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Target, 
  Heart, 
  Users, 
  Zap, 
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Calendar
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const values = [
  { icon: Target, title: 'Purpose-Driven', description: 'We build tools that help communities thrive and make a positive impact.' },
  { icon: Heart, title: 'Human-Centered', description: 'Technology should serve people, not the other way around.' },
  { icon: Users, title: 'Community-First', description: 'We eat our own dog food and build for the communities we belong to.' },
  { icon: Zap, title: 'Efficiency', description: 'Do more with less. Eliminate bloat and focus on what matters.' },
];

const team = [
  { name: 'Sarah Chen', role: 'CEO & Co-Founder', image: '/logo-mark.png' },
  { name: 'Marcus Johnson', role: 'CTO & Co-Founder', image: '/logo-mark.png' },
  { name: 'Emily Rodriguez', role: 'Head of Product', image: '/logo-mark.png' },
  { name: 'David Kim', role: 'Head of Engineering', image: '/logo-mark.png' },
];

const openPositions = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote' },
  { title: 'Product Designer', department: 'Design', location: 'San Francisco' },
  { title: 'Customer Success Manager', department: 'Success', location: 'Remote' },
  { title: 'DevOps Engineer', department: 'Engineering', location: 'Remote' },
];

export function CompanyPage() {
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
      <section className="relative py-20 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              We're Building the Future of <span className="text-gradient">Community</span>.
            </h1>
            <p className="text-lg text-sinod-text-secondary">
              Sinod' was founded with a simple mission: to help communities do more with less. 
              We believe that when people come together with the right tools, amazing things happen.
            </p>
          </div>
        </div>
      </section>

      {/* Origin Story Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6 text-center">
              Built by Someone Who Lived the Frustration
            </h2>
            <div className="space-y-6 text-sinod-text-secondary text-lg">
              <p>
                I managed a website for an organization. I watched us pay for tools we barely used. 
                I connected with developers who wanted to build something better—not cheaper, but smarter.
              </p>
              <p>
                This platform exists because I lived your frustration. Every feature was chosen because real people actually needed it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Our Values
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="feature-card text-center">
                <div className="product-icon w-14 h-14 mx-auto mb-4">
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">
                  {value.title}
                </h3>
                <p className="text-sinod-text-secondary text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Launch Timeline Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
              We're Fire-Testing Right Now
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              The platform is built. Most features are ready. We're stress-testing with millions of concurrent operations 
              to ensure you never experience downtime.
            </p>
            
            <div className="glass-card-strong p-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Calendar className="w-8 h-8 text-sinod-cyan" />
                <span className="font-heading text-2xl font-semibold text-sinod-text">Public Launch: March 31, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Meet the Team
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              The people behind Sinod' who are passionate about community.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="glass-card p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
                  <img src={member.image} alt={member.name} className="w-16 h-16" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-1">
                  {member.name}
                </h3>
                <p className="text-sinod-text-secondary text-sm">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Join Our Team
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              We're always looking for talented people who share our passion for community.
            </p>
          </div>

          <div className="animate-section max-w-3xl mx-auto space-y-4">
            {openPositions.map((position) => (
              <div key={position.title} className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-sinod-text mb-1">
                    {position.title}
                  </h3>
                  <p className="text-sinod-text-secondary text-sm">
                    {position.department} • {position.location}
                  </p>
                </div>
                <button className="btn-secondary text-sm whitespace-nowrap">
                  Apply Now
                  <ArrowRight className="w-4 h-4 inline-block ml-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong p-8 lg:p-12 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                Get in Touch
              </h2>
              <p className="text-sinod-text-secondary">
                Have a question or want to work together? We'd love to hear from you.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="product-icon w-12 h-12 mx-auto mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <p className="text-sinod-text-secondary text-sm">hello@sinod.io</p>
              </div>
              <div className="text-center">
                <div className="product-icon w-12 h-12 mx-auto mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <p className="text-sinod-text-secondary text-sm">+1 (555) 123-4567</p>
              </div>
              <div className="text-center">
                <div className="product-icon w-12 h-12 mx-auto mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-sinod-text-secondary text-sm">San Francisco, CA</p>
              </div>
            </div>

            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Your Name" className="glass-input" />
                <input type="email" placeholder="Your Email" className="glass-input" />
              </div>
              <input type="text" placeholder="Subject" className="glass-input" />
              <textarea placeholder="Your Message" rows={4} className="glass-input resize-none" />
              <button type="submit" className="w-full btn-primary">
                Send Message
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
