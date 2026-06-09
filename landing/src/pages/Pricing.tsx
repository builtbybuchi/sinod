import { useState } from 'react';
import { Check, Mail, Award, DollarSign, Info, Sparkles } from 'lucide-react';

const freeFeatures = [
  'Unlimited events',
  'Unlimited forms',
  'Unlimited responses',
  'Unlimited documents',
  'Unlimited whiteboards',
  'Unlimited quizzes',
  'Unlimited team members',
];

const paidFeatures = [
  { icon: Mail, title: 'Email Sending', price: 0.99, unit: 'per 1000 emails', description: 'Send newsletters to unlimited contacts' },
  { icon: Award, title: 'Certificates', price: 0.5, unit: 'per 100 certificates', description: 'Generate and send certificates automatically' },
  { icon: DollarSign, title: 'Paid Events', price: 5, unit: '% platform fee', description: 'Either paid by the organizer or attendees' },
  { icon: Sparkles, title: 'AI Requests', price: 1.99, unit: 'per 1000 requests', description: 'Smart drafting, suggestions, and content generation' },
];

const comparisons = [
  { feature: 'Monthly Fee', others: '$20-350/mo', us: '$0' },
  { feature: 'Event Limits', others: '3-10 events/mo', us: 'Unlimited' },
  { feature: 'Form Responses', others: '100-1000/mo', us: 'Unlimited' },
  { feature: 'Team Members', others: 'Pay per seat', us: 'Unlimited' },
  { feature: 'AI Features', others: '$10-50/mo extra', us: '$1.99/1K requests' },
  { feature: 'Whiteboards', others: 'Separate tool', us: 'Built-in' },
];

