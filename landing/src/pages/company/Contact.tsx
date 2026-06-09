import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const offices = [
  {
    city: 'Enugu State',
    address: '',
    phone: ''
  },
  {
    city: 'Nigeria',
    address: '',
    phone: '+234 (0) 913-505-5175'
  }
];

const inquiryTypes = [
  'General Inquiry',
  'Sales',
  'Support',
  'Partnerships',
  'Press',
  'Careers',
  'Other'
];

export function ContactPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', inquiryType: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-sinod-base pt-20" ref={sectionRef}>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sinod-cyan/10 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="animate-section max-w-4xl mx-auto text-center">
         
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto">
              Have a question or want to work together? We'd love to hear from you. 
              Reach out and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <div className="glass-card-strong p-8">
                <h2 className="font-heading text-2xl font-semibold text-sinod-text mb-6">
                  Send Us a Message
                </h2>
                
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-sinod-text mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sinod-text-secondary">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sinod-text text-sm mb-2">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full glass-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sinod-text text-sm mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full glass-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sinod-text text-sm mb-2">Inquiry Type</label>
                      <select
                        required
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="w-full glass-input"
                      >
                        <option value="">Select an option</option>
                        {inquiryTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sinod-text text-sm mb-2">Message</label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can we help you?"
                        rows={5}
                        className="w-full glass-input resize-none"
                      />
                    </div>
                    
                    <button type="submit" className="w-full btn-primary">
                      Send Message
                      <ArrowRight className="w-5 h-5 inline-block ml-2" />
                    </button>
                  </form>
                )}
              </div>

              {/* Info */}
              <div>
                <h2 className="font-heading text-2xl font-semibold text-sinod-text mb-6">
                  Our Offices
                </h2>
                
                <div className="space-y-6">
                  {offices.map((office) => (
                    <div key={office.city} className="glass-card p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <MapPin className="w-5 h-5 text-sinod-cyan" />
                        <h3 className="font-heading text-lg font-semibold text-sinod-text">
                          {office.city}
                        </h3>
                      </div>
                      <p className="text-sinod-text-secondary text-sm mb-2">
                        {office.address}
                      </p>
                      <div className="flex items-center gap-2 text-sinod-text-secondary text-sm">
                        <Phone className="w-4 h-4" />
                        {office.phone}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 glass-card">
                  <h3 className="font-heading text-lg font-semibold text-sinod-text mb-3">
                    Response Times
                  </h3>
                  <ul className="space-y-2 text-sinod-text-secondary text-sm">
                    <li className="flex items-center justify-between">
                      <span>General inquiries</span>
                      <span className="text-sinod-cyan">Within 48 hours</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Sales questions</span>
                      <span className="text-sinod-cyan">Within 48 hours</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Support requests</span>
                      <span className="text-sinod-cyan">Within 48 hours</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Have a Quick Question?
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Check out our FAQ section for answers to common questions.
            </p>
            <Link to="/resources/faq" className="btn-primary">
              View FAQ
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
