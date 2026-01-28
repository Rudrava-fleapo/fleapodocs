import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AcknowledgmentList } from '@/components/admin/acknowledgment-list';
import { getDocumentWithAcknowledgments } from '@/lib/actions/documents';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentAcknowledgmentsPage({ params }: PageProps) {
  const { id } = await params;
  const { document, acknowledgments, targetEmails } = await getDocumentWithAcknowledgments(id);

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <Badge variant={document.visibility === 'all' ? 'default' : 'secondary'}>
            {document.visibility === 'all' ? 'All Employees' : 'Targeted'}
          </Badge>
        </div>
        {document.description && (
          <p className="text-muted-foreground">{document.description}</p>
        )}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">File:</span>{' '}
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {document.file_name}
          </a>
        </div>
      </div>

      <AcknowledgmentList
        acknowledgments={acknowledgments}
        targetEmails={targetEmails}
        visibility={document.visibility}
      />
    </div>
  );
}
