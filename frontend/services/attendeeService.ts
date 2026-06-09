import { Databases, Query } from 'appwrite';
import appwriteClient from './appwrite';

const PYTHON_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface AttendeeDocument {
  $id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  event_id: string;
  registration_id: string;
  paid: boolean;
  approved: boolean;
  verified: boolean;
  verified_at?: string;
  $createdAt: string;
}

export interface ApprovalEmailData {
  to_email: string;
  attendee_name: string;
  event_name: string;
  event_time: string;
  event_location: string;
  registration_id: string;
  event_page_url: string;
}

export interface CertificateData {
  to_email: string;
  attendee_name: string;
  event_name: string;
  event_date: string;
  event_id?: string;
}

export interface BulkCertificateData {
  event_name: string;
  event_id?: string;
  attendees: {
    email: string;
    name: string;
    event_date: string;
    event_id?: string;
  }[];
}

/**
 * Fetch all attendees for a specific event
 */
export const fetchAttendeesForEvent = async (eventId: string): Promise<AttendeeDocument[]> => {
  try {
    const url = `${PYTHON_BACKEND_URL}/events/${eventId}/attendees?limit=500`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch attendees');
    }
    
    const data = await response.json();
    
    // Backend now returns raw Appwrite format with $id and $createdAt
    return data.documents as AttendeeDocument[];
  } catch (error) {
    console.error('Error fetching attendees:', error);
    throw error;
  }
};

/**
 * Update attendee approval status
 */
export const updateAttendeeApproval = async (
  attendeeId: string,
  approved: boolean
): Promise<void> => {
  try {
    const databases = new Databases(appwriteClient);
    await databases.updateDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
      attendeeId,
      { approved }
    );
  } catch (error) {
    console.error('Error updating attendee approval:', error);
    throw error;
  }
};

/**
 * Update attendee verification status
 */
export const updateAttendeeVerification = async (
  attendeeId: string,
  verified: boolean,
  eventId?: string
): Promise<void> => {
  try {
    if (verified && eventId) {
       const response = await fetch(`${PYTHON_BACKEND_URL}/events/${eventId}/attendees/verify?attendee_id=${attendeeId}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' }
       });
       if (!response.ok) {
           throw new Error('Failed to verify attendee via backend');
       }
       return;
    }

    const databases = new Databases(appwriteClient);
    const updateData: any = { verified };
    
    if (verified) {
      updateData.verified_at = new Date().toISOString();
    }
    
    await databases.updateDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
      attendeeId,
      updateData
    );
  } catch (error) {
    console.error('Error updating attendee verification:', error);
    throw error;
  }
};

/**
 * Send approval email to an attendee
 */
export const sendApprovalEmail = async (data: ApprovalEmailData): Promise<void> => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/email/send-approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send approval email');
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

/**
 * Approve an attendee and send approval email
 */
export const approveAttendee = async (
  attendee: AttendeeDocument,
  eventName: string,
  eventTime: string,
  eventLocation: string,
  eventPageUrl: string,
  organizerEmail?: string,
  customMessage?: string
): Promise<void> => {
  try {
    // Update approval status in database via backend API
    if (organizerEmail) {
        let url = `${PYTHON_BACKEND_URL}/events/${eventPageUrl}/attendees/${attendee.$id}/approve?user_email=${encodeURIComponent(organizerEmail)}`;
        if (customMessage) {
          url += `&custom_message=${encodeURIComponent(customMessage)}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to approve attendee');
        }
    } else {
        await updateAttendeeApproval(attendee.$id, true);
    }
  } catch (error) {
    console.error('Error approving attendee:', error);
    throw error;
  }
};

/**
 * Bulk approve attendees and send approval emails
 */
export const bulkApproveAttendees = async (
  attendees: AttendeeDocument[],
  eventName: string,
  eventTime: string,
  eventLocation: string,
  eventPageUrl: string,
  organizerEmail?: string
): Promise<{ successful: number; failed: number; errors: string[] }> => {
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const attendee of attendees) {
    try {
      await approveAttendee(attendee, eventName, eventTime, eventLocation, eventPageUrl, organizerEmail);
      successful++;
    } catch (error: any) {
      failed++;
      errors.push(`${attendee.first_name} ${attendee.last_name}: ${error.message}`);
    }
  }

  return { successful, failed, errors };
};

/**
 * Reject an attendee and send rejection email
 */
