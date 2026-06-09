import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Target, 
  Heart, 
  Users, 
  Zap
} from 'lucide-react';
// import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const values = [
  { icon: Target, title: 'Purpose-Driven', description: 'We build tools that help communities thrive and make a positive impact.' },
  { icon: Heart, title: 'Human-Centered', description: 'Technology should serve people, not the other way around.' },
  { icon: Users, title: 'Community-First', description: 'We eat our own dog food and build for the communities we belong to.' },
  { icon: Zap, title: 'Efficiency', description: 'Do more with less. Eliminate bloat and focus on what matters.' },
];

// const milestones = [
//   { year: '2024', title: 'The Idea', description: 'Frustrated with subscription creep, our founder envisioned a better way.' },
//   { year: '2025', title: 'Development Begins', description: 'A small team came together to build the first version of Sinod\'.' },
//   { year: '2025', title: 'Beta Launch', description: '10,000+ communities joined our beta program and shaped the product.' },
//   { year: '2026', title: 'Public Launch', description: 'Sinod\' becomes available to everyone on March 31, 2026.' },
// ];

// const team = [
//   { name: 'Sarah Chen', role: 'CEO & Co-Founder', bio: 'Former community manager turned entrepreneur. Obsessed with building tools that actually help people.' },
//   { name: 'Marcus Johnson', role: 'CTO & Co-Founder', bio: 'Full-stack developer with 15 years of experience. Believes in elegant solutions to complex problems.' },
//   { name: 'Emily Rodriguez', role: 'Head of Product', bio: 'Product leader who previously built community tools at scale. User advocate #1.' },
//   { name: 'David Kim', role: 'Head of Engineering', bio: 'Engineering leader passionate about performance and reliability. Keeps our systems running smoothly.' },
// ];

const stats = [
  { value: '10K+', label: 'Target Users' },
  { value: '5+', label: 'Team Members' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50+', label: 'Target Countries' },
];

export function AboutPage() {
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
          <div className="absolute top-20 left-20 w-96 h-96 bg-sinod-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-sinod-violet/20 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section max-w-4xl mx-auto text-center">
      
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              We're Building the Future of <span className="text-gradient">Community</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
              Sinod' was founded with a simple mission: to help communities do more with less. 
              We believe that when people come together with the right tools, amazing things happen.
            </p>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
                  Built by Someone Who Lived the Frustration
                </h2>
                <div className="space-y-4 text-sinod-text-secondary text-lg">
                  <p>
                    It started with a simple task: managing a community website for a local organization. 
                    What seemed straightforward quickly became a nightmare of subscriptions, integrations, 
                    and forgotten passwords.
                  </p>
                  <p>
                    We were paying for 15 different tools, using maybe 20% of the features we were paying for. 
                    The monthly bills kept adding up, and nothing talked to each other.
                  </p>
                  <p>
                    So we built something better. A unified platform that combines all essential tools 
                    in one place, with fair pricing that doesn't penalize you for growing.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 overflow-hidden">
                  <img 
                    src="https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854010/9_ag9ntq.png" 
                    alt="Sinod' Origin" 
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-heading text-4xl lg:text-5xl font-bold text-gradient mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sinod-text-secondary">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32">
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
    </div>
  );
}
