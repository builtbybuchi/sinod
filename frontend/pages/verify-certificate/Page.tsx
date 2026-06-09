import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface CertificateDetails {
  certificate_id: string;
  recipient_name: string;
  recipient_email: string;
  event_name: string;
  event_date: string;
  issued_at: string;
  issued_by: string;
}

interface VerificationResult {
  verified: boolean;
  message: string;
  certificate?: CertificateDetails;
}

const VerifyCertificatePage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  
  const [inputId, setInputId] = useState(certificateId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-verify if certificateId is in URL
  useEffect(() => {
    if (certificateId) {
      verifyCertificate(certificateId);
    }
  }, [certificateId]);

  const verifyCertificate = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/certificate/verify/${id.trim()}`);
      const data: VerificationResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(inputId);
    // Update URL without page reload
    if (inputId.trim() && inputId !== certificateId) {
      navigate(`/verify-certificate/${inputId.trim()}`, { replace: true });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-500/20 mb-6">
            <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="text-sky-400">Verify</span> Certificate
          </h1>
          <p className="text-slate-400 text-lg">
            Enter a certificate ID to verify its authenticity
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value.toUpperCase())}
              placeholder="Enter Certificate ID (e.g., CERT-A1B2C3D4)"
              className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-lg font-mono tracking-wider"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 rounded-xl font-semibold transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying
                </span>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`rounded-3xl border ${result.verified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'} p-8`}>
            {result.verified && result.certificate ? (
              <>
                {/* Verified Badge */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-400">Certificate Verified</h2>
                    <p className="text-slate-400">This certificate is authentic</p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-slate-400 text-sm mb-1">Certificate ID</p>
                    <p className="text-white font-mono text-lg">{result.certificate.certificate_id}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-slate-400 text-sm mb-1">Recipient Name</p>
                    <p className="text-white text-xl font-semibold">{result.certificate.recipient_name}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">Event Name</p>
                      <p className="text-white font-medium">{result.certificate.event_name}</p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">Event Date</p>
                      <p className="text-white font-medium">{result.certificate.event_date}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">Issued On</p>
                      <p className="text-white font-medium">{formatDate(result.certificate.issued_at)}</p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">Issued By</p>
                      <p className="text-white font-medium">{result.certificate.issued_by}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Seal */}
                <div className="mt-8 pt-6 border-t border-slate-700 flex items-center justify-center gap-3 text-slate-400">
                  <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verified by Sinod' Platform</span>
                </div>
              </>
            ) : (
              <>
                {/* Not Found */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-amber-400 mb-2">Certificate Not Found</h2>
                  <p className="text-slate-400">{result.message}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 p-6 bg-slate-800/30 rounded-2xl border border-slate-700">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to verify a certificate
          </h3>
          <ol className="space-y-2 text-slate-400 list-decimal list-inside">
            <li>Find the Certificate ID on your certificate (format: CERT-XXXXXXXX)</li>
            <li>Enter the ID in the search box above</li>
            <li>Click "Verify" to check the certificate's authenticity</li>
            <li>If valid, you'll see the certificate details</li>
          </ol>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
