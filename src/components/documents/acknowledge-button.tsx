'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { acknowledgeDocument } from '@/lib/actions/documents';
import { toast } from 'sonner';

interface AcknowledgeButtonProps {
  documentId: string;
  acknowledged: boolean;
}

export function AcknowledgeButton({ documentId, acknowledged }: AcknowledgeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(acknowledged);

  const handleAcknowledge = async () => {
    setLoading(true);
    const result = await acknowledgeDocument(documentId);

    if (result.success) {
      setIsAcknowledged(true);
      toast.success('Document acknowledged successfully');
    } else {
      toast.error(result.error || 'Failed to acknowledge document');
    }

    setLoading(false);
  };

  if (isAcknowledged) {
    return (
      <Button variant="outline" disabled className="text-green-600 border-green-600">
        Acknowledged
      </Button>
    );
  }

  return (
    <Button onClick={handleAcknowledge} disabled={loading}>
      {loading ? 'Acknowledging...' : 'Acknowledge'}
    </Button>
  );
}
