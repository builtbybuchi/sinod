import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { View } from '../../types';
import SocialAuthButtons from '../../components/SocialAuthButtons';
import { useAuth } from '../../contexts/AuthContext';

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

interface SignInPageProps {
  onNavigate: (view: View) => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { login, loading, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  // Redirect to intended page or dashboard if user is already logged in
  useEffect(() => {
    if (currentUser && !loading) {
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        onNavigate(View.DASHBOARD);
      }
    }
  }, [currentUser, loading, onNavigate, navigate, redirectUrl]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      // Redirect to intended page or dashboard after successful login
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        onNavigate(View.DASHBOARD);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <main className="flex-1 flex flex-col">
        <div className="flex-1 w-full mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 px-0 md:px-12 py-0 md:py-12 items-stretch">
          {/* Image column (mobile first) */}
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-full w-full flex items-center justify-center order-1 lg:order-2 mb-10 lg:mb-0 overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 blur-2xl opacity-50" />
            <div className="relative h-40 sm:h-48 md:h-56 lg:h-auto w-64 sm:w-72 md:w-80 lg:w-4/5 xl:w-full lg:aspect-[4/3] aspect-video rounded-xl lg:rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg lg:shadow-2xl shadow-black/40 backdrop-blur-sm transition-all">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=60"
                alt="Team collaboration workspace"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-900/20 to-gray-900/60" />
            </div>
          </div>
          {/* Form column */}
          <div className="max-w-md w-full mx-auto px-6 md:px-0 order-2 lg:order-1 pb-12 md:pb-0">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center text-white mb-2">Sign in </h1>
            
            {currentUser && !loading ? (
              <div className="space-y-6">
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <p className="text-green-400 mb-4">You are already signed in!</p>
                  <button
                    onClick={() => onNavigate(View.DASHBOARD)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-blue-600/20 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800/60 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 transition-colors" placeholder="you@company.com" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                      <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800/60 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-lg px-4 py-2.5 pr-12 text-white placeholder-gray-500 transition-colors" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-blue-600/20 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </form>
                {/* Social buttons */}
                {/*
                <div className="mt-10">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="h-px bg-gray-800 flex-1" />
                    <span className="text-[10px] tracking-wider uppercase text-gray-500">Or continue with</span>
                    <span className="h-px bg-gray-800 flex-1" />
                  </div>
                  <SocialAuthButtons onClick={(p) => console.log('auth with', p)} /> 
                </div>
                */}
                <p className="text-gray-400 mt-10 text-sm">Don't have an account?{' '}<button onClick={() => onNavigate(View.SIGN_UP)} className="text-blue-400 hover:text-blue-300 font-medium">Create one</button></p>
              </>
            )}
          </div>
          {/* (image column already handled above for all breakpoints) */}
        </div>
      </main>
    </div>
  );
};

export default SignInPage;
