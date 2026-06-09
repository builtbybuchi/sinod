import { useState } from 'react';
import { Trophy, Clock, Users, ArrowRight, Search, Filter, Star, TrendingUp } from 'lucide-react';

const categories = ['All', 'Technology', 'Business', 'Design', 'General Knowledge', 'Community'];

const quizzes = [
  {
    id: 1,
    title: 'Community Management 101',
    category: 'Business',
    questions: 15,
    time: '20 min',
    participants: 1234,
    difficulty: 'Beginner',
    rating: 4.8,
    image: '/ui-quizzes.jpg',
  },
  {
    id: 2,
    title: 'Design Systems Quiz',
    category: 'Design',
    questions: 20,
    time: '25 min',
    participants: 892,
    difficulty: 'Intermediate',
    rating: 4.6,
    image: '/ui-forms.jpg',
  },
  {
    id: 3,
    title: 'AI & Machine Learning Basics',
    category: 'Technology',
    questions: 25,
    time: '30 min',
    participants: 2156,
    difficulty: 'Intermediate',
    rating: 4.9,
    image: '/ui-ai.jpg',
  },
  {
    id: 4,
    title: 'Event Planning Mastery',
    category: 'Business',
    questions: 18,
    time: '22 min',
    participants: 567,
    difficulty: 'Advanced',
    rating: 4.7,
    image: '/ui-events.jpg',
  },
  {
    id: 5,
    title: 'Newsletter Writing Challenge',
    category: 'Business',
    questions: 12,
    time: '15 min',
    participants: 445,
    difficulty: 'Beginner',
    rating: 4.5,
    image: '/ui-newsletter.jpg',
  },
  {
    id: 6,
    title: 'General Knowledge Trivia',
    category: 'General Knowledge',
    questions: 30,
    time: '35 min',
    participants: 3421,
    difficulty: 'Mixed',
    rating: 4.4,
    image: '/ui-documents.jpg',
  },
];

const leaderboard = [
  { rank: 1, name: 'Alex Chen', score: 9850, quizzes: 45, avatar: 'AC' },
  { rank: 2, name: 'Sarah Miller', score: 9720, quizzes: 42, avatar: 'SM' },
  { rank: 3, name: 'Jordan Park', score: 9680, quizzes: 38, avatar: 'JP' },
  { rank: 4, name: 'Emma Wilson', score: 9540, quizzes: 41, avatar: 'EW' },
  { rank: 5, name: 'David Kim', score: 9490, quizzes: 39, avatar: 'DK' },
];

export function ExploreQuizzes() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesCategory = selectedCategory === 'All' || quiz.category === selectedCategory;
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-sinod-base pt-20">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Explore <span className="text-gradient">Quizzes</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary mb-8">
              Test your knowledge, challenge yourself, and climb the leaderboard. 
              Learn while having fun with community-created quizzes.
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sinod-text-secondary" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-12 pr-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="glass-card-strong p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-sinod-cyan" />
              <h2 className="font-heading text-xl font-semibold text-sinod-text">
                Global Leaderboard
              </h2>
              <TrendingUp className="w-5 h-5 text-sinod-violet" />
            </div>
            
            <div className="grid grid-cols-5 gap-4 text-sm text-sinod-text-secondary mb-4 px-4">
              <span>Rank</span>
              <span className="col-span-2">Player</span>
              <span>Quizzes</span>
              <span className="text-right">Score</span>
            </div>
            
            <div className="space-y-2">
              {leaderboard.map((player) => (
                <div 
                  key={player.rank}
                  className={`grid grid-cols-5 gap-4 items-center p-4 rounded-xl ${
                    player.rank === 1 ? 'bg-sinod-cyan/10 border border-sinod-cyan/20' :
                    player.rank === 2 ? 'bg-sinod-indigo/10 border border-sinod-indigo/20' :
                    player.rank === 3 ? 'bg-sinod-violet/10 border border-sinod-violet/20' :
                    'bg-white/[0.04]'
                  }`}
                >
                  <span className={`font-heading font-bold ${
                    player.rank === 1 ? 'text-sinod-cyan' :
                    player.rank === 2 ? 'text-sinod-indigo' :
                    player.rank === 3 ? 'text-sinod-violet' :
                    'text-sinod-text-secondary'
                  }`}>
                    #{player.rank}
                  </span>
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sinod-cyan/20 to-sinod-violet/20 flex items-center justify-center text-sm font-medium text-sinod-text">
                      {player.avatar}
                    </div>
                    <span className="text-sinod-text font-medium">{player.name}</span>
                  </div>
                  <span className="text-sinod-text-secondary">{player.quizzes}</span>
                  <span className="text-right font-heading font-semibold text-sinod-text">
                    {player.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 border-b border-white/[0.06]">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-sinod-text-secondary flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-sinod-cyan text-sinod-base'
                    : 'bg-white/[0.06] text-sinod-text-secondary hover:bg-white/[0.10] hover:text-sinod-text'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quizzes Grid - Bento Style */}
      <section className="py-12 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.id} className="feature-card group cursor-pointer">
                <div className="relative h-40 mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={quiz.image} 
                    alt={quiz.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-sinod-base/80 backdrop-blur-sm text-xs font-medium text-sinod-text">
                      {quiz.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      quiz.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      quiz.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2 group-hover:text-sinod-cyan transition-colors">
                  {quiz.title}
                </h3>
                
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-sinod-text">{quiz.rating}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm text-sinod-text-secondary mb-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{quiz.questions} Qs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{quiz.participants}</span>
                  </div>
                </div>
                
                <button className="w-full py-3 rounded-xl border border-white/[0.10] text-sinod-text font-medium hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-2 group-hover:border-sinod-cyan/30">
                  Start Quiz
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {filteredQuizzes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sinod-text-secondary">No quizzes found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="glass-card-strong text-center p-8 lg:p-12 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Want to create your own quiz?
            </h2>
            <p className="text-sinod-text-secondary mb-6">
              Build engaging quizzes for your community and track their progress.
            </p>
            <button className="btn-primary">
              Create a quiz
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
