import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  History,
  Users,
  MessageSquare,
  FileEdit,
  File,
  StickyNote,
  Shapes,
  Pencil,
  Image,
  GitBranch,
  Vote,
  Briefcase,
  GraduationCap,
  Lightbulb,
  BookOpen,
  Calendar
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const docFeatures = [
  { icon: Users, title: 'Simultaneous editing', description: 'Work together in real-time' },
  { icon: MessageSquare, title: 'Comment threads', description: 'Discuss without clutter' },
  { icon: History, title: 'Version history', description: 'Never lose your work' },
  { icon: FileEdit, title: 'Suggesting mode', description: 'Review changes easily' },
  { icon: File, title: 'Export to PDF/Word', description: 'Share anywhere' },
];

const whiteboardFeatures = [
  { icon: StickyNote, title: 'Sticky notes', description: 'Capture ideas quickly' },
  { icon: Shapes, title: 'Shapes & connectors', description: 'Build diagrams' },
  { icon: Pencil, title: 'Freehand drawing', description: 'Sketch naturally' },
  { icon: Image, title: 'Image uploads', description: 'Add visuals' },
  { icon: GitBranch, title: 'Mind maps', description: 'Organize thoughts' },
  { icon: GitBranch, title: 'Flowcharts', description: 'Map processes' },
  { icon: Calendar, title: 'Timelines', description: 'Plan projects' },
  { icon: Vote, title: 'Voting & reactions', description: 'Get feedback' },
];

const useCases = [
  { icon: Users, title: 'Remote team meetings', description: 'Collaborate from anywhere' },
  { icon: Briefcase, title: 'Project planning', description: 'Map out deliverables' },
  { icon: GraduationCap, title: 'Client workshops', description: 'Engage stakeholders' },
  { icon: Calendar, title: 'Content calendars', description: 'Plan your content' },
  { icon: Lightbulb, title: 'Strategy sessions', description: 'Brainstorm together' },
  { icon: MessageSquare, title: 'Brainstorming', description: 'Generate ideas' },
  { icon: BookOpen, title: 'Lesson planning', description: 'Prepare courses' },
];

export function ProductDocuments() {
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
              Write Together. Whiteboard Together. Pay Never.
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Real-time document collaboration and infinite whiteboards. Like Google Docs and Miro, 
              but united—and free forever.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* The Collaboration Problem Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
              You Shouldn't Need 3 Tools to Plan One Project
            </h2>
            <div className="space-y-4 text-sinod-text-secondary max-w-2xl mx-auto">
              <p>
                You draft in Google Docs. You brainstorm in Miro. You finalize in Notion. 
                Then you email versions. Then someone edits the wrong file.
              </p>
              <p className="text-sinod-cyan font-medium text-xl">
                We combined documents and whiteboards into one seamless space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
                  Real-Time Writing. Real-Time Editing.
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {docFeatures.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3">
                      <div className="product-icon w-10 h-10 flex-shrink-0">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sinod-text font-medium text-sm">{feature.title}</p>
                        <p className="text-sinod-text-secondary text-xs">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card-strong p-6">
                <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/Capture_d_%C3%A9cran_du_2026-02-24_14-32-26_j4nfzt" alt="Sinod' Whiteboard" className="rounded-xl w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Whiteboards Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 glass-card-strong p-6 h-64 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-4">
                  {whiteboardFeatures.slice(0, 4).map((feature) => (
                    <div key={feature.title} className="w-16 h-16 rounded-lg bg-white/[0.06] flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-sinod-cyan" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
                  Infinite Canvas. Infinite Ideas.
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {whiteboardFeatures.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3">
                      <div className="product-icon w-10 h-10 flex-shrink-0">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sinod-text font-medium text-sm">{feature.title}</p>
                        <p className="text-sinod-text-secondary text-xs">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              How People Use Documents + Whiteboards
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

      {/* Pricing Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-8">
              How Much?
            </h2>
            <div className="space-y-4">
              <div className="glass-card p-6 flex items-center justify-between">
                <span className="text-sinod-text text-lg">Documents</span>
                <span className="font-heading text-2xl font-bold text-sinod-cyan">Free</span>
              </div>
              <div className="glass-card p-6 flex items-center justify-between">
                <span className="text-sinod-text text-lg">Whiteboards</span>
                <span className="font-heading text-2xl font-bold text-sinod-cyan">Free</span>
              </div>
              <div className="glass-card p-6 flex items-center justify-between">
                <span className="text-sinod-text text-lg">Combining them</span>
                <span className="font-heading text-2xl font-bold text-sinod-cyan">Free</span>
              </div>
              <div className="glass-card p-6 flex items-center justify-between">
                <span className="text-sinod-text text-lg">Inviting your whole team</span>
                <span className="font-heading text-2xl font-bold text-sinod-cyan">Free</span>
              </div>
              <div className="glass-card-strong p-6 flex items-center justify-between border-sinod-cyan/30">
                <span className="text-sinod-text text-xl font-medium">Everything</span>
                <span className="font-heading text-3xl font-bold text-sinod-cyan">Free</span>
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
              Stop Pasting Links Between Apps. Start Creating.
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
