import { Client } from 'appwrite';

const client = new Client();

// Handle missing Appwrite credentials gracefully
// If migrating to backend API, these may not be needed
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || 'placeholder';

if (endpoint && projectId) {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
}

export default client;
