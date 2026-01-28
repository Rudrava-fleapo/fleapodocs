import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminDocumentCard } from '@/components/admin/admin-document-card';
import { getAllDocuments, getDocumentWithAcknowledgments } from '@/lib/actions/documents';

export default async function AdminPage() {
  const documents = await getAllDocuments();

  // Get acknowledgment counts for each document
  const docsWithCounts = await Promise.all(
    documents.map(async (doc) => {
      const { acknowledgments } = await getDocumentWithAcknowledgments(doc.id);
      return {
        document: doc,
        acknowledgmentCount: acknowledgments.length,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage documents and view acknowledgments.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/upload">Upload Document</Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No documents uploaded yet</p>
          <p className="text-sm">Click &quot;Upload Document&quot; to add your first document.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docsWithCounts.map(({ document, acknowledgmentCount }) => (
            <AdminDocumentCard
              key={document.id}
              document={document}
              acknowledgmentCount={acknowledgmentCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
