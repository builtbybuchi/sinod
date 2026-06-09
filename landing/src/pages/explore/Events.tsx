import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, ArrowRight, Search, Filter } from 'lucide-react';

const categories = ['All', 'Technology', 'Business', 'Design', 'Education', 'Community'];

const events = [
  {
    id: 1,
    title: 'Community Management Summit 2026',
    category: 'Business',
    date: 'Mar 15, 2026',
    time: '10:00 AM PST',
    location: 'Virtual',
    attendees: 234,
    image: '/ui-events.jpg',
    description: 'Learn from top community managers about building engaged communities.',
  },
  {
    id: 2,
    title: 'Design Systems Workshop',
    category: 'Design',
    date: 'Mar 18, 2026',
    time: '2:00 PM PST',
    location: 'San Francisco, CA',
    attendees: 89,
    image: '/ui-forms.jpg',
    description: 'Hands-on workshop for creating scalable design systems.',
  },
  {
    id: 3,
    title: 'AI in Community Building',
    category: 'Technology',
    date: 'Mar 22, 2026',
    time: '11:00 AM PST',
    location: 'Virtual',
    attendees: 456,
    image: '/ui-ai.jpg',
    description: 'Explore how AI is transforming community engagement.',
  },
  {
    id: 4,
    title: 'Learning & Development Forum',
    category: 'Education',
    date: 'Mar 25, 2026',
    time: '9:00 AM PST',
    location: 'New York, NY',
    attendees: 167,
    image: '/ui-quizzes.jpg',
    description: 'Best practices for community-driven learning programs.',
  },
  {
    id: 5,
    title: 'Newsletter Masterclass',
    category: 'Business',
    date: 'Mar 28, 2026',
    time: '1:00 PM PST',
    location: 'Virtual',
    attendees: 312,
    image: '/ui-newsletter.jpg',
    description: 'Craft newsletters that your community actually reads.',
  },
  {
    id: 6,
    title: 'Local Community Meetup',
    category: 'Community',
    date: 'Apr 2, 2026',
    time: '6:00 PM PST',
    location: 'Austin, TX',
    attendees: 45,
    image: '/ui-documents.jpg',
    description: 'Connect with fellow community builders in person.',
  },
];

export function ExploreEvents() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-sinod-base pt-20">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Explore <span className="text-gradient">Events</span>
            </h1>
            <p className="text-lg text-sinod-text-secondary mb-8">
              Discover upcoming events from communities around the world. 
              Learn, connect, and grow with fellow community builders.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sinod-text-secondary" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-12 pr-4"
              />
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

      {/* Events Grid */}
      <section className="py-12 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="feature-card group cursor-pointer">
                <div className="relative h-48 mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-sinod-base/80 backdrop-blur-sm text-xs font-medium text-sinod-text">
                      {event.category}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2 group-hover:text-sinod-cyan transition-colors">
                  {event.title}
                </h3>
                
                <p className="text-sinod-text-secondary text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>
                
                <div className="space-y-2 text-sm text-sinod-text-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>
                
                <button className="w-full mt-6 py-3 rounded-xl border border-white/[0.10] text-sinod-text font-medium hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-2 group-hover:border-sinod-cyan/30">
                  Register
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sinod-text-secondary">No events found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="glass-card-strong text-center p-8 lg:p-12 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-sinod-text mb-4">
              Hosting an event?
            </h2>
            <p className="text-sinod-text-secondary mb-6">
              Create and manage your events with Sinod'. Reach your community and track engagement.
            </p>
            <button className="btn-primary">
              Create your event
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