export const rejectAttendee = async (
  attendeeId: string,
  attendeeName: string,
  attendeeEmail: string,
  eventName: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const databases = new Databases(appwriteClient);
    
    // Delete the attendee record from database
    await databases.deleteDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
      attendeeId
    );
    
    // Send rejection email
    try {
      const emailPayload = {
        to_email: attendeeEmail,
        attendee_name: attendeeName,
        event_name: eventName,
        rejection_reason: rejectionReason || 'The event host has reviewed your registration and decided not to approve it at this time.',
      };
      
      const response = await fetch(`${PYTHON_BACKEND_URL}/email/send-rejection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });
      
      if (!response.ok) {
        console.error('Failed to send rejection email, but registration was deleted');
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the rejection if email fails - registration is already deleted
    }
  } catch (error) {
    console.error('Error rejecting attendee:', error);
    throw error;
  }
};

/**
 * Send certificate to a single attendee
 */
export const sendCertificate = async (data: CertificateData): Promise<void> => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/certificate/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send certificate');
    }
  } catch (error) {
    console.error('Error sending certificate:', error);
    throw error;
  }
};

/**
 * Send certificates to multiple attendees
 */
export const sendBulkCertificates = async (data: BulkCertificateData): Promise<any> => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/certificate/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send certificates');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending bulk certificates:', error);
    throw error;
  }
};

/**
 * Export attendees to CSV
 */
export const exportAttendeesToCSV = (
  attendees: AttendeeDocument[],
  eventName: string,
  verifiedOnly: boolean = false
): void => {
  const filteredAttendees = verifiedOnly
    ? attendees.filter(a => a.verified)
    : attendees;

  if (filteredAttendees.length === 0) {
    alert('No attendees to export');
    return;
  }

  // CSV headers
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone Number',
    'Registration ID',
    'Paid',
    'Approved',
    'Verified',
    'Verified At',
    'Registered At',
  ];

  // CSV rows
  const rows = filteredAttendees.map(attendee => [
    attendee.first_name,
    attendee.last_name,
    attendee.email,
    attendee.phone_number || '',
    attendee.registration_id,
    attendee.paid ? 'Yes' : 'No',
    attendee.approved ? 'Yes' : 'No',
    attendee.verified ? 'Yes' : 'No',
    attendee.verified_at || '',
    attendee.$createdAt,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = verifiedOnly
    ? `${safeEventName}_Verified_Attendees.csv`
    : `${safeEventName}_All_Attendees.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Find attendee by registration_id (QR code scanned)
 */
export const findAttendeeByRegistrationId = async (
  registrationId: string
): Promise<AttendeeDocument | null> => {
  try {
    const databases = new Databases(appwriteClient);
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID,
      [Query.equal('registration_id', registrationId), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      return null;
    }
    
    return response.documents[0] as unknown as AttendeeDocument;
  } catch (error) {
    console.error('Error finding attendee by registration_id:', error);
    throw error;
  }
};

/**
 * Verify attendee by registration_id (from QR code scan)
 */
export const verifyAttendeeByRegistrationId = async (
  registrationId: string,
  eventId?: string
): Promise<{ success: boolean; message: string; attendee?: AttendeeDocument }> => {
  try {
    // If eventId is provided, use the backend endpoint which is robust
    if (eventId) {
       const response = await fetch(`${PYTHON_BACKEND_URL}/events/verify-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventId: eventId,
            qrCode: registrationId
        })
       });

       const data = await response.json();
       
       if (data.valid && data.attendee) {
           return {
               success: true,
               message: data.message,
               attendee: {
                   ...data.attendee,
                   $id: data.attendee.id,
                   $createdAt: data.attendee.created_at || new Date().toISOString()
               }
           };
       } else {
           return {
               success: false,
               message: data.message || 'Verification failed',
               attendee: data.attendee ? {
                    ...data.attendee,
                    $id: data.attendee.id
               } : undefined
           };
       }
    }

    // Fallback to legacy client-side logic if eventId is missing (should be avoided)
    const attendee = await findAttendeeByRegistrationId(registrationId);
    
    if (!attendee) {
      return {
        success: false,
        message: 'Attendee not found. Invalid QR code.',
      };
    }
    
    // Check if attendee is approved
    if (!attendee.approved) {
      return {
        success: false,
        message: `${attendee.first_name} ${attendee.last_name} is not approved for this event.`,
        attendee,
      };
    }
    
    // Check if already verified
    if (attendee.verified) {
      return {
        success: false,
        message: `${attendee.first_name} ${attendee.last_name} has already been verified.`,
        attendee,
      };
    }
    
    // Update verification status
    await updateAttendeeVerification(attendee.$id, true);
    
    return {
      success: true,
      message: `✓ ${attendee.first_name} ${attendee.last_name} successfully verified!`,
      attendee: {
        ...attendee,
        verified: true,
        verified_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'An error occurred during verification. Please try again.',
    };
  }
};