export function PricingPage() {
  const [estimatorValues, setEstimatorValues] = useState({
    emails: 0,
    certificates: 0,
    paidEvents: 0,
    aiRequests: 0
  });

  const calculateEstimate = () => {
    const emailCost = (estimatorValues.emails / 1000) * 0.99;
    const certificateCost = (estimatorValues.certificates / 100) * 0.5;
    const paidEventCost = estimatorValues.paidEvents * 0.05; // 5% fee
    const aiCost = (estimatorValues.aiRequests / 1000) * 1.99;
    return emailCost + certificateCost + paidEventCost + aiCost;
  };

  const estimate = calculateEstimate();

  return (
    <div className="min-h-screen bg-sinod-base pt-20">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-sinod-text mb-6">
              Simple, Transparent <span className="text-gradient">Pricing</span>.
            </h1>
            <p className="text-lg text-sinod-text-secondary mb-8">
              Most features are free. You only pay for what you use. No subscriptions. No surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Free Forever Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                Everything You Need to Get Started
              </h2>
              <p className="text-sinod-text-secondary">
                These features are completely free. No limits. No catch.
              </p>
            </div>

            <div className="glass-card-strong p-8 lg:p-12">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {freeFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-sinod-cyan flex-shrink-0" />
                    <span className="text-sinod-text">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pay Per Use Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                Pay for What You Use
              </h2>
              <p className="text-sinod-text-secondary">
                These features have usage-based pricing. Fair and transparent.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paidFeatures.map((feature) => (
                <div key={feature.title} className="glass-card p-6 text-center">
                  <div className="product-icon w-14 h-14 mx-auto mb-4">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-sinod-text mb-2">{feature.title}</h3>
                  <p className="font-heading text-3xl font-bold text-sinod-cyan mb-1">
                    {feature.title === 'Paid Events' ? `${feature.price}%` : `$${feature.price}`}
                  </p>
                  <p className="text-sinod-text-secondary text-sm mb-4">{feature.unit}</p>
                  <p className="text-sinod-text-secondary text-xs">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Price Estimator */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-4">
                Estimate Your Monthly Cost
              </h2>
              <p className="text-sinod-text-secondary">
                Adjust the sliders to see how much you might pay based on your usage.
              </p>
            </div>

            <div className="glass-card-strong p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Sliders */}
                <div className="space-y-8">
                  {/* Emails */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sinod-text font-medium flex items-center gap-2">
                        <Mail className="w-5 h-5 text-sinod-cyan" />
                        Emails per month
                      </label>
                      <span className="text-sinod-cyan font-heading font-bold">
                        {estimatorValues.emails.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="1000"
                      value={estimatorValues.emails}
                      onChange={(e) => setEstimatorValues({ ...estimatorValues, emails: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sinod-cyan"
                    />
                    <p className="text-sinod-text-secondary text-sm mt-2">
                      ${(estimatorValues.emails / 1000 * 0.99).toFixed(2)}
                    </p>
                  </div>

                  {/* Certificates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sinod-text font-medium flex items-center gap-2">
                        <Award className="w-5 h-5 text-sinod-cyan" />
                        Certificates per month
                      </label>
                      <span className="text-sinod-cyan font-heading font-bold">
                        {estimatorValues.certificates.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="100"
                      value={estimatorValues.certificates}
                      onChange={(e) => setEstimatorValues({ ...estimatorValues, certificates: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sinod-cyan"
                    />
                    <p className="text-sinod-text-secondary text-sm mt-2">
                      ${(estimatorValues.certificates / 100 * 0.5).toFixed(2)}
                    </p>
                  </div>

                  {/* Paid Events */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sinod-text font-medium flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-sinod-cyan" />
                        Paid event revenue
                      </label>
                      <span className="text-sinod-cyan font-heading font-bold">
                        ${estimatorValues.paidEvents.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="100"
                      value={estimatorValues.paidEvents}
                      onChange={(e) => setEstimatorValues({ ...estimatorValues, paidEvents: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sinod-cyan"
                    />
                    <p className="text-sinod-text-secondary text-sm mt-2">
                      5% fee = ${(estimatorValues.paidEvents * 0.05).toFixed(2)}
                    </p>
                  </div>

                  {/* AI Requests */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sinod-text font-medium flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sinod-cyan" />
                        AI requests per month
                      </label>
                      <span className="text-sinod-cyan font-heading font-bold">
                        {estimatorValues.aiRequests.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="1000"
                      value={estimatorValues.aiRequests}
                      onChange={(e) => setEstimatorValues({ ...estimatorValues, aiRequests: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sinod-cyan"
                    />
                    <p className="text-sinod-text-secondary text-sm mt-2">
                      ${(estimatorValues.aiRequests / 1000 * 1.99).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Estimate Result */}
                <div className="flex flex-col justify-center">
                  <div className="glass-card p-8 text-center">
                    <p className="text-sinod-text-secondary mb-2">Your estimated monthly cost</p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <span className="text-5xl font-heading font-bold text-sinod-cyan">
                        ${estimate.toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-sinod-text-secondary">
                        <span>Emails:</span>
                        <span>${(estimatorValues.emails / 1000 * 0.99).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sinod-text-secondary">
                        <span>Certificates:</span>
                        <span>${(estimatorValues.certificates / 100 * 0.5).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sinod-text-secondary">
                        <span>Paid Events (5%):</span>
                        <span>${(estimatorValues.paidEvents * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sinod-text-secondary">
                        <span>AI Requests:</span>
                        <span>${(estimatorValues.aiRequests / 1000 * 1.99).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-start gap-2 text-xs text-sinod-text-secondary">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                          This is an estimate. Actual costs may vary. 
                          You get 10 free certificates per month and your first newsletter send is free.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-8 text-center">
              How We Compare
            </h2>

            <div className="glass-card-strong overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-4 border-b border-white/[0.06] text-sm font-medium">
                <span className="text-sinod-text-secondary">Feature</span>
                <span className="text-center text-sinod-text-secondary">Other Platforms</span>
                <span className="text-center text-sinod-cyan">Sinod'</span>
              </div>
              {comparisons.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b border-white/[0.06]">
                  <span className="text-sinod-text">{row.feature}</span>
                  <span className="text-center text-sinod-text-secondary">{row.others}</span>
                  <span className="text-center text-sinod-cyan font-medium">{row.us}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* No Monthly Fees Section */}
      <section className="py-24 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-6">
              No Monthly Payments. Ever.
            </h2>
            <p className="text-sinod-text-secondary text-lg mb-8">
              Every feature we might eventually monetize follows one rule: you pay once, you own it forever. 
              No recurring subscriptions. No surprise bills.
            </p>
            <div className="glass-card-strong p-8 inline-block">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-sinod-text-secondary text-sm mb-2">Traditional SaaS</p>
                  <div className="flex items-center gap-1 text-sinod-text">
                    <span className="text-2xl">$</span>
                    <span className="text-4xl font-bold">49</span>
                    <span className="text-sm">/mo</span>
                  </div>
                  <p className="text-sinod-text-secondary text-xs">forever</p>
                </div>
                <div className="h-16 w-px bg-white/[0.1]" />
                <div className="text-center">
                  <p className="text-sinod-cyan text-sm mb-2">Sinod'</p>
                  <div className="flex items-center gap-1 text-sinod-cyan">
                    <span className="text-4xl font-bold">$0</span>
                  </div>
                  <p className="text-sinod-cyan text-xs">to start</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 lg:py-32 gradient-mesh">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-sinod-text mb-8 text-center">
              Pricing FAQ
            </h2>

            <div className="space-y-4">
              {[
                { 
                  q: 'Is there really no monthly fee?', 
                  a: 'Correct. The core platform is completely free. You only pay for usage-based features: email sending ($0.99/1,000 emails), certificates ($0.50/100), AI requests ($1.99/1,000 requests), and a 5% fee on paid events which is either paid by the organizer or attendees.' 
                },
                { 
                  q: 'What happens if I exceed my limits?', 
                  a: 'There are no limits on free features. For paid features, you simply pay for what you use. You get free quota every month: 100 free emails, 10 free certificates and 50 free AI requests.' 
                },
                { 
                  q: 'Can I try before I commit?', 
                  a: 'Absolutely. Most features are free to use. You only pay when you send emails, generate certificates, or use AI requests.' 
                },
              ].map((faq, i) => (
                <div key={i} className="glass-card p-6">
                  <h3 className="font-heading font-semibold text-sinod-text mb-2">{faq.q}</h3>
                  <p className="text-sinod-text-secondary">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
