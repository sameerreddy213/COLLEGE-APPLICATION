
import { useAuth } from "@/hooks/useAuthMongo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return null; // This will be handled by the authenticated app routing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-700 mb-4">
            IIIT Manipur Digital Campus System
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive digital solution for managing academic, hostel, and administrative 
            activities at Indian Institute of Information Technology, Manipur.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 sm:mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Academic Management</CardTitle>
              <CardDescription>
                Manage students, faculty, subjects, and attendance tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Hostel Management</CardTitle>
              <CardDescription>
                Handle hostel complaints, room assignments, and warden communications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Mess Management</CardTitle>
              <CardDescription>
                Manage daily mess menus, meal types, and dietary preferences
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="mr-0 sm:mr-4 mb-2 sm:mb-0 w-full sm:w-auto">
            Get Started
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
