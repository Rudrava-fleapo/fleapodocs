import { getDocumentsForUser } from '@/lib/actions/documents';
import { DocumentList } from '@/components/documents/document-list';
import { getUser } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const documents = await getDocumentsForUser();
  const user = await getUser();
  const userIsAdmin = isAdmin(user?.email, user?.app_metadata?.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Company Documents</h1>
          <p className="text-muted-foreground">
            Review and acknowledge the documents below.
          </p>
        </div>
        {userIsAdmin && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Viewing as Admin (All documents visible)
          </Badge>
        )}
      </div>
      <DocumentList documents={documents} />
    </div>
  );
}
