import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';

// Get all projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/projects');
      return response.data;
    },
  });
}

// Get project by ID
export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await axios.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectData) => {
      const response = await axios.post('/projects', projectData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Update project phase/timeline
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.patch(`/projects/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

// Optimistic File Approval mutation
export function useApproveFile(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, status }) => {
      // PATCH /api/files/:id/approve (sends { status: 'approved' } or { status: 'changes_requested', feedback })
      const response = await axios.patch(`/files/${fileId}/approve`, { status });
      return response.data;
    },
    // Optimistic Update
    onMutate: async ({ fileId, status }) => {
      // Cancel outgoing queries to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      // Snapshot the current project detail
      const previousProject = queryClient.getQueryData(['project', projectId]);

      // Optimistically update the file status in the cache
      if (previousProject) {
        queryClient.setQueryData(['project', projectId], {
          ...previousProject,
          files: previousProject.files?.map((file) =>
            file.id === fileId || file._id === fileId
              ? { ...file, status }
              : file
          ),
        });
      }

      // Return context to rollback in case of failure
      return { previousProject };
    },
    // If mutation fails, rollback to snapshot
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },
    // Always refetch or invalidate after success or error to sync state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}
