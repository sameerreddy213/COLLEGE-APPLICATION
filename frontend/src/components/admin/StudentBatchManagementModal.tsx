import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Plus, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudentBatches, useBatchSections } from '@/hooks/useStudentBatches';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';

export default function StudentBatchManagementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<{ _id: string; name: string } | null>(null);
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [editBatchName, setEditBatchName] = useState('');
  const { batches, isLoading, addBatch, updateBatch, deleteBatch } = useStudentBatches();
  const { toast } = useToast();
  const [newBatchName, setNewBatchName] = useState('');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [sectionDialogBatch, setSectionDialogBatch] = useState<{ _id: string; name: string } | null>(null);
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch section counts for all batches when modal opens or batches change
  useEffect(() => {
    if (isOpen && batches.length > 0) {
      Promise.all(
        batches.map(async (batch) => {
          const res = await apiClient.getSectionsByBatch(batch._id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = res.data as any;
          return { id: batch._id, count: Array.isArray(data?.sections) ? data.sections.length : 0 };
        })
      ).then(results => {
        const counts: Record<string, number> = {};
        results.forEach(r => { counts[r.id] = r.count; });
        setSectionCounts(counts);
      });
    }
  }, [isOpen, batches]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) {
      toast({ title: 'Validation Error', description: 'Batch name is required', variant: 'destructive' });
      return;
    }
    setIsCreatingBatch(true);
    try {
      await addBatch({ name: newBatchName.trim() });
      setNewBatchName('');
      toast({ title: 'Success', description: 'Batch created successfully' });
      setActiveTab('list');
    } catch {
      toast({ title: 'Error', description: 'Failed to create batch', variant: 'destructive' });
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleEditBatch = (batch: { _id: string; name: string }) => {
    setSelectedBatch(batch);
    setEditBatchName(batch.name);
    setIsEditingBatch(true);
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await updateBatch(selectedBatch._id, { name: editBatchName.trim() });
      toast({ title: 'Success', description: 'Batch updated successfully' });
      setIsEditingBatch(false);
      setSelectedBatch(null);
      setEditBatchName('');
    } catch {
      toast({ title: 'Error', description: 'Failed to update batch', variant: 'destructive' });
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await deleteBatch(id);
      toast({ title: 'Success', description: 'Batch deleted successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete batch', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-2 justify-start"><Plus className="mr-2 h-4 w-4" />Manage Student Batches</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Student Batch Management
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'list' | 'create')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list"><Users className="mr-2 h-4 w-4" />List</TabsTrigger>
            <TabsTrigger value="create"><Plus className="mr-2 h-4 w-4" />Create</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Student Batches</CardTitle>
                <CardDescription>Manage all student batches (e.g., 2022-2026)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end mb-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Batches</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by batch name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map(batch => (
                      <TableRow key={batch._id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium flex items-center gap-2">
                          <Badge variant="outline" className="text-base px-3 py-1">{batch.name}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(batch.createdAt).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell>
                          <span className="flex gap-2 items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => handleEditBatch(batch)}><Edit className="h-3 w-3" /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Batch</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteBatch(batch._id)}><Trash2 className="h-3 w-3" /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Batch</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="secondary" onClick={() => setSectionDialogBatch(batch)}>
                                    <Users className="h-3 w-3 mr-1" />Sections
                                    <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5">{sectionCounts[batch._id] || 0}</Badge>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Manage Sections</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="create">
            <form onSubmit={handleCreateBatch} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="batch-name">Batch Name *</Label>
                <Input
                  id="batch-name"
                  value={newBatchName}
                  onChange={e => setNewBatchName(e.target.value)}
                  required
                  placeholder="e.g., 2022-2026"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isLoading || isCreatingBatch}>
                  {isLoading || isCreatingBatch ? 'Creating...' : 'Create Batch'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        <Dialog open={isEditingBatch} onOpenChange={setIsEditingBatch}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" /> Edit Student Batch
              </DialogTitle>
            </DialogHeader>
            {selectedBatch && (
              <form onSubmit={handleUpdateBatch} className="space-y-4">
                <div>
                  <Label htmlFor="edit-batch-name">Batch Name *</Label>
                  <Input
                    id="edit-batch-name"
                    value={editBatchName}
                    onChange={e => setEditBatchName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditingBatch(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
        {sectionDialogBatch && (
          <Dialog open={!!sectionDialogBatch} onOpenChange={open => !open && setSectionDialogBatch(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Manage Sections for {sectionDialogBatch.name}
                </DialogTitle>
              </DialogHeader>
              <BatchSectionsManager batchId={sectionDialogBatch._id} />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BatchSectionsManager({ batchId }: { batchId: string }) {
  const { sections, isLoading, addSection, updateSection, deleteSection } = useBatchSections(batchId);
  const [newSectionName, setNewSectionName] = useState('');
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const { toast } = useToast();

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      toast({ title: 'Validation Error', description: 'Section name is required', variant: 'destructive' });
      return;
    }
    try {
      await addSection({ name: newSectionName.trim() });
      setNewSectionName('');
      toast({ title: 'Success', description: 'Section created successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create section', variant: 'destructive' });
    }
  };

  const handleEditSection = (id: string, name: string) => {
    setEditSectionId(id);
    setEditSectionName(name);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSectionId) return;
    try {
      await updateSection(editSectionId, { name: editSectionName.trim() });
      setEditSectionId(null);
      setEditSectionName('');
      toast({ title: 'Success', description: 'Section updated successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update section', variant: 'destructive' });
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await deleteSection(id);
      toast({ title: 'Success', description: 'Section deleted successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    }
  };

  return (
    <div>
      <form onSubmit={handleAddSection} className="flex gap-2 mb-4">
        <Input
          placeholder="Section name (e.g., A, B, C)"
          value={newSectionName}
          onChange={e => setNewSectionName(e.target.value)}
        />
        <Button type="submit" disabled={isLoading}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </form>
      {isLoading ? (
        <div className="text-center py-4">Loading sections...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map(section => (
              <TableRow key={section._id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Badge variant="outline" className="text-base px-3 py-1">{section.name}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(section.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => handleEditSection(section._id, section.name)}><Edit className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Section</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteSection(section._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Section</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {/* Inline edit form for section */}
      {editSectionId && (
        <form onSubmit={handleUpdateSection} className="flex gap-2 mt-4">
          <Input
            value={editSectionName}
            onChange={e => setEditSectionName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">Save</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditSectionId(null)}>Cancel</Button>
        </form>
      )}
    </div>
  );
} 