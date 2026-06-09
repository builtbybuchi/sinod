import React, { useEffect } from 'react';
import { View } from '../../types';

interface SignUpSuccessPageProps {
  onNavigate: (view: View) => void;
}

const SignUpSuccessPage: React.FC<SignUpSuccessPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    // Auto-redirect to dashboard after successful signup
    const timer = setTimeout(() => {
      onNavigate(View.DASHBOARD);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <main className="flex-1 flex items-center justify-center text-center px-4">
        <div className="max-w-md w-full">
          <div className="p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50 shadow-2xl shadow-blue-500/10 backdrop-blur-lg">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center ring-4 ring-green-500/30 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Account Created!</h1>
            <p className="text-gray-300 mb-8">
              Your account has been created successfully. Redirecting to your dashboard...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpSuccessPage;
