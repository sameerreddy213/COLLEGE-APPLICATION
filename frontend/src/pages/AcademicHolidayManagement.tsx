import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuthMongo';

type Holiday = {
  _id?: string;
  title: string;
  date: string;
  [key: string]: unknown;
};

export default function AcademicHolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayForm, setHolidayForm] = useState({date: '', reason: ''});
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; reason: string }>({ date: '', reason: '' });

  const fetchHolidays = async () => {
    apiClient.getAllHolidays().then(res => {
      const data = res.data as unknown;
      if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
        setHolidays(((data as { data: unknown[] }).data) as Holiday[]);
      } else if (Array.isArray(data)) {
        setHolidays(data as Holiday[]);
      }
    });
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Holiday Management</h2>
        <p className="text-muted-foreground">Add and manage academic holidays.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Holiday Management</CardTitle>
          <CardDescription>Add and manage academic holidays.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4 items-end mb-4" onSubmit={async e => {
            e.preventDefault();
            if (holidayForm.date && holidayForm.reason) {
              const payload = {
                title: holidayForm.reason,
                date: holidayForm.date.split('T')[0],
                type: 'academic_holiday',
                category: 'mandatory_holiday',
                affects: { students: true, faculty: true, staff: true, mess: false, hostel: false },
                academicYear: new Date().getFullYear().toString(),
                isRecurring: false,
                recurringPattern: 'yearly',
                isActive: true
              };
              const res = await apiClient.createHoliday(payload);
              if (res.error) {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
              } else {
                toast({ title: 'Success', description: 'Holiday added.' });
                const newHoliday = (res.data as unknown as { data?: Holiday }).data || payload;
                setHolidays(prev => [...prev, newHoliday]);
                setHolidayForm({date: '', reason: ''});
              }
            }
          }}>
            <div>
              <label className="block text-xs mb-1">Date</label>
              <Input type="date" value={holidayForm.date} onChange={e => setHolidayForm(f => ({...f, date: e.target.value}))} className="w-40" required />
            </div>
            <div>
              <label className="block text-xs mb-1">Reason</label>
              <Input value={holidayForm.reason} onChange={e => setHolidayForm(f => ({...f, reason: e.target.value}))} className="w-64" required />
            </div>
            <Button type="submit">Add Holiday</Button>
          </form>
          <div>
            {holidays.length === 0 ? (
              <div className="text-muted-foreground text-sm">No holidays added yet.</div>
            ) : (
              <table className="w-full border-collapse mt-2">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-left font-medium">Date</th>
                    <th className="border p-2 bg-gray-50 text-left font-medium">Reason</th>
                    <th className="border p-2 bg-gray-50 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h, i) => (
                    <tr key={h._id || i}>
                      {editingId === h._id ? (
                        <>
                          <td className="border p-2">
                            <Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
                          </td>
                          <td className="border p-2">
                            <Input value={editForm.reason} onChange={e => setEditForm(f => ({ ...f, reason: e.target.value }))} />
                          </td>
                          <td className="border p-2 flex gap-2">
                            <Button size="sm" onClick={async () => {
                              if (!h._id) return;
                              const payload = {
                                title: editForm.reason,
                                date: editForm.date.split('T')[0],
                                type: h.type || 'academic_holiday',
                                category: h.category || 'mandatory_holiday',
                                affects: h.affects || { students: true, faculty: true, staff: true, mess: false, hostel: false },
                                academicYear: h.academicYear || new Date().getFullYear().toString(),
                                isRecurring: h.isRecurring ?? false,
                                recurringPattern: h.recurringPattern || 'yearly',
                                isActive: h.isActive ?? true
                              };
                              const res = await apiClient.updateHoliday(h._id, payload);
                              if (res.error) {
                                toast({ title: 'Error', description: res.error, variant: 'destructive' });
                              } else {
                                toast({ title: 'Success', description: 'Holiday updated.' });
                                setHolidays(prev => prev.map(hol => hol._id === h._id ? { ...hol, ...payload } : hol));
                                setEditingId(null);
                              }
                            }}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="border p-2">{typeof h.date === 'string' ? h.date.split('T')[0] : ''}</td>
                          <td className="border p-2">{typeof h.title === 'string' ? h.title : (typeof h.reason === 'string' ? h.reason : '')}</td>
                          <td className="border p-2 flex gap-2">
                            {h._id && (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => {
                                  setEditingId(h._id!);
                                  setEditForm({ date: typeof h.date === 'string' ? h.date.split('T')[0] : '', reason: typeof h.title === 'string' ? h.title : (typeof h.reason === 'string' ? h.reason : '') });
                                }}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={async () => {
                                  const res = await apiClient.deleteHoliday(h._id as string);
                                  if (res.error) {
                                    toast({ title: 'Error', description: res.error, variant: 'destructive' });
                                  } else {
                                    toast({ title: 'Success', description: 'Holiday deleted.' });
                                    setHolidays(prev => prev.filter(hol => hol._id !== h._id));
                                  }
                                }}>Delete</Button>
                              </>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 