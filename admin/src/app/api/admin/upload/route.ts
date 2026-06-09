/**
 * Admin Media Upload API
 * Uploads files to Appwrite Storage and records metadata in admin-media collection
 */
import { NextRequest, NextResponse } from 'next/server';
import { storage, databases, DATABASE_ID, COLLECTIONS, BUCKET_ID, ID } from '@/lib/appwrite';
import { getSession } from '@/lib/auth';
import { InputFile } from 'node-appwrite/file';

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

        // Convert File to buffer for node-appwrite
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileId = ID.unique();

        // Upload to Appwrite Storage
        const uploadedFile = await storage.createFile(
            BUCKET_ID,
            fileId,
            InputFile.fromBuffer(buffer, file.name)
        );

        // Build the public file URL
        const endpoint = process.env.APPWRITE_ENDPOINT;
        const projectId = process.env.APPWRITE_PROJECT_ID;
        const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${projectId}`;

        // Save metadata to admin-media collection
        const mediaDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.MEDIA,
            ID.unique(),
            {
                file_id: uploadedFile.$id,
                url: fileUrl,
                alt_text: altText,
                uploaded_by: 'admin',
                file_size: file.size,
                mime_type: file.type,
                created_at: new Date().toISOString(),
            }
        );

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
