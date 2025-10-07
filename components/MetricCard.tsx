'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MetricCardProps {
  sectionLabel: string;
  primaryMetric: string;
  metricLabel: string;
  secondaryMetrics?: Array<{
    value: string;
    label: string;
  }>;
  actionButtons?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
  className?: string;
}

export function MetricCard({
  sectionLabel,
  primaryMetric,
  metricLabel,
  secondaryMetrics = [],
  actionButtons = [],
  className = '',
}: MetricCardProps) {
  return (
    <Card className={`card-widget hover:shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-card-title text-foreground">
          {sectionLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12">
        <div className="text-metric text-foreground mb-2">
          {primaryMetric}
        </div>
        <p className="text-body text-gray-600 mb-6">
          {metricLabel}
        </p>
        {secondaryMetrics.length > 0 && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            {secondaryMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-card-title text-foreground">
                  {metric.value}
                </div>
                <div className="text-body text-gray-600">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        )}
        {actionButtons.length > 0 && (
          <div className="flex gap-3">
            {actionButtons.map((button, index) => (
              button.href ? (
                <Link key={index} href={button.href} className="flex-1">
                  <Button
                    variant={button.variant || 'outline'}
                    className="w-full h-12 px-6 text-body border-border hover:bg-accent rounded-lg"
                  >
                    {button.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={index}
                  variant={button.variant || 'outline'}
                  className="flex-1 h-12 px-6 text-body border-border hover:bg-accent rounded-lg"
                  onClick={button.onClick}
                >
                  {button.label}
                </Button>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
