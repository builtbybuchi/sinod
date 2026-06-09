import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ProductEvents } from './pages/products/Events';
import { ProductForms } from './pages/products/Forms';
import { ProductDocuments } from './pages/products/Documents';
import { ProductNewsletter } from './pages/products/Newsletter';
import { ProductQuizzes } from './pages/products/Quizzes';
import { ProductCertificates } from './pages/products/Certificates';
import { ProductAI } from './pages/products/AI';
import { ExploreEvents } from './pages/explore/Events';
import { ExploreQuizzes } from './pages/explore/Quizzes';
import { AboutPage } from './pages/company/About';
import { CareersPage } from './pages/company/Careers';
import { ContactPage } from './pages/company/Contact';
import { MediaKitPage } from './pages/company/MediaKit';
import { FeaturesPage } from './pages/resources/Features';
// import { SecurityPage } from './pages/resources/Security';
import { SupportPage } from './pages/resources/Support';
import { FAQPage } from './pages/resources/FAQ';
import { PricingPage } from './pages/Pricing';
import { LegalPage } from './pages/Legal';
import { BlogListPage } from './pages/blog/BlogList';
import { NewsListPage } from './pages/blog/NewsList';
import { ArticlePage } from './pages/blog/ArticlePage';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-sinod-base grain-overlay">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Product Routes */}
            <Route path="/products/events" element={<ProductEvents />} />
            <Route path="/products/forms" element={<ProductForms />} />
            <Route path="/products/documents" element={<ProductDocuments />} />
            <Route path="/products/newsletter" element={<ProductNewsletter />} />
            <Route path="/products/quizzes" element={<ProductQuizzes />} />
            <Route path="/products/certificates" element={<ProductCertificates />} />
            <Route path="/products/ai-assistant" element={<ProductAI />} />
            
            {/* Explore Routes */}
            <Route path="/explore/events" element={<ExploreEvents />} />
            <Route path="/explore/quizzes" element={<ExploreQuizzes />} />
            
            {/* Company Routes */}
            <Route path="/company" element={<AboutPage />} />
            <Route path="/company/about" element={<AboutPage />} />
            <Route path="/company/careers" element={<CareersPage />} />
            <Route path="/company/contact" element={<ContactPage />} />
            <Route path="/company/media-kit" element={<MediaKitPage />} />
            
            {/* Resources Routes */}
            <Route path="/resources" element={<FeaturesPage />} />
            <Route path="/resources/features" element={<FeaturesPage />} />
            {/* <Route path="/resources/security" element={<SecurityPage />} /> */}
            <Route path="/resources/support" element={<SupportPage />} />
            <Route path="/resources/faq" element={<FAQPage />} />
            
            {/* Blog & News Routes */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:id" element={<ArticlePage />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/news/:id" element={<ArticlePage />} />
            
            {/* Pricing */}
            <Route path="/pricing" element={<PricingPage />} />
            
            {/* Legal */}
            <Route path="/legal/:page" element={<LegalPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
