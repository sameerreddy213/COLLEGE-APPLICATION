
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, Calendar, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MessSupervisorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mess Supervisor Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Menu</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Meals planned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Menu</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veg Menu</CardTitle>
            <Utensils className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Updated</div>
            <p className="text-xs text-muted-foreground">For today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Veg Menu</CardTitle>
            <Utensils className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Updated</div>
            <p className="text-xs text-muted-foreground">For today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Menu</CardTitle>
            <CardDescription>Current meal plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <h4 className="font-semibold flex items-center">
                  <Utensils className="mr-2 h-4 w-4" />
                  Breakfast
                </h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><strong>Veg:</strong> Paratha, Curd, Pickle</p>
                  <p className="text-sm"><strong>Non-Veg:</strong> Egg Curry, Bread</p>
                </div>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-semibold flex items-center">
                  <Utensils className="mr-2 h-4 w-4" />
                  Lunch
                </h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><strong>Veg:</strong> Rice, Dal, Sabzi, Chapati</p>
                  <p className="text-sm"><strong>Non-Veg:</strong> Chicken Curry, Rice</p>
                </div>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-semibold flex items-center">
                  <Utensils className="mr-2 h-4 w-4" />
                  Dinner
                </h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><strong>Veg:</strong> Rice, Rajma, Sabzi</p>
                  <p className="text-sm"><strong>Non-Veg:</strong> Fish Curry, Rice</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Menu management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Add Today's Menu
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Current Menu
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Weekly Menu Planning
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Utensils className="mr-2 h-4 w-4" />
              View All Menus
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
