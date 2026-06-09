import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Databases } from 'appwrite';
import appwriteClient from '../../services/appwrite';
import { verifySquadcoPayment } from '../../services/squadcoService';
import { sendRegistrationEmail } from '../../services/emailService';

const PaymentVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    // Try multiple parameter names that Squadco might use
    const transactionRef = searchParams.get('transaction_ref') || 
                          searchParams.get('reference') || 
                          searchParams.get('trxref') ||
                          searchParams.get('ref');
    const eventId = searchParams.get('eventId') || searchParams.get('event_id');
    // Check both registrationId and attendeeId (different callbacks may use different names)
    const registrationId = searchParams.get('registrationId') || 
                          searchParams.get('attendeeId') || 
                          searchParams.get('attendee_id');

    console.log('Payment verification params:', {
      transactionRef,
      eventId,
      registrationId,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (!transactionRef || !eventId || !registrationId) {
      setStatus('failed');
      setMessage(`Invalid payment reference. Please contact support. (Missing: ${!transactionRef ? 'transaction_ref' : ''} ${!eventId ? 'eventId' : ''} ${!registrationId ? 'registrationId' : ''})`);
      return;
    }

    try {
      const databases = new Databases(appwriteClient);

      // Verify payment with Squadco
      const verificationResult = await verifySquadcoPayment(transactionRef);

      if (verificationResult.success && verificationResult.paid) {
        // Payment successful - fetch event details and registration
        try {
          // Query event by event_page_url field (which contains the short event ID)
          const { Query } = await import('appwrite');
          const eventsResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID,
            [Query.equal('event_page_url', eventId)]
          );

          if (eventsResponse.documents.length === 0) {
            throw new Error('Event not found');
          }

          const event = eventsResponse.documents[0];
          setEventName(event.event_name as string);

          // Fetch registration details to get user info
          const registration = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
            registrationId
          );

          // Update registration after successful payment
          // paid: true - Payment completed
          // approved: false - Awaiting host approval (event creator must approve)
          // verified: false - Not yet physically verified with QR code
          await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
            registrationId,
            {
              paid: true,
              approved: false, // Host must manually approve attendee
              verified: false, // Will be set to true when QR code is scanned at event
            }
          );

          // Send confirmation email with QR code immediately after payment
          try {
            await sendRegistrationEmail({
              registrationId: transactionRef,
              firstName: registration.first_name as string,
              lastName: registration.last_name as string,
              email: registration.email as string,
              eventName: event.event_name as string,
              eventTime: event.event_time as string,
              eventEndTime: event.event_end_time as string,
              eventAddress: event.event_address as string,
              eventUrl: event.event_url as string,
              isVirtual: event.virtual_status as boolean,
              isPaid: true,
              amount: event.event_price as number,
              city: event.city as string,
              eventPageUrl: eventId, // Pass the event page URL (short ID)
            });
          } catch (emailError) {
            // Don't fail the payment verification if email fails
          }
        } catch (err) {
          // Error fetching event
        }

        setStatus('success');
        setMessage('Payment successful! Your registration is confirmed.')
        
      } else {
        // Payment failed or pending
        setStatus('failed');
        setMessage(
          verificationResult.message || 
          'Payment verification failed. If you were charged, please contact support with this reference: ' + transactionRef
        );

        // Delete the registration record since payment failed
        try {
          await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
            registrationId
          );
        } catch (err) {
          // Error deleting failed registration
        }
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage('An error occurred while verifying your payment. Please contact support.');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToEvent = () => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      navigate(`/event/${eventId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 border border-gray-700 rounded-xl p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verifying Payment</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-2">Your payment has been confirmed successfully.</p>
            {eventName && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-4">
                <p className="text-sm text-gray-300 mb-1">Event:</p>
                <p className="text-blue-400 font-semibold">{eventName}</p>
              </div>
            )}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-300">
                ✉️ <strong>Confirmation Email Sent:</strong> Check your email for your confirmation and QR code.
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-300">
                ⏳ <strong>Pending Host Approval:</strong> The event host will review your registration. You will be notified once approved.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGoHome}
                className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={handleGoToEvent}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                View Event
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400 mb-2">
                Transaction Reference: {searchParams.get('transaction_ref') || searchParams.get('reference') || 'N/A'}
              </p>
              <p className="text-xs text-red-300 font-mono">
                URL Params: {searchParams.toString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGoHome}
                className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={handleGoToEvent}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerifyPage;
