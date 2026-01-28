'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadDocument } from '@/lib/actions/documents';
import { toast } from 'sonner';

export function UploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<'all' | 'targeted'>('all');
  const [targetEmails, setTargetEmails] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('visibility', visibility);

    // Add target emails if targeted
    if (visibility === 'targeted') {
      const emails = targetEmails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email);

      emails.forEach(email => {
        formData.append('targetEmails', email);
      });
    }

    const result = await uploadDocument(formData);

    if (result.success) {
      toast.success('Document uploaded successfully');
      router.push('/admin');
    } else {
      toast.error(result.error || 'Failed to upload document');
    }

    setLoading(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload New Document</CardTitle>
        <CardDescription>
          Upload a document for employees to view and acknowledge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Document title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description of the document"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File * (PDF or Image)</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value: 'all' | 'targeted') => setVisibility(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="targeted">Specific Employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibility === 'targeted' && (
            <div className="space-y-2">
              <Label htmlFor="targetEmails">Target Employee Emails</Label>
              <Textarea
                id="targetEmails"
                value={targetEmails}
                onChange={(e) => setTargetEmails(e.target.value)}
                placeholder="Enter @fleapo.com emails (one per line or comma-separated)"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Enter email addresses of employees who should see this document.
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
