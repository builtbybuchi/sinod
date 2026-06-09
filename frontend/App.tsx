import React, { useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';

const SignUpPage = lazy(() => import('./pages/signup/Page.tsx'));
const SignUpSuccessPage = lazy(() => import('./pages/signup/SuccessPage.tsx'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const EventPage = lazy(() => import('./pages/event/EventPage.tsx'));
const PaymentVerifyPage = lazy(() => import('./pages/payment/PaymentVerifyPage.tsx'));
const DocumentEditorPage = lazy(() => import('./pages/documents/DocumentEditorPage.tsx'));
const InviteAcceptPage = lazy(() => import('./pages/documents/InviteAcceptPage.tsx'));
const WhiteboardEditorPage = lazy(() => import('./pages/whiteboards/WhiteboardEditorPage.tsx'));
const WhiteboardInviteAcceptPage = lazy(() => import('./pages/whiteboards/WhiteboardInviteAcceptPage.tsx'));
const FormResponsePage = lazy(() => import('./pages/forms/FormResponsePage.tsx'));
const QuizResponsePage = lazy(() => import('./pages/quizzes/QuizResponsePage.tsx'));
const QuizLeaderboardPage = lazy(() => import('./pages/quizzes/QuizLeaderboardPage.tsx'));
import { View } from './types';
const SignInPage = lazy(() => import('./pages/signin/Page.tsx'));
const VerifyCertificatePage = lazy(() => import('./pages/verify-certificate/Page.tsx'));
const UnsubscribePage = lazy(() => import('./pages/unsubscribe/Page.tsx'));
import ProtectedRoute from './components/ProtectedRoute';
import { viewToPath } from './routes';

// Wrapper to provide onNavigate prop translation for legacy components
const WithNavigation: React.FC<{ children: (onNavigate: (v: View, params?: any) => void) => React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const onNavigate = useCallback((view: View, params?: any) => {
    navigate(viewToPath(view, params));
  }, [navigate]);
  return <>{children(onNavigate)}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/j" element={<Navigate to="/dashboard" replace />} />

        {/* Auth pages */}
        <Route path="/signin" element={<WithNavigation>{(onNavigate)=> <SignInPage onNavigate={onNavigate} />}</WithNavigation>} />
        <Route path="/signup" element={<WithNavigation>{(onNavigate)=> <SignUpPage onNavigate={onNavigate} />}</WithNavigation>} />
        <Route path="/signup-success" element={<WithNavigation>{(onNavigate)=> <SignUpSuccessPage onNavigate={onNavigate} />}</WithNavigation>} />

        {/* Protected: Dashboard standalone page */}
        <Route path="/dashboard" element={<ProtectedRoute><div className="min-h-screen bg-gray-900 text-white"><DashboardPage /></div></ProtectedRoute>} />
        
        {/* Public event page - no auth required */}
        <Route path="/event/:eventId" element={<EventPage />} />

        {/* Protected: Payment verification page */}
        <Route path="/payment/verify" element={<ProtectedRoute><PaymentVerifyPage /></ProtectedRoute>} />

        {/* Protected: Document editor and invite routes */}
        <Route path="/documents/:documentId" element={<ProtectedRoute><DocumentEditorPage /></ProtectedRoute>} />
        <Route path="/documents/invite/:token" element={<ProtectedRoute><InviteAcceptPage /></ProtectedRoute>} />

        {/* Protected: Whiteboard editor and invite routes */}
        <Route path="/whiteboards/:whiteboardId" element={<ProtectedRoute><WhiteboardEditorPage /></ProtectedRoute>} />
        <Route path="/whiteboards/invite/:token" element={<ProtectedRoute><WhiteboardInviteAcceptPage /></ProtectedRoute>} />

        {/* Public: Certificate verification */}
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/verify-certificate/:certificateId" element={<VerifyCertificatePage />} />

        {/* Public: Newsletter unsubscribe */}
        <Route path="/unsubscribe" element={<UnsubscribePage />} />

        {/* Public: Form & Quiz response pages */}
        <Route path="/f/:formId" element={<FormResponsePage />} />
        <Route path="/q/:quizId" element={<QuizResponsePage />} />
        <Route path="/quiz/:quizId/leaderboard" element={<QuizLeaderboardPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
