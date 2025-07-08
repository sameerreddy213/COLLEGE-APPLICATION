
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Calendar, MessageSquare } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Students"
        value="1,234"
        icon={Users}
        description="Active enrolled students"
      />
      <StatCard
        title="Faculty Members"
        value="56"
        icon={Users}
        description="Teaching staff"
      />
      <StatCard
        title="Subjects"
        value="89"
        icon={BookOpen}
        description="Active courses"
      />
      <StatCard
        title="Today's Classes"
        value="24"
        icon={Calendar}
        description="Scheduled for today"
      />
    </div>
  );
}
