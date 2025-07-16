import { useState, useEffect } from 'react';
import { Project } from '../types';
import { projectsApi } from '../lib/api';

interface UseProjectsReturn {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  createProject: (projectData: Partial<Project>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectsApi.getProjects() as any;
      setProjects(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectsApi.createProject(projectData) as any;
      const newProject = response.data;
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectsApi.updateProject(id, updates) as any;
      const updatedProject = response.data;
      setProjects(prev =>
        prev.map(project => project.id === id ? updatedProject : project)
      );
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await projectsApi.deleteProject(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    currentProject,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    refreshProjects,
  };
}
