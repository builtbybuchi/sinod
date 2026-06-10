/**
 * Admin Media Upload API
 * Uploads files to Appwrite Storage and records metadata in admin-media collection
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'default-bucket';

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required Appwrite environment variable: ${name}`);
    }
    return value;
}

function buildAppwriteHeaders() {
    return {
        'X-Appwrite-Project': getRequiredEnv('APPWRITE_PROJECT_ID'),
        'X-Appwrite-Key': getRequiredEnv('APPWRITE_API_KEY'),
    };
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const altText = formData.get('alt_text') as string || '';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const endpoint = getRequiredEnv('APPWRITE_ENDPOINT').replace(/\/$/, '');
        const projectId = getRequiredEnv('APPWRITE_PROJECT_ID');
        const databaseId = getRequiredEnv('APPWRITE_DATABASE_ID');
        const mediaCollectionId = process.env.APPWRITE_MEDIA_COLLECTION_ID || 'admin-media';

        // Upload to Appwrite Storage using the REST API so the route stays Edge-compatible.
        const uploadForm = new FormData();
        uploadForm.append('fileId', crypto.randomUUID());
        uploadForm.append('file', file, file.name);

        const uploadResponse = await fetch(`${endpoint}/storage/buckets/${BUCKET_ID}/files`, {
            method: 'POST',
            headers: buildAppwriteHeaders(),
            body: uploadForm,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Appwrite file upload failed: ${uploadResponse.status} ${errorText}`);
        }

        const uploadedFile = await uploadResponse.json() as { $id: string };

        // Build the public file URL
        const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${projectId}`;

        // Save metadata to admin-media collection
        const createDocumentResponse = await fetch(`${endpoint}/databases/${databaseId}/collections/${mediaCollectionId}/documents`, {
            method: 'POST',
            headers: {
                ...buildAppwriteHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documentId: crypto.randomUUID(),
                data: {
                    file_id: uploadedFile.$id,
                    url: fileUrl,
                    alt_text: altText,
                    uploaded_by: 'admin',
                    file_size: file.size,
                    mime_type: file.type,
                    created_at: new Date().toISOString(),
                },
            }),
        });

        if (!createDocumentResponse.ok) {
            const errorText = await createDocumentResponse.text();
            throw new Error(`Appwrite metadata save failed: ${createDocumentResponse.status} ${errorText}`);
        }

        const mediaDoc = await createDocumentResponse.json();

        return NextResponse.json({
            success: true,
            document: mediaDoc,
            url: fileUrl,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
