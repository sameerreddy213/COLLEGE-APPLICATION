import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface StudentBatch {
  _id: string;
  name: string;
  createdAt: string;
}

export interface BatchSection {
  _id: string;
  name: string;
  batch: string;
  createdAt: string;
}

export function useStudentBatches() {
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.getAllBatches();
      if (res.data && Array.isArray(res.data.batches)) {
        setBatches(res.data.batches);
      } else if (Array.isArray(res.data)) {
        setBatches(res.data);
      } else {
        setBatches([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addBatch = async (data: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await apiClient.createBatch(data);
    if (res.data && res.data.batch) {
      setBatches(prev => [...prev, res.data.batch]);
    }
  };

  const updateBatch = async (id: string, data: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await apiClient.updateBatch(id, data);
    if (res.data && res.data.batch) {
      setBatches(prev => prev.map(b => (b._id === id ? res.data.batch : b)));
    }
  };

  const deleteBatch = async (id: string) => {
    await apiClient.deleteBatch(id);
    setBatches(prev => prev.filter(b => b._id !== id));
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return { batches, isLoading, addBatch, updateBatch, deleteBatch, fetchBatches };
}

export function useBatchSections(batchId: string) {
  const [sections, setSections] = useState<BatchSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.getSectionsByBatch(batchId);
      if (res.data && Array.isArray(res.data.sections)) {
        setSections(res.data.sections);
      } else {
        setSections([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addSection = async (data: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await apiClient.createSection({ ...data, batch: batchId });
    if (res.data && res.data.section) {
      setSections(prev => [...prev, res.data.section]);
    }
  };

  const updateSection = async (id: string, data: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await apiClient.updateSection(id, data);
    if (res.data && res.data.section) {
      setSections(prev => prev.map(s => (s._id === id ? res.data.section : s)));
    }
  };

  const deleteSection = async (id: string) => {
    await apiClient.deleteSection(id);
    setSections(prev => prev.filter(s => s._id !== id));
  };

  useEffect(() => {
    if (batchId) fetchSections();
  }, [batchId]);

  return { sections, isLoading, addSection, updateSection, deleteSection, fetchSections };
} 