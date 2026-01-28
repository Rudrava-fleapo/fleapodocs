import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteButton } from './delete-button';
import type { Document } from '@/lib/types';

interface AdminDocumentCardProps {
  document: Document;
  acknowledgmentCount: number;
}

export function AdminDocumentCard({ document, acknowledgmentCount }: AdminDocumentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{document.title}</CardTitle>
          <Badge variant={document.visibility === 'all' ? 'default' : 'secondary'}>
            {document.visibility === 'all' ? 'All' : 'Targeted'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          {document.description && (
            <p className="mb-2">{document.description}</p>
          )}
          <p>
            <span className="font-medium">File:</span> {document.file_name}
          </p>
          <p>
            <span className="font-medium">Uploaded:</span>{' '}
            {new Date(document.created_at).toLocaleDateString()}
          </p>
          <p>
            <span className="font-medium">Acknowledgments:</span> {acknowledgmentCount}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <a href={document.file_url} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/documents/${document.id}`}>
            View Acknowledgments
          </Link>
        </Button>
        <DeleteButton documentId={document.id} documentTitle={document.title} />
      </CardFooter>
    </Card>
  );
}
