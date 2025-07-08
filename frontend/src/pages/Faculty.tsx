import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';

interface Profile {
  _id: string;
  name: string;
  email: string;
  department?: string;
  phoneNumber?: string;
  isActive: boolean;
  role: string;
}

export default function Faculty() {
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    const response = await apiClient.getAllProfiles({ role: 'faculty', limit: 1000 });
    const data = response.data as { profiles?: Profile[] };
    if (data && Array.isArray(data.profiles)) {
      setFaculty(data.profiles);
    } else {
      setFaculty([]);
    }
    setLoading(false);
  };

  const filtered = faculty.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase()) ||
    (f.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 px-0 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Faculty</h1>
        <p className="text-muted-foreground text-base sm:text-lg">All registered faculty in the system.</p>
      </div>
      <Card className="rounded-none shadow-none border-0 p-0 sm:rounded-lg sm:shadow-sm sm:border">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Faculty List ({filtered.length})</span>
            <Input
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-xs sm:max-w-sm md:max-w-md"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading faculty...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No faculty found.</div>
          ) : (
            <div className="overflow-x-auto w-screen -mx-4 pr-4 sm:w-full sm:mx-0 sm:pr-0">
              <Table className="max-w-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Name</TableHead>
                    <TableHead className="whitespace-normal break-words min-w-[120px] text-xs sm:text-sm p-2">Email</TableHead>
                    <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Department</TableHead>
                    <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Phone</TableHead>
                    <TableHead className="whitespace-normal break-words min-w-[60px] text-xs sm:text-sm p-2">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(faculty => (
                    <TableRow key={faculty._id}>
                      <TableCell className="font-medium whitespace-normal break-words text-xs sm:text-sm p-2 min-w-[80px]">{faculty.name}</TableCell>
                      <TableCell className="whitespace-normal break-words text-xs sm:text-sm p-2 min-w-[120px]">{faculty.email}</TableCell>
                      <TableCell className="whitespace-normal break-words text-xs sm:text-sm p-2 min-w-[80px]">{faculty.department || '-'}</TableCell>
                      <TableCell className="whitespace-normal break-words text-xs sm:text-sm p-2 min-w-[80px]">{faculty.phoneNumber || '-'}</TableCell>
                      <TableCell className="whitespace-normal break-words text-xs sm:text-sm p-2 min-w-[60px]">
                        <Badge variant={faculty.isActive ? 'default' : 'destructive'}>
                          {faculty.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 