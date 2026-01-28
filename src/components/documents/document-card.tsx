
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AcknowledgeButton } from './acknowledge-button';
import type { DocumentWithAcknowledgment } from '@/lib/types';
import { Eye, Download } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentWithAcknowledgment;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const fileExtension = document.file_name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';
  const canPreview = isImage || isPdf;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2" title={document.title}>{document.title}</CardTitle>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={document.visibility === 'all' ? 'default' : 'secondary'} className="whitespace-nowrap">
              {document.visibility === 'all' ? 'All' : 'Targeted'}
            </Badge>
            {document.acknowledged && (
              <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                Done
              </Badge>
            )}
          </div>
        </div>
        {document.description && (
          <CardDescription className="line-clamp-2" title={document.description}>{document.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="flex justify-between">
            <span className="font-medium">File:</span>
            <span className="truncate max-w-[150px]" title={document.file_name}>{document.file_name}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">Uploaded:</span>{' '}
            {new Date(document.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Preview Thumbnail for Images */}
        {isImage && (
          <div className="mt-4 rounded-md overflow-hidden border bg-gray-50 h-32 relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={document.file_url}
              alt={document.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        {/* Placeholder for PDF/Others */}
        {!isImage && (
          <div className="mt-4 rounded-md border bg-gray-50 h-32 flex items-center justify-center">
            <span className="text-gray-400 font-bold text-3xl uppercase tracking-widest">{fileExtension}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap">
        {canPreview ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <Eye className="w-4 h-4" /> Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{document.title}</DialogTitle>
                <DialogDescription>
                  {document.description}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex justify-center bg-gray-50 rounded-lg p-2 min-h-[300px]">
                {isImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={document.file_url} alt={document.title} className="max-w-full h-auto object-contain" />
                )}
                {isPdf && (
                  <iframe
                    src={`${document.file_url}#toolbar=0`}
                    className="w-full h-[600px]"
                    title={document.title}
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" asChild>
                  <a href={document.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="w-4 h-4 mr-2" /> Download Original
                  </a>
                </Button>
                <AcknowledgeButton
                  documentId={document.id}
                  acknowledged={document.acknowledged || false}
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button variant="outline" className="flex-1 gap-2" asChild>
            <a href={document.file_url} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4" /> Download
            </a>
          </Button>
        )}

        {/* If we can preview, the acknowledge button is inside the modal. 
            If not, or for quick access, we can keep it here too, or hide it to force preview. 
            Let's keep it here for quick access. */}
        <AcknowledgeButton documentId={document.id} acknowledged={document.acknowledged || false} />
      </CardFooter>
    </Card>
  );
}
