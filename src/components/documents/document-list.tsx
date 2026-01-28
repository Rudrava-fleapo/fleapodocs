
'use client';

import { useState } from 'react';
import type { DocumentWithAcknowledgment } from '@/lib/types';
import { DocumentCard } from './document-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentListProps {
  documents: DocumentWithAcknowledgment[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const [filter, setFilter] = useState<'all' | 'acknowledged' | 'unacknowledged'>('all');
  const [search, setSearch] = useState('');

  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase());

    // Status filter
    if (filter === 'all') return matchesSearch;
    if (filter === 'acknowledged') return matchesSearch && doc.acknowledged;
    if (filter === 'unacknowledged') return matchesSearch && !doc.acknowledged;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'unacknowledged' ? 'default' : 'outline'}
            onClick={() => setFilter('unacknowledged')}
            size="sm"
          >
            To Review
          </Button>
          <Button
            variant={filter === 'acknowledged' ? 'default' : 'outline'}
            onClick={() => setFilter('acknowledged')}
            size="sm"
          >
            Acknowledged
          </Button>
        </div>

        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[300px]"
        />
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-gray-50">
          <p className="text-lg">No documents found</p>
          <p className="text-sm">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
}
