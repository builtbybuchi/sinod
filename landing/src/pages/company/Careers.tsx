import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Briefcase, 
  ArrowRight,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Zap,
  Users,
  Coffee,
  Laptop,
  BookOpen
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  { icon: DollarSign, title: 'Competitive Salary', description: 'Fair compensation based on experience and market rates' },
  { icon: Heart, title: 'Health Coverage', description: 'Comprehensive health, dental, and vision insurance' },
  { icon: Laptop, title: 'Remote First', description: 'Work from anywhere with flexible hours' },
  { icon: BookOpen, title: 'Learning Budget', description: '$2,000 annual budget for courses and conferences' },
  { icon: Coffee, title: 'Home Office Stipend', description: '$1,000 to set up your perfect workspace' },
  { icon: Users, title: 'Team Retreats', description: 'Quarterly gatherings to connect in person' },
];

const departments = ['All', 'Engineering', 'Design', 'Product', 'Success', 'Marketing'];

interface Position {
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
}

const openPositions: Position[] = [
 /*
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
    salary: '$130k - $170k',
    description: 'Define product strategy and work with engineering to ship great features.',
    requirements: ['3+ years PM experience', 'Technical background', 'Data-driven mindset']
  },

  */

];

export function CareersPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeDepartment, setActiveDepartment] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Position | null>(null);

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

  const filteredPositions = activeDepartment === 'All' 
    ? openPositions 
    : openPositions.filter(pos => pos.department === activeDepartment);

  return (
    <div className="min-h-screen bg-sinod-base pt-20" ref={sectionRef}>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-sinod-violet/20 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sinod-cyan/10 border border-sinod-cyan/20 mb-6">
              <Briefcase className="w-4 h-4 text-sinod-cyan" />
              <span className="text-sm font-medium text-sinod-cyan">Careers</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Join Our <span className="text-gradient">Team</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
              We're building something special and looking for talented people who share our 
              passion for community. Come make an impact with us.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Why Work at Sinod'?
            </h2>
            <p className="text-sinod-text-secondary">
              We're creating a workplace where you can do your best work and thrive.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="feature-card text-center">
                <div className="product-icon w-14 h-14 mx-auto mb-4">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sinod-text-secondary text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Open Positions
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Find your next role and help us build the future of community management.
            </p>
          </div>

          {/* Department Filters */}
          <div className="animate-section flex flex-wrap gap-2 justify-center mb-12">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDepartment(dept)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeDepartment === dept
                    ? 'bg-sinod-cyan text-white'
                    : 'bg-white/5 text-sinod-text-secondary hover:bg-white/10'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="animate-section max-w-4xl mx-auto space-y-4">
            {filteredPositions.map((position) => (
              <div 
                key={position.title}
                className="glass-card-strong p-6 cursor-pointer hover:border-sinod-cyan/30 transition-colors"
                onClick={() => setSelectedJob(position)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-sinod-text mb-1">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-sinod-text-secondary">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </span>
                      <span className="flex items-center gap-1 text-sinod-cyan">
                        <DollarSign className="w-4 h-4" />
                        {position.salary}
                      </span>
                    </div>
                  </div>
                  <button className="btn-secondary text-sm whitespace-nowrap self-start sm:self-auto">
                    View Details
                    <ArrowRight className="w-4 h-4 inline-block ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPositions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sinod-text-secondary">
                No open positions. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedJob(null)}
        >
          <div 
            className="glass-card-strong max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-heading text-2xl font-semibold text-sinod-text mb-2">
                  {selectedJob.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-sinod-text-secondary">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {selectedJob.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedJob.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedJob.type}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-sinod-text-secondary hover:text-sinod-text"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <span className="text-sinod-cyan font-medium">{selectedJob.salary}</span>
            </div>

            <p className="text-sinod-text-secondary mb-6">
              {selectedJob.description}
            </p>

            <div className="mb-8">
              <h4 className="font-heading text-lg font-semibold text-sinod-text mb-3">
                Requirements
              </h4>
              <ul className="space-y-2">
                {selectedJob.requirements.map((req) => (
                  <li key={req} className="flex items-center gap-2 text-sinod-text-secondary">
                    <Zap className="w-4 h-4 text-sinod-cyan" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4">
              <a 
                href={`mailto:careers@sinod.io?subject=Application: ${selectedJob.title}`}
                className="btn-primary flex-1 text-center"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </a>
              <button 
                onClick={() => setSelectedJob(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Application CTA */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Don't See a Perfect Fit?
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              We're always looking for talented people. Send us your resume and tell us 
              how you can contribute to our mission.
            </p>
            <a 
              href="mailto:contact@sinod.app?subject=General Application"
              className="btn-primary"
            >
              Send General Application
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
