import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

interface MenuItem {
  name: string;
  description?: string;
}

interface MealData {
  veg: {
    items: MenuItem[];
    special?: string;
  };
  nonVeg: {
    items: MenuItem[];
    special?: string;
  };
  timing: {
    start: string;
    end: string;
  };
}

interface MessMenu {
  _id: string;
  date: string;
  breakfast: MealData;
  lunch: MealData;
  dinner: MealData;
  snacks: {
    items: MenuItem[];
  };
  notes?: string;
  isSpecialDay: boolean;
  specialDayName?: string;
  isActive: boolean;
}

export default function MessMenuPage() {
  const navigate = useNavigate();
  const [todayMenu, setTodayMenu] = useState<MessMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayMenu();
  }, []);

  const fetchTodayMenu = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getTodayMenu();
      if (response.data) {
        const responseData = response.data as { data: MessMenu } | MessMenu;
        const menuData = 'data' in responseData ? responseData.data : responseData;
        setTodayMenu(menuData);
      } else {
        setTodayMenu(null);
      }
    } catch (error) {
      console.error('Error fetching today\'s menu:', error);
      toast.error('Failed to load today\'s menu');
      setTodayMenu(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMealSection = (meal: string, mealData: MealData) => {
    const vegItems = mealData.veg?.items || [];
    const nonVegItems = mealData.nonVeg?.items || [];

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            {meal.charAt(0).toUpperCase() + meal.slice(1)}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {mealData?.timing?.start || '--:--'} - {mealData?.timing?.end || '--:--'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Vegetarian</h4>
              {vegItems.length > 0 ? (
                <div className="space-y-2">
                  {vegItems.map((item, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
                  No vegetarian items
                </p>
              )}
              {mealData.veg?.special && (
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    Special: {mealData.veg.special}
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-red-600 mb-3">Non-Vegetarian</h4>
              {nonVegItems.length > 0 ? (
                <div className="space-y-2">
                  {nonVegItems.map((item, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
                  No non-vegetarian items
                </p>
              )}
              {mealData.nonVeg?.special && (
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    Special: {mealData.nonVeg.special}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading today's menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Today's Mess Menu</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {todayMenu ? (
        <div>
          {/* Special Day Banner */}
          {todayMenu.isSpecialDay && todayMenu.specialDayName && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-800">
                    Special Day: {todayMenu.specialDayName}
                  </h3>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meals */}
          {renderMealSection('breakfast', todayMenu.breakfast)}
          {renderMealSection('lunch', todayMenu.lunch)}
          {renderMealSection('dinner', todayMenu.dinner)}

          {/* Snacks */}
          {todayMenu.snacks?.items && todayMenu.snacks.items.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Snacks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayMenu.snacks.items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {todayMenu.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{todayMenu.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Utensils className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Menu Available</h3>
            <p className="text-muted-foreground mb-4">
              There's no menu set for today. Please check back later or contact the mess supervisor.
            </p>
            <Button onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 