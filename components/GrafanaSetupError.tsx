'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Key } from 'lucide-react';
import Link from 'next/link';

interface GrafanaSetupErrorProps {
  error: string;
}

export function GrafanaSetupError({ error }: GrafanaSetupErrorProps) {
  const isPermissionError = error.includes('permission') || error.includes('403');
  const isConfigError = error.includes('configuration is missing');

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Grafana Connection Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
        </AlertDescription>
      </Alert>

      {isPermissionError && (
        <Alert>
          <Key className="h-4 w-4" />
          <AlertTitle>API Key Permission Issue</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>Your Grafana API key doesn&apos;t have the required permissions.</p>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="font-semibold mb-2">Quick Fix:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Log in to Grafana as admin</li>
                <li>Go to: <strong>Administration → Service Accounts</strong></li>
                <li>Create a new service account with <strong>Admin</strong> role</li>
                <li>Generate a token and copy it</li>
                <li>Update <code className="bg-background px-1 py-0.5 rounded">GRAFANA_API_KEY</code> in your <code className="bg-background px-1 py-0.5 rounded">.env.local</code></li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Link href="https://grafana.com/docs/grafana/latest/administration/service-accounts/" target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Service Accounts Docs
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isConfigError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Missing</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>The Grafana connection is not configured properly.</p>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="font-semibold mb-2">Setup Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Copy <code className="bg-background px-1 py-0.5 rounded">.env.example</code> to <code className="bg-background px-1 py-0.5 rounded">.env.local</code></li>
                <li>Set <code className="bg-background px-1 py-0.5 rounded">NEXT_PUBLIC_GRAFANA_URL</code> to your Grafana URL</li>
                <li>Set <code className="bg-background px-1 py-0.5 rounded">GRAFANA_API_KEY</code> to your Grafana service account token</li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-md font-mono text-xs">
              <p className="mb-2"># .env.local</p>
              <p>NEXT_PUBLIC_GRAFANA_URL=http://your-grafana-url:3000</p>
              <p>GRAFANA_API_KEY=glsa_your_token_here</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
