import { useParams, Navigate } from 'react-router-dom';
import { Shield, FileText, Cookie, UserCheck, BadgeCheck, Tag, RotateCcw } from 'lucide-react';

const legalContent: Record<string, { title: string; icon: React.ElementType; content: React.ReactNode }> = {
  terms: {
    title: 'Terms of Service',
    icon: FileText,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">1. Acceptance of Terms</h2>
          <p className="text-sinod-text-secondary">
            By accessing or using Sinod', you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">2. Description of Service</h2>
          <p className="text-sinod-text-secondary">
            Sinod' provides a unified community management platform including events, forms, documents, 
            newsletters, quizzes, certificates, and AI assistant features. We reserve the right to modify, 
            suspend, or discontinue any part of the service at any time.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">3. User Accounts</h2>
          <p className="text-sinod-text-secondary">
            You are responsible for maintaining the confidentiality of your account credentials and 
            for all activities that occur under your account. You agree to notify us immediately of 
            any unauthorized use of your account.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">4. Acceptable Use</h2>
          <p className="text-sinod-text-secondary">
            You agree not to use Sinod' for any unlawful purpose or in any way that could damage, 
            disable, overburden, or impair our service. Prohibited activities include spam, harassment, 
            and distribution of malicious content.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">5. Intellectual Property</h2>
          <p className="text-sinod-text-secondary">
            All content, features, and functionality of Sinod' are owned by us and are protected by 
            international copyright, trademark, and other intellectual property laws.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">6. Limitation of Liability</h2>
          <p className="text-sinod-text-secondary">
            To the fullest extent permitted by law, Sinod' shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages resulting from your use of our service.
          </p>
        </section>
      </div>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    icon: Shield,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">1. Information We Collect</h2>
          <p className="text-sinod-text-secondary">
            We collect information you provide directly to us, including your name, email address, 
            and any other information you choose to provide. We also collect usage data and analytics 
            to improve our service.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">2. How We Use Your Information</h2>
          <p className="text-sinod-text-secondary">
            We use your information to provide, maintain, and improve our services, communicate with you, 
            and personalize your experience. We do not sell your personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">3. Data Security</h2>
          <p className="text-sinod-text-secondary">
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">4. Your Rights</h2>
          <p className="text-sinod-text-secondary">
            You have the right to access, correct, or delete your personal information. You may also 
            object to or restrict certain processing of your data. Contact us to exercise these rights.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">5. Data Retention</h2>
          <p className="text-sinod-text-secondary">
            We retain your personal information for as long as necessary to provide our services and 
            fulfill the purposes outlined in this Privacy Policy. You may request deletion of your data at any time.
          </p>
        </section>
      </div>
    ),
  },
  cookies: {
    title: 'Cookie Policy',
    icon: Cookie,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">1. What Are Cookies</h2>
          <p className="text-sinod-text-secondary">
            Cookies are small text files stored on your device when you visit our website. They help us 
            provide and improve our services by remembering your preferences and understanding how you use Sinod'.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">2. Types of Cookies We Use</h2>
          <p className="text-sinod-text-secondary">
            <strong className="text-sinod-text">Essential Cookies:</strong> Required for the website to function properly.
            <br /><br />
            <strong className="text-sinod-text">Analytics Cookies:</strong> Help us understand how visitors interact with our website.
            <br /><br />
            <strong className="text-sinod-text">Preference Cookies:</strong> Remember your settings and preferences.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">3. Managing Cookies</h2>
          <p className="text-sinod-text-secondary">
            You can control and manage cookies through your browser settings. Please note that disabling 
            certain cookies may affect the functionality of our website.
          </p>
        </section>
      </div>
    ),
  },
  agreement: {
    title: 'User Agreement',
    icon: UserCheck,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">1. Account Responsibilities</h2>
          <p className="text-sinod-text-secondary">
            As a Sinod' user, you are responsible for all content posted and activity that occurs under 
            your account. You must provide accurate and complete information when creating your account.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">2. Content Ownership</h2>
          <p className="text-sinod-text-secondary">
            You retain ownership of all content you create and upload to Sinod'. By using our service, 
            you grant us a license to host and display your content solely for the purpose of providing our services.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">3. Community Guidelines</h2>
          <p className="text-sinod-text-secondary">
            Users must treat others with respect and not engage in harassment, hate speech, or illegal activities. 
            We reserve the right to suspend or terminate accounts that violate these guidelines.
          </p>
        </section>
      </div>
    ),
  },
  buyertrust: {
    title: 'BuyerTrust',
    icon: BadgeCheck,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Our Commitment to You</h2>
          <p className="text-sinod-text-secondary">
            BuyerTrust is our commitment to providing a safe, secure, and transparent event ticketing experience. 
            We protect both attendees and event hosts with clear policies, escrow safeguards, and fair dispute resolution.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Escrow Protection</h2>
          <p className="text-sinod-text-secondary">
            When you purchase a ticket to a paid event on Sinod', your payment is protected by our escrow system. 
            60% of event revenue is released to hosts immediately (after a 48-hour hold), while 40% is held in escrow 
            until 26 hours after the event ends. This ensures funds are available for refund claims if an event 
            is cancelled or does not meet expectations.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Refund Guarantee</h2>
          <p className="text-sinod-text-secondary">
            Within 24 hours of registration, attendees receive a full 100% refund including all fees — automatically approved.
            After that, attendees may still request a refund up to 12 hours after the event starts. The 6.6% transaction fee 
            (5% platform + 1.6% gateway) is non-refundable outside the 24-hour registration window. If a request is made more 
            than 48 hours before the event, 40% of the ticket price (minus fees) is refunded immediately. Full refunds require 
            an explicit reason and admin approval.
            See our <a href="/legal/refunds" className="text-blue-400 hover:text-blue-300 underline">Refund &amp; Cancellation Policy</a> for full details.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Secure Payments</h2>
          <p className="text-sinod-text-secondary">
            All payments are processed through Squadco, a PCI-compliant payment gateway. Your payment 
            information is never stored on our servers.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Transparent Pricing</h2>
          <p className="text-sinod-text-secondary">
            Event hosts choose who bears the platform fee (5%) and gateway fee (1.6%). When attendees bear fees, 
            the total is clearly displayed before checkout. There are no hidden charges.
          </p>
        </section>
      </div>
    ),
  },
  refunds: {
    title: 'Refund & Cancellation Policy',
    icon: RotateCcw,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">1. Overview</h2>
          <p className="text-sinod-text-secondary">
            Sinod' facilitates ticket purchases between event attendees and event hosts. This Refund &amp; Cancellation Policy 
            outlines the rules governing refund requests, cancellations, and the escrow system that protects both parties.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">2. Non-Refundable Transaction Fee</h2>
          <div className="text-sinod-text-secondary space-y-3">
            <p>A total transaction fee of <strong className="text-sinod-text">6.6%</strong> (5% platform fee + 1.6% payment gateway fee) applies to all paid tickets. This fee is <strong className="text-sinod-text">non-refundable under normal circumstances</strong>, regardless of whether the fee is paid by the attendee or absorbed by the host.</p>
            <p><strong className="text-sinod-text">Exception:</strong> If a refund is requested within 24 hours of registration, the full ticket price including all fees is refunded (see Section 4).</p>
            <p>Outside the 24-hour registration window, all refund amounts are calculated on the ticket price <em>after</em> deducting this 6.6% fee.</p>
          </div>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">3. Refund Request Window</h2>
          <div className="text-sinod-text-secondary space-y-3">
            <p>Attendees have a maximum of <strong className="text-sinod-text">12 hours after the event start time</strong> (as posted on Sinod') to submit a refund request. After this 12-hour window has passed, no refund can be offered.</p>
          </div>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">4. Refund Tiers</h2>
          <div className="text-sinod-text-secondary space-y-3">
            <p><strong className="text-sinod-text">Within 24 hours of registration:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-sinod-text">100% full refund</strong> of the ticket price, including all transaction fees.</li>
              <li>This is automatically approved — no reason required.</li>
              <li>This applies because all payments are held in escrow for 48 hours, so full reversal is possible.</li>
            </ul>
            <p><strong className="text-sinod-text">More than 48 hours before event start (after 24hr registration window):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>40% of the refundable amount (ticket price minus 6.6% fee) is refunded <strong className="text-sinod-text">immediately</strong>, no questions asked.</li>
              <li>For a <strong className="text-sinod-text">full refund</strong> of the remaining 60%, the attendee must provide an explicit reason. This request is then subject to admin review and approval.</li>
            </ul>
            <p><strong className="text-sinod-text">48 hours or less before event start (including up to 12 hours after):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All refund requests require an <strong className="text-sinod-text">explicit reason</strong>.</li>
              <li>All refund requests require <strong className="text-sinod-text">admin approval</strong>.</li>
              <li>No automatic or partial refunds are available in this window.</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">5. How to Request a Refund</h2>
          <p className="text-sinod-text-secondary">
            To request a refund, navigate to your <strong className="text-sinod-text">Dashboard → Events → Registered</strong> tab, 
            find the event, and click "Request Refund". You may be asked to provide a reason depending on the timing.
            You'll receive a confirmation with the refund status.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">6. Escrow System</h2>
          <div className="text-sinod-text-secondary space-y-3">
            <p>Sinod' uses an escrow system to protect attendees:</p>
            <p><strong className="text-sinod-text">48-hour payment hold:</strong> All payments are held for 48 hours after the transaction before any funds become available to the host.</p>
            <p><strong className="text-sinod-text">60/40 release split:</strong> After the hold period, 60% of net revenue is available for host withdrawal. The remaining 40% is held in escrow.</p>
            <p><strong className="text-sinod-text">Escrow release:</strong> The escrowed 40% is released to the host 26 hours after the event ends, provided there are no pending refund claims.</p>
          </div>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">7. Event Cancellation by Host</h2>
          <p className="text-sinod-text-secondary">
            If an event host cancels an event, all attendees with paid registrations are eligible for a full refund 
            (minus the non-refundable 6.6% fee). Sinod' will process refunds from the escrowed funds. 
            Hosts who repeatedly cancel events may be subject to account restrictions.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">8. Disputes</h2>
          <p className="text-sinod-text-secondary">
            If you believe your refund request was unfairly rejected, you may contact us at{' '}
            <a href="mailto:support@sinod.app" className="text-blue-400 hover:text-blue-300 underline">support@sinod.app</a>{' '}
            with your refund ID and details. We will review the case and respond within 3 business days.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">9. Modifications</h2>
          <p className="text-sinod-text-secondary">
            We reserve the right to update this Refund &amp; Cancellation Policy at any time. Changes will be 
            posted on this page with an updated effective date. Continued use of Sinod' after changes constitutes 
            acceptance of the updated policy.
          </p>
        </section>
        <section>
          <p className="text-sinod-text-secondary text-sm italic">
            Last updated: March 2026
          </p>
        </section>
      </div>
    ),
  },
  bestprice: {
    title: 'BestPrice Guarantee',
    icon: Tag,
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Our Promise</h2>
          <p className="text-sinod-text-secondary">
            We believe Sinod' offers the best value in community management software. Our BestPrice 
            Guarantee ensures you're getting the most features for your investment.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Price Matching</h2>
          <p className="text-sinod-text-secondary">
            Found a comparable community management platform at a lower price? We'll match it. 
            Contact our sales team with the details.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Annual Discounts</h2>
          <p className="text-sinod-text-secondary">
            Save 20% when you choose annual billing. The longer you commit, the more you save.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-sinod-text mb-3">Non-Profit & Education</h2>
          <p className="text-sinod-text-secondary">
            We offer special pricing for registered non-profits and educational institutions. 
            Contact us to learn more about our discount programs.
          </p>
        </section>
      </div>
    ),
  },
};

