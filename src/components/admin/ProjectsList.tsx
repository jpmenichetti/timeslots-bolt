import { Calendar, Plus, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  starting_date: string;
  created_at: string;
}

interface ProjectsListProps {
  projects: Project[];
  selectedProject: string | null;
  loading: boolean;
  deletingProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string, projectName: string) => void;
  formatDate: (dateString: string) => string;
}

export function ProjectsList({
  projects,
  selectedProject,
  loading,
  deletingProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  formatDate,
}: ProjectsListProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Calendar size={20} />
          Projects
        </h2>
        <button
          onClick={onCreateProject}
          className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`relative p-4 rounded-lg border-2 transition-all group ${
                selectedProject === project.id
                  ? 'border-orange-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className="w-full text-left"
              >
                <div className="font-medium text-slate-800">{project.name}</div>
                <div className="text-sm text-slate-600 mt-1">
                  Starts: {formatDate(project.starting_date)}
                </div>
              </button>
              <button
                onClick={() => onDeleteProject(project.id, project.name)}
                disabled={deletingProjectId === project.id}
                className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete project"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
