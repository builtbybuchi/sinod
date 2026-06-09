import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Download,
  Copy,
  Check,
  Palette,
  FileText,
  ArrowRight,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const logoVariants = [
  { name: 'Primary Logo', description: 'Full color logo', bg: 'bg-white', color: 'text-sinod-text', downloadUrl: 'https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854019/3_jy0mnr.png' },
  { name: 'Monochrome logo', description: 'For dark b&w designs', bg: 'bg-white', color: 'text-pngwhite', downloadUrl: 'https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854009/8_sww5be.png' },
  { name: 'For dark backgrounds', description: 'Use this for dark backgrounds', bg: 'bg-slate-900', color: 'text-gray-800', downloadUrl: 'https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854019/5_x4jd3n.png' },
  { name: 'Primary Logo', description: 'Just the Nexus S-mark', bg: 'bg-white', color: 'text-sinod-cyan', downloadUrl: 'https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854019/4_os509a.png' },
  { name: 'Monochrome logo', description: 'Full color logo', bg: 'bg-white', color: 'text-sinod-text', downloadUrl: 'https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854009/10_q597cx.png' },
  { name: 'Light logo - for dark backgrounds', description: 'For dark backgrounds', bg: 'bg-slate-900', color: 'text-white', downloadUrl: 'https://res.cloudinary.com/dlvffw5wt/image/upload/v1771854009/7_nfof9x.png' },
];

const colorPalette = [
  { name: 'Primary base', hex: '#0a0e17ff', rgb: '10, 14, 23', usage: 'Primary accent, CTAs, highlights' },
  { name: 'Action color', hex: '#4ccaf0ff', rgb: '76, 201, 240', usage: 'Secondary accent, gradients' },
  { name: 'Surfacce', hex: '#1c2331ff', rgb: '27, 34, 48', usage: 'Backgrounds, dark sections' },
  { name: 'Creative color', hex: '#7209b7ff', rgb: '114, 9, 183', usage: 'Primary accent, CTAs, highlights' },
  { name: 'Logic color', hex: '#4895efff', rgb: '72, 149, 239', usage: 'Secondary accent, gradients' },
  { name: 'Text Primary', hex: 'hsla(210, 40%, 98%, 1.00)', rgb: '248, 250, 252', usage: 'Headings, primary text' },
  { name: 'Text Secondary', hex: '#94a3b8ff', rgb: '148, 163, 184', usage: 'Body text, descriptions' },
];

const brandGuidelines = [
  {
    title: 'Logo Clear Space',
    description: 'Maintain adequate space around the logo. The minimum clear space is equal to the height of the S-mark.',
    do: 'Give the logo room to breathe',
    dont: 'Crowd the logo with other elements'
  },
  {
    title: 'Logo Size',
    description: 'Never display the logo smaller than 24px in height for digital or 0.5 inches for print.',
    do: 'Use appropriate sizes for visibility',
    dont: 'Make the logo too small to read'
  },
  {
    title: 'Logo Colors',
    description: 'Use the approved color variations. Never alter the logo colors outside of the approved palette.',
    do: 'Use approved color variants',
    dont: 'Change colors or apply effects'
  },
  {
    title: 'Logo Placement',
    description: 'Place the logo on clean, uncluttered backgrounds for maximum impact.',
    do: 'Use on simple backgrounds',
    dont: 'Place over busy images'
  }
];

