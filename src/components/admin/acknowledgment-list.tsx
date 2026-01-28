import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Acknowledgment } from '@/lib/types';

interface AcknowledgmentListProps {
  acknowledgments: Acknowledgment[];
  targetEmails: string[];
  visibility: 'all' | 'targeted';
}

export function AcknowledgmentList({ acknowledgments, targetEmails, visibility }: AcknowledgmentListProps) {
  const acknowledgedEmails = new Set(acknowledgments.map(a => a.user_email));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Acknowledged ({acknowledgments.length})
            <Badge variant="default">{acknowledgments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acknowledgments.length === 0 ? (
            <p className="text-muted-foreground">No acknowledgments yet.</p>
          ) : (
            <ul className="space-y-2">
              {acknowledgments.map((ack) => (
                <li
                  key={ack.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span>{ack.user_email}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(ack.acknowledged_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {visibility === 'targeted' && targetEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending
              <Badge variant="secondary">
                {targetEmails.filter(e => !acknowledgedEmails.has(e)).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {targetEmails.filter(e => !acknowledgedEmails.has(e)).length === 0 ? (
              <p className="text-green-600">All targeted employees have acknowledged!</p>
            ) : (
              <ul className="space-y-2">
                {targetEmails
                  .filter(email => !acknowledgedEmails.has(email))
                  .map((email) => (
                    <li
                      key={email}
                      className="py-2 border-b last:border-0 text-muted-foreground"
                    >
                      {email}
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
