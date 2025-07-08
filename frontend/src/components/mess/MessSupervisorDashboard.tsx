import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuthMongo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit, Trash2, Save, Utensils, Users } from 'lucide-react';
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

interface TodayMenuResponse {
  data: MessMenu;
  currentMeal: string | null;
}

export default function MessSupervisorDashboard() {
  const { user } = useAuth();
  const [todayMenu, setTodayMenu] = useState<MessMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  // Form state for new menu
  const [newMenu, setNewMenu] = useState({
    date: new Date().toISOString().split('T')[0],
    breakfast: {
      veg: { items: [] as MenuItem[], special: '' },
      nonVeg: { items: [] as MenuItem[], special: '' },
      timing: { start: '07:00', end: '09:00' }
    },
    lunch: {
      veg: { items: [] as MenuItem[], special: '' },
      nonVeg: { items: [] as MenuItem[], special: '' },
      timing: { start: '12:00', end: '14:00' }
    },
    dinner: {
      veg: { items: [] as MenuItem[], special: '' },
      nonVeg: { items: [] as MenuItem[], special: '' },
      timing: { start: '19:00', end: '21:00' }
    },
    snacks: { items: [] as MenuItem[] },
    notes: '',
    isSpecialDay: false,
    specialDayName: '',
    academicYear: '2024-25'
  });

  // State for add item forms
  const [addItemForms, setAddItemForms] = useState<{[key: string]: {name: string, description: string}}>({});

  useEffect(() => {
    fetchTodayMenu();
  }, []);

  const fetchTodayMenu = async () => {
    try {
      const response = await apiClient.getTodayMenu();
      if (response.data) {
        // Handle the double nesting in the API response
        const responseData = response.data as TodayMenuResponse;
        const menuData = responseData.data || response.data;
        setTodayMenu(menuData as MessMenu);
      } else {
        // No menu found for today (404 response)
        setTodayMenu(null);
      }
    } catch (error) {
      console.error('Error fetching today\'s menu:', error);
      setTodayMenu(null);
    } finally {
      setIsLoading(false);
    }
  };



  const handleAddItemFormChange = (meal: string, type: 'veg' | 'nonVeg', field: 'name' | 'description', value: string) => {
    const key = `${meal}-${type}`;
    setAddItemForms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleAddItem = (meal: string, type: 'veg' | 'nonVeg') => {
    const key = `${meal}-${type}`;
    const form = addItemForms[key];
    if (!form?.name?.trim()) return;
    
    const newItem = { name: form.name, description: form.description || '' };
    
    setNewMenu(prev => {
      const mealData = prev[meal as keyof typeof prev] as Record<string, unknown>;
      const mealTypeData = mealData[type] as Record<string, unknown>;
      const items = mealTypeData.items as MenuItem[];
      
      const updatedMeal = {
        ...mealData,
        [type]: {
          ...mealTypeData,
          items: [...items, newItem]
        }
      };
      
      return {
        ...prev,
        [meal]: updatedMeal
      };
    });
    
    setAddItemForms(prev => ({
      ...prev,
      [key]: { name: '', description: '' }
    }));
  };

  const handleAddItemToTodayMenu = (meal: string, type: 'veg' | 'nonVeg') => {
    if (!todayMenu) return;
    
    const key = `${meal}-${type}`;
    const form = addItemForms[key];
    if (!form?.name?.trim()) return;
    
    const newItem = { name: form.name, description: form.description || '' };
    
    setTodayMenu(prev => {
      if (!prev) return prev;
      
      const mealData = prev[meal as keyof typeof prev] as Record<string, unknown>;
      const mealTypeData = mealData[type] as Record<string, unknown>;
      const items = mealTypeData.items as MenuItem[];
      
      const updatedMeal = {
        ...mealData,
        [type]: {
          ...mealTypeData,
          items: [...items, newItem]
        }
      };
      
      return {
        ...prev,
        [meal]: updatedMeal
      };
    });
    
    setAddItemForms(prev => ({
      ...prev,
      [key]: { name: '', description: '' }
    }));
  };

  const handleRemoveItem = (meal: string, type: 'veg' | 'nonVeg', index: number) => {
    setNewMenu(prev => {
      const mealData = prev[meal as keyof typeof prev] as Record<string, unknown>;
      const mealTypeData = mealData[type] as Record<string, unknown>;
      const items = mealTypeData.items as MenuItem[];
      
      const updatedMeal = {
        ...mealData,
        [type]: {
          ...mealTypeData,
          items: items.filter((_: unknown, i: number) => i !== index)
        }
      };
      
      return {
        ...prev,
        [meal]: updatedMeal
      };
    });
  };

  const handleRemoveItemFromTodayMenu = (meal: string, type: 'veg' | 'nonVeg', index: number) => {
    if (!todayMenu) return;
    
    setTodayMenu(prev => {
      if (!prev) return prev;
      
      const mealData = prev[meal as keyof typeof prev] as Record<string, unknown>;
      const mealTypeData = mealData[type] as Record<string, unknown>;
      const items = mealTypeData.items as MenuItem[];
      
      const updatedMeal = {
        ...mealData,
        [type]: {
          ...mealTypeData,
          items: items.filter((_: unknown, i: number) => i !== index)
        }
      };
      
      return {
        ...prev,
        [meal]: updatedMeal
      };
    });
  };

  const handleAddSnack = () => {
    const name = (document.getElementById('snackName') as HTMLInputElement)?.value;
    const description = (document.getElementById('snackDescription') as HTMLInputElement)?.value;
    
    if (!name?.trim()) return;
    
    const newItem = { name, description: description || '' };
    
    setNewMenu(prev => ({
      ...prev,
      snacks: {
        items: [...prev.snacks.items, newItem]
      }
    }));
    
    if (document.getElementById('snackName')) {
      (document.getElementById('snackName') as HTMLInputElement).value = '';
    }
    if (document.getElementById('snackDescription')) {
      (document.getElementById('snackDescription') as HTMLInputElement).value = '';
    }
  };

  const handleAddSnackToTodayMenu = () => {
    if (!todayMenu) return;
    
    const name = (document.getElementById('todaySnackName') as HTMLInputElement)?.value;
    const description = (document.getElementById('todaySnackDescription') as HTMLInputElement)?.value;
    
    if (!name?.trim()) return;
    
    const newItem = { name, description: description || '' };
    
    setTodayMenu(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        snacks: {
          items: [...prev.snacks.items, newItem]
        }
      };
    });
    
    if (document.getElementById('todaySnackName')) {
      (document.getElementById('todaySnackName') as HTMLInputElement).value = '';
    }
    if (document.getElementById('todaySnackDescription')) {
      (document.getElementById('todaySnackDescription') as HTMLInputElement).value = '';
    }
  };

  const handleRemoveSnack = (index: number) => {
    setNewMenu(prev => ({
      ...prev,
      snacks: {
        items: prev.snacks.items.filter((_, i) => i !== index)
      }
    }));
  };

  const handleRemoveSnackFromTodayMenu = (index: number) => {
    if (!todayMenu) return;
    
    setTodayMenu(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        snacks: {
          items: prev.snacks.items.filter((_, i) => i !== index)
        }
      };
    });
  };

  const handleCreateMenu = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.createMenu(newMenu);
      if (response.data) {
        toast.success('Menu created successfully!');
        setActiveTab('today');
        resetNewMenu();
        fetchTodayMenu();
      } else {
        // Show more specific error messages
        if (response.error?.includes('already exists')) {
          toast.error('A menu already exists for this date. Please choose a different date or edit the existing menu.');
        } else {
          toast.error(response.error || 'Failed to create menu');
        }
      }
    } catch (error) {
      console.error('Error creating menu:', error);
      toast.error('Failed to create menu. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMenu = async (menuId: string, updatedData: Partial<MessMenu>) => {
    try {
      setIsLoading(true);
      const response = await apiClient.updateMenu(menuId, updatedData);
      if (response.data) {
        toast.success('Menu updated successfully!');
        setIsEditing(false);
        fetchTodayMenu();
      } else {
        toast.error(response.error || 'Failed to update menu');
      }
    } catch (error) {
      console.error('Error updating menu:', error);
      toast.error('Failed to update menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!menuId || menuId.trim() === '') {
      toast.error('Invalid menu ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this menu?')) return;
    
    try {
      setIsLoading(true);
      const response = await apiClient.deleteMenu(menuId);
      if (response.data) {
        toast.success('Menu deleted successfully!');
        fetchTodayMenu();
      } else {
        toast.error(response.error || 'Failed to delete menu');
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Failed to delete menu');
    } finally {
      setIsLoading(false);
    }
  };



  const resetNewMenu = () => {
    setNewMenu({
      date: new Date().toISOString().split('T')[0],
      breakfast: {
        veg: { items: [], special: '' },
        nonVeg: { items: [], special: '' },
        timing: { start: '07:00', end: '09:00' }
      },
      lunch: {
        veg: { items: [], special: '' },
        nonVeg: { items: [], special: '' },
        timing: { start: '12:00', end: '14:00' }
      },
      dinner: {
        veg: { items: [], special: '' },
        nonVeg: { items: [], special: '' },
        timing: { start: '19:00', end: '21:00' }
      },
      snacks: { items: [] },
      notes: '',
      isSpecialDay: false,
      specialDayName: '',
      academicYear: '2024-25'
    });
  };

  const renderMealSection = (meal: string, mealData: MealData | undefined, isEditing = false) => {
    // Add null checks and default values
    if (!mealData || !mealData.veg || !mealData.nonVeg) {
      return (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </CardTitle>
            <CardDescription>No data available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No menu data for this meal</p>
          </CardContent>
        </Card>
      );
    }

    const vegItems = mealData.veg?.items || [];
    const nonVegItems = mealData.nonVeg?.items || [];

    // If both veg and non-veg items are empty, show a message
    if (vegItems.length === 0 && nonVegItems.length === 0) {
      return (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </CardTitle>
            <CardDescription>
              Timing: {mealData?.timing?.start || '--:--'} - {mealData?.timing?.end || '--:--'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No items added for this meal yet</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            {meal.charAt(0).toUpperCase() + meal.slice(1)}
          </CardTitle>
          <CardDescription>
            Timing: {mealData?.timing?.start || '--:--'} - {mealData?.timing?.end || '--:--'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-green-600">Vegetarian</Label>
              {isEditing && renderAddMenuItemForm(meal, 'veg', true)}
              <div className="space-y-2 mt-2">
                {vegItems.length > 0 ? (
                  vegItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">{item.name}</span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItemFromTodayMenu(meal, 'veg', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2">No vegetarian items</p>
                )}
                {mealData.veg?.special && (
                  <Badge variant="secondary" className="text-xs">
                    Special: {mealData.veg.special}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-red-600">Non-Vegetarian</Label>
              {isEditing && renderAddMenuItemForm(meal, 'nonVeg', true)}
              <div className="space-y-2 mt-2">
                {nonVegItems.length > 0 ? (
                  nonVegItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{item.name}</span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItemFromTodayMenu(meal, 'nonVeg', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2">No non-vegetarian items</p>
                )}
                {mealData.nonVeg?.special && (
                  <Badge variant="secondary" className="text-xs">
                    Special: {mealData.nonVeg.special}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAddMenuItemForm = (meal: string, type: 'veg' | 'nonVeg', isEditingToday = false) => {
    const key = `${meal}-${type}`;
    const form = addItemForms[key] || { name: '', description: '' };

    return (
      <div className="flex gap-2 mb-2">
        <Input
          placeholder="Item name"
          value={form.name || ''}
          onChange={(e) => handleAddItemFormChange(meal, type, 'name', e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Description (optional)"
          value={form.description || ''}
          onChange={(e) => handleAddItemFormChange(meal, type, 'description', e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={() => isEditingToday ? handleAddItemToTodayMenu(meal, type) : handleAddItem(meal, type)} 
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading mess dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mess Management Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.profile?.name}. Manage daily menus and meal planning.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            onClick={async () => {
              if (confirm('Are you sure you want to clear all menus? This action cannot be undone.')) {
                try {
                  const response = await apiClient.clearAllMenus();
                  if (response.data) {
                    toast.success('All menus cleared successfully!');
                    fetchTodayMenu();
                  } else {
                    toast.error(response.error || 'Failed to clear menus');
                  }
                } catch (error) {
                  console.error('Error clearing menus:', error);
                  toast.error('Failed to clear menus');
                }
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Menu</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayMenu ? 'Active' : 'Not Set'}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayMenu ? 'Menu is available' : 'No menu for today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Menus</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayMenu ? 1 : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active menus
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Menu</TabsTrigger>
          <TabsTrigger value="add">Add New Menu</TabsTrigger>
        </TabsList>

        {/* Today's Menu Tab */}
        <TabsContent value="today" className="space-y-4">
          {todayMenu ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Today's Menu - {new Date(todayMenu?.date || '').toLocaleDateString()}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => todayMenu?._id ? handleDeleteMenu(todayMenu._id) : toast.error('No menu to delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {renderMealSection('breakfast', todayMenu?.breakfast, isEditing)}
              {renderMealSection('lunch', todayMenu?.lunch, isEditing)}
              {renderMealSection('dinner', todayMenu?.dinner, isEditing)}

              {(todayMenu?.snacks?.items && todayMenu.snacks.items.length > 0) || isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Snacks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing && (
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Snack name"
                          id="todaySnackName"
                          className="flex-1"
                        />
                        <Input
                          placeholder="Description (optional)"
                          id="todaySnackDescription"
                          className="flex-1"
                        />
                        <Button onClick={handleAddSnackToTodayMenu} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {todayMenu?.snacks?.items && todayMenu.snacks.items.length > 0 ? (
                        todayMenu.snacks.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{item.name}</span>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSnackFromTodayMenu(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-2">No snacks added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {todayMenu?.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{todayMenu?.notes}</p>
                  </CardContent>
                </Card>
              )}

              {isEditing && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleUpdateMenu(todayMenu?._id || '', todayMenu || {})}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Menu for Today</h3>
                <p className="text-muted-foreground mb-4">
                  There's no menu set for today. Create one to get started.
                </p>
                <Button onClick={() => {
                  setNewMenu(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
                  setActiveTab('add');
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Today's Menu
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        {/* Add New Menu Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Menu</CardTitle>
              <CardDescription>
                Add a new menu for any date. Fill in the details below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMenu.date}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={newMenu.academicYear}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, academicYear: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSpecialDay"
                  checked={newMenu.isSpecialDay}
                  onChange={(e) => setNewMenu(prev => ({ ...prev, isSpecialDay: e.target.checked }))}
                />
                <Label htmlFor="isSpecialDay">Special Day</Label>
              </div>

              {newMenu.isSpecialDay && (
                <div>
                  <Label htmlFor="specialDayName">Special Day Name</Label>
                  <Input
                    id="specialDayName"
                    value={newMenu.specialDayName}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, specialDayName: e.target.value }))}
                    placeholder="e.g., Republic Day, Independence Day"
                  />
                </div>
              )}

              {/* Breakfast Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Breakfast</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vegetarian Items</Label>
                    {renderAddMenuItemForm('breakfast', 'veg')}
                    <div className="space-y-1">
                      {newMenu.breakfast.veg.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem('breakfast', 'veg', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Non-Vegetarian Items</Label>
                    {renderAddMenuItemForm('breakfast', 'nonVeg')}
                    <div className="space-y-1">
                      {newMenu.breakfast.nonVeg.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem('breakfast', 'nonVeg', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lunch Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Lunch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vegetarian Items</Label>
                    {renderAddMenuItemForm('lunch', 'veg')}
                    <div className="space-y-1">
                      {newMenu.lunch.veg.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem('lunch', 'veg', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Non-Vegetarian Items</Label>
                    {renderAddMenuItemForm('lunch', 'nonVeg')}
                    <div className="space-y-1">
                      {newMenu.lunch.nonVeg.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem('lunch', 'nonVeg', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dinner Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Dinner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vegetarian Items</Label>
                    {renderAddMenuItemForm('dinner', 'veg')}
                    <div className="space-y-1">
                      {newMenu.dinner.veg.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem('dinner', 'veg', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Non-Vegetarian Items</Label>
                    {renderAddMenuItemForm('dinner', 'nonVeg')}
                    <div className="space-y-1">
                      {newMenu.dinner.nonVeg.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem('dinner', 'nonVeg', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Snacks Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Snacks</h3>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Snack name"
                    id="snackName"
                    defaultValue=""
                    className="flex-1"
                  />
                  <Input
                    placeholder="Description (optional)"
                    id="snackDescription"
                    defaultValue=""
                    className="flex-1"
                  />
                  <Button onClick={handleAddSnack} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {newMenu.snacks.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{item.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSnack(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newMenu.notes}
                  onChange={(e) => setNewMenu(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes or special instructions..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateMenu} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create Menu'}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('today')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
