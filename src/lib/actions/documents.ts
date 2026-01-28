'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Document, DocumentWithAcknowledgment, Acknowledgment } from '@/lib/types';

export async function getDocumentsForUser(): Promise<DocumentWithAcknowledgment[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return [];
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !documents) {
    console.error('Error fetching documents:', error);
    return [];
  }

  // Get user's acknowledgments
  const { data: acknowledgments } = await supabase
    .from('acknowledgments')
    .select('document_id')
    .eq('user_id', user.id);

  const acknowledgedDocIds = new Set(acknowledgments?.map(a => a.document_id) || []);

  return documents.map(doc => ({
    ...doc,
    acknowledged: acknowledgedDocIds.has(doc.id),
  }));
}

export async function acknowledgeDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('acknowledgments')
    .insert({
      document_id: documentId,
      user_id: user.id,
      user_email: user.email,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Already acknowledged' };
    }
    console.error('Error acknowledging document:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

// Admin functions
export async function getAllDocuments(): Promise<Document[]> {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return documents || [];
}

export async function getDocumentWithAcknowledgments(documentId: string): Promise<{
  document: Document | null;
  acknowledgments: Acknowledgment[];
  targetEmails: string[];
}> {
  const supabase = await createClient();

  const [docResult, ackResult, targetsResult] = await Promise.all([
    supabase.from('documents').select('*').eq('id', documentId).single(),
    supabase.from('acknowledgments').select('*').eq('document_id', documentId).order('acknowledged_at', { ascending: false }),
    supabase.from('document_targets').select('target_email').eq('document_id', documentId),
  ]);

  return {
    document: docResult.data,
    acknowledgments: ackResult.data || [],
    targetEmails: targetsResult.data?.map(t => t.target_email) || [],
  };
}

export async function uploadDocument(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.app_metadata?.role || user.app_metadata.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const visibility = formData.get('visibility') as 'all' | 'targeted';
  const file = formData.get('file') as File;
  const targetEmails = formData.getAll('targetEmails') as string[];

  if (!title || !file) {
    return { success: false, error: 'Title and file are required' };
  }

  // Upload file to storage
  const fileName = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return { success: false, error: 'Failed to upload file' };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  // Create document record
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      title,
      description: description || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      visibility,
      created_by: user.id,
    })
    .select()
    .single();

  if (docError) {
    console.error('Error creating document:', docError);
    return { success: false, error: 'Failed to create document' };
  }

  // Add target emails if visibility is targeted
  if (visibility === 'targeted' && targetEmails.length > 0) {
    const targets = targetEmails
      .filter(email => email.trim())
      .map(email => ({
        document_id: document.id,
        target_email: email.trim().toLowerCase(),
      }));

    if (targets.length > 0) {
      const { error: targetError } = await supabase
        .from('document_targets')
        .insert(targets);

      if (targetError) {
        console.error('Error adding targets:', targetError);
      }
    }
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.app_metadata?.role || user.app_metadata.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  // Get the document to find the file name
  const { data: document } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', documentId)
    .single();

  if (document?.file_url) {
    // Extract file name from URL
    const fileName = document.file_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('documents').remove([fileName]);
    }
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: 'Failed to delete document' };
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}
