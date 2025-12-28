import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LayoutAreasTab: React.FC = () => {
  return (
    <div className="flex justify-center w-full">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Layout Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Layout areas configuration will be available here in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