export function LegalPage() {
  const { page } = useParams<{ page: string }>();
  
  if (!page || !legalContent[page]) {
    return <Navigate to="/legal/terms" replace />;
  }

  const { title, icon: Icon, content } = legalContent[page];

  return (
    <div className="min-h-screen bg-sinod-base pt-20">
      <section className="relative py-16 lg:py-24 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-sinod-text-secondary mb-8">
              <span>Legal</span>
              <span>/</span>
              <span className="text-sinod-text">{title}</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="product-icon w-14 h-14">
                <Icon className="w-7 h-7" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-sinod-text">
                {title}
              </h1>
            </div>

            {/* Last Updated */}
            <p className="text-sinod-text-secondary text-sm mb-8">
              Last updated: February 24, 2026
            </p>

            {/* Content */}
            <div className="glass-card-strong p-8 lg:p-12">
              {content}
            </div>

            {/* Navigation */}
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(legalContent).map(([key, item]) => (
                <a
                  key={key}
                  href={`/legal/${key}`}
                  className={`glass-card p-4 flex items-center gap-3 transition-all duration-300 ${
                    page === key ? 'border-sinod-cyan/30' : 'hover:border-sinod-cyan/20'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${page === key ? 'text-sinod-cyan' : 'text-sinod-text-secondary'}`} />
                  <span className={`text-sm font-medium ${page === key ? 'text-sinod-text' : 'text-sinod-text-secondary'}`}>
                    {item.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
