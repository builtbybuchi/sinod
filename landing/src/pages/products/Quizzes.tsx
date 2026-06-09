import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Trophy,
  Award,
  Check,
  GraduationCap,
  Wine,
  IceCream,
  BookOpen,
  Users,
  Target
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const quizTypes = [
  { icon: GraduationCap, title: 'Training assessments', description: 'Evaluate learning progress' },
  { icon: Wine, title: 'Trivia nights', description: 'Fun team competitions' },
  { icon: IceCream, title: 'Icebreakers', description: 'Start meetings right' },
  { icon: BookOpen, title: 'Knowledge checks', description: 'Quick comprehension tests' },
  { icon: Users, title: 'Team building', description: 'Strengthen connections' },
  { icon: Target, title: 'Classroom quizzes', description: 'Engage students' },
  { icon: Trophy, title: 'Audience engagement', description: 'Interactive presentations' },
  { icon: Award, title: 'Certification prep', description: 'Practice for exams' },
];

const liveFeatures = [
  'Mobile-friendly',
  'Live scoreboard',
  'Answer reveal animations',
  'Time limits',
  'Multiple choice, true/false, short answer',
];

export function ProductQuizzes() {
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
              Quizzes That Engage. Leaderboards That Excite.
            </h1>
            
            <p className="text-lg text-sinod-text-secondary mb-8 max-w-2xl mx-auto">
              Host unlimited quizzes with live scoring and real-time leaderboards.
            </p>
            
            <a href="https://my.sinod.app/signup" className="btn-primary inline-flex">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* Quiz Types Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text mb-4">
              Any Quiz. Any Purpose.
            </h2>
          </div>

          <div className="animate-section grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {quizTypes.map((type) => (
              <div key={type.title} className="glass-card p-5 text-center">
                <type.icon className="w-8 h-8 mx-auto mb-3 text-sinod-cyan" />
                <h3 className="font-heading text-sm font-semibold text-sinod-text mb-1">{type.title}</h3>
                <p className="text-sinod-text-secondary text-xs">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Experience Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Real-Time. Real Fun.
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Participants join on their phones. Questions appear. Scores update instantly.
                </p>
                <ul className="space-y-3">
                  {liveFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sinod-text">
                      <Check className="w-5 h-5 text-sinod-cyan flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-card-strong p-6">
                <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/Capture_d_%C3%A9cran_du_2026-02-24_14-25-34_cclxex" alt="Sinod' Quiz" className="rounded-xl w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
              Everyone Loves to See Their Name
            </h2>
            <p className="text-sinod-text-secondary mb-8">
              Real-time ranking. Friendly competition. Engaged audiences.
            </p>
            <div className="glass-card-strong p-6">
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Alex Chen', score: 9850 },
                  { rank: 2, name: 'Sarah Miller', score: 9720 },
                  { rank: 3, name: 'Jordan Park', score: 9680 },
                  { rank: 4, name: 'Emma Wilson', score: 9540 },
                  { rank: 5, name: 'David Kim', score: 9490 },
                ].map((player) => (
                  <div 
                    key={player.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.rank === 1 ? 'bg-sinod-cyan/10 border border-sinod-cyan/20' :
                      player.rank === 2 ? 'bg-sinod-indigo/10 border border-sinod-indigo/20' :
                      player.rank === 3 ? 'bg-sinod-violet/10 border border-sinod-violet/20' :
                      'bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-heading font-bold w-8 ${
                        player.rank === 1 ? 'text-sinod-cyan' :
                        player.rank === 2 ? 'text-sinod-indigo' :
                        player.rank === 3 ? 'text-sinod-violet' :
                        'text-sinod-text-secondary'
                      }`}>#{player.rank}</span>
                      <span className="text-sinod-text">{player.name}</span>
                    </div>
                    <span className="font-heading font-semibold text-sinod-text">{player.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificates Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-section max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="glass-card-strong p-6">
                <img src="https://res.cloudinary.com/dlvffw5wt/image/upload/f_jpg/q_auto:low/Capture_d_%C3%A9cran_du_2026-02-24_14-19-18_r2urcs" alt="Sinod' Quize Page" className="rounded-xl w-full" />
              </div>
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                  Automatically Recognize Achievement
                </h2>
                <p className="text-sinod-text-secondary mb-6">
                  Set templates once. When someone completes your quiz, we generate and send their certificate instantly.
                </p>
                <ul className="space-y-3">
                  {['Custom designs', 'Auto-fill participant info', 'PDF delivery', '$0.50 per 100 certificates'].map((item) => (
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
              Quizzes Without the Catch
            </h2>

            <div className="glass-card-strong overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/[0.06] text-sm font-medium">
                <span className="text-sinod-text-secondary">Platform</span>
                <span className="text-center">Free Tier</span>
                <span className="text-center">Paid</span>
                <span className="text-center text-sinod-cyan">Sinod'</span>
              </div>
              {[
                { name: 'Kahoot', free: 'Basic only', paid: '$17/mo', us: 'Unlimited' },
                { name: 'Quizizz', free: 'Limits apply', paid: '$10/mo', us: 'Unlimited' },
                { name: 'Mentimeter', free: '2 quizzes', paid: '$11.99/mo', us: 'Unlimited' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-white/[0.06] text-sm">
                  <span className="text-sinod-text">{row.name}</span>
                  <span className="text-center text-sinod-text-secondary">{row.free}</span>
                  <span className="text-center text-sinod-text-secondary">{row.paid}</span>
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
              Make Learning Fun Again
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