export function MediaKitPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

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

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

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
              Sinod' <span className="text-gradient">Brand Resources</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary max-w-2xl mx-auto mb-8">
              Official logos, brand guidelines, and press resources for media, partners, and anyone 
              writing about Sinod'.
            </p>
            <a 
              href="#"
              className="btn-primary inline-flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                alert('Download package coming soon!');
              }}
            >
              <Download className="w-5 h-5" />
              Download Full Kit
            </a>
          </div>
        </div>
      </section>

      {/* Logo Variants */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Logo Variants
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Use these approved logo variations. Download individual files or the complete package.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 gap-6">
            {logoVariants.map((variant) => (
              <div key={variant.name} className="glass-card-strong overflow-hidden">
                <div className={`h-48 ${variant.bg} flex items-center justify-center p-4`}>
                  <img 
                    src={variant.downloadUrl} 
                    alt={variant.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-lg font-semibold text-sinod-text mb-1">
                    {variant.name}
                  </h3>
                  <p className="text-sinod-text-secondary text-sm mb-4">
                    {variant.description}
                  </p>
                  <a 
                    href={variant.downloadUrl}
                    download
                    className="flex items-center justify-center gap-2 w-full btn-secondary text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Color Palette
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Our brand colors. Click to copy hex codes.
            </p>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorPalette.map((color) => (
              <div key={color.name} className="glass-card-strong overflow-hidden">
                <div 
                  className="h-32 flex items-end p-4"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className={`font-heading text-lg font-bold ${
                    color.name === 'Sinod Cyan' || color.name === 'Text Primary' 
                      ? 'text-slate-900' 
                      : 'text-white'
                  }`}>
                    {color.hex}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-lg font-semibold text-sinod-text">
                      {color.name}
                    </h3>
                    <button
                      onClick={() => copyColor(color.hex)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-sinod-cyan/20 transition-colors"
                    >
                      {copiedColor === color.hex ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-sinod-text-secondary" />
                      )}
                    </button>
                  </div>
                  <p className="text-sinod-text-secondary text-sm mb-2">
                    RGB: {color.rgb}
                  </p>
                  <p className="text-sinod-text-secondary text-xs">
                    {color.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Guidelines */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Brand Guidelines
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              How to (and how not to) use our brand assets.
            </p>
          </div>

          <div className="animate-section grid gap-6">
            {brandGuidelines.map((guideline) => (
              <div key={guideline.title} className="glass-card-strong p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="product-icon w-12 h-12 flex-shrink-0">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-sinod-text mb-2">
                      {guideline.title}
                    </h3>
                    <p className="text-sinod-text-secondary">
                      {guideline.description}
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Do</span>
                    </div>
                    <p className="text-sinod-text-secondary text-sm">{guideline.do}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Don't</span>
                    </div>
                    <p className="text-sinod-text-secondary text-sm">{guideline.dont}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Resources */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Press Resources
            </h2>
            <p className="text-sinod-text-secondary max-w-2xl mx-auto">
              Company information and recent press releases.
            </p>
          </div>

          <div className="animate-section max-w-4xl mx-auto">
            {/* Company Info */}
            <div className="glass-card-strong p-8 mb-8">
              <h3 className="font-heading text-xl font-semibold text-sinod-text mb-6">
                Company Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sinod-text-secondary text-sm mb-1">Company Name</p>
                  <p className="text-sinod-text">Sinod' (A product of Lexrunit Limited)</p>
                </div>
                <div>
                  <p className="text-sinod-text-secondary text-sm mb-1">Founded</p>
                  <p className="text-sinod-text">2024</p>
                </div>
                <div>
                  <p className="text-sinod-text-secondary text-sm mb-1">Headquarters</p>
                  <p className="text-sinod-text">Enugu, Nigeria</p>
                </div>
                <div>
                  <p className="text-sinod-text-secondary text-sm mb-1">Website</p>
                  <a href="https://sinod.app" className="text-sinod-cyan hover:underline">
                    sinod.app
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Press Contact */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section glass-card-strong text-center p-8 lg:p-12 max-w-3xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center">
              <FileText className="w-10 h-10 text-sinod-cyan" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Press Inquiries
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              For interview requests, additional assets, or any press-related questions, 
              please reach out to our communications team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:contact@sinod.app" className="btn-primary">
                Contact Press Team
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </a>
              <Link to="/news" className="btn-secondary">
                View All News
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
