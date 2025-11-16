import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { CreateTimeSlotModal } from './CreateTimeSlotModal';
import { ConfirmModal } from './ConfirmModal';
import { ReservationChart } from './ReservationChart';
import { CreateAdminModal } from './CreateAdminModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { AppBanner } from './AppBanner';
import { ProjectsList } from './admin/ProjectsList';
import { DateFilterControls } from './admin/DateFilterControls';
import { TimeSlotsList } from './admin/TimeSlotsList';
import { UserManagementTable } from './admin/UserManagementTable';
import { useAdminDashboard } from './admin/useAdminDashboard';

export function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const {
    projects,
    selectedProject,
    setSelectedProject,
    timeSlots,
    users,
    loading,
    reservationData,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    getDefaultStartDate,
    getDefaultEndDate,
    fetchProjects,
    fetchTimeSlots,
    fetchReservationData,
    fetchUsers,
  } = useAdminDashboard();

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [confirmDeleteSlotModal, setConfirmDeleteSlotModal] = useState<{
    slotId: string;
    slotName: string;
  } | null>(null);
  const [confirmDeleteProjectModal, setConfirmDeleteProjectModal] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);
  const [confirmDeleteUserModal, setConfirmDeleteUserModal] = useState<{
    userId: string;
    userName: string;
    userRole: string;
  } | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [confirmBlockModal, setConfirmBlockModal] = useState<{
    userId: string;
    userName: string;
    currentBlockStatus: boolean;
  } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('next-two-weeks');
  const [showAvailable, setShowAvailable] = useState<boolean>(true);
  const [showFull, setShowFull] = useState<boolean>(true);

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'last-month': {
        const start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        setStartDateFilter(start.toISOString().split('T')[0]);
        setEndDateFilter(now.toISOString().split('T')[0]);
        break;
      }
      case 'last-two-weeks': {
        const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        setStartDateFilter(start.toISOString().split('T')[0]);
        setEndDateFilter(now.toISOString().split('T')[0]);
        break;
      }
      case 'next-two-weeks': {
        const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        setStartDateFilter(now.toISOString().split('T')[0]);
        setEndDateFilter(end.toISOString().split('T')[0]);
        break;
      }
      case 'next-month': {
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);
        setStartDateFilter(now.toISOString().split('T')[0]);
        setEndDateFilter(end.toISOString().split('T')[0]);
        break;
      }
    }
  };

  const handleProjectCreated = () => {
    setShowProjectModal(false);
    fetchProjects();
  };

  const handleTimeSlotCreated = () => {
    setShowTimeSlotModal(false);
    if (selectedProject) {
      fetchTimeSlots(selectedProject);
      fetchReservationData(selectedProject);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUserModal) return;

    setDeletingUserId(confirmDeleteUserModal.userId);

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', confirmDeleteUserModal.userId);

    if (error) {
      alert('Failed to delete user: ' + error.message);
    } else {
      fetchUsers();
      if (selectedProject) {
        fetchTimeSlots(selectedProject);
      }
    }

    setDeletingUserId(null);
    setConfirmDeleteUserModal(null);
  };

  const handleDeleteTimeSlot = async () => {
    if (!confirmDeleteSlotModal) return;

    setDeletingSlotId(confirmDeleteSlotModal.slotId);

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', confirmDeleteSlotModal.slotId);

    if (error) {
      alert('Failed to delete time slot: ' + error.message);
    } else if (selectedProject) {
      fetchTimeSlots(selectedProject);
      fetchReservationData(selectedProject);
    }

    setDeletingSlotId(null);
    setConfirmDeleteSlotModal(null);
  };

  const handleToggleBlockUser = async () => {
    if (!confirmBlockModal) return;

    const { userId, currentBlockStatus } = confirmBlockModal;
    const action = currentBlockStatus ? 'unblock' : 'block';

    setBlockingUserId(userId);
    setConfirmBlockModal(null);

    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentBlockStatus })
      .eq('id', userId);

    if (error) {
      alert(`Failed to ${action} user: ` + error.message);
    } else {
      fetchUsers();
    }

    setBlockingUserId(null);
  };

  const handleDeleteProject = async () => {
    if (!confirmDeleteProjectModal) return;

    setDeletingProjectId(confirmDeleteProjectModal.projectId);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', confirmDeleteProjectModal.projectId);

    if (error) {
      alert('Failed to delete project: ' + error.message);
    } else {
      if (selectedProject === confirmDeleteProjectModal.projectId) {
        setSelectedProject(null);
      }
      fetchProjects();
    }

    setDeletingProjectId(null);
    setConfirmDeleteProjectModal(null);
  };

  const downloadUsersCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
    const csvRows = [headers.join(',')];

    users.forEach((user) => {
      const row = [
        `"${user.name}"`,
        `"${user.email}"`,
        `"${user.phone_number || 'Not provided'}"`,
        user.role,
        user.is_blocked ? 'Blocked' : 'Active',
        `"${formatDate(user.created_at)}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `registered_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  const handleResetFilters = () => {
    setSelectedPreset('next-two-weeks');
    setStartDateFilter(getDefaultStartDate());
    setEndDateFilter(getDefaultEndDate());
    setShowAvailable(true);
    setShowFull(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppBanner />
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">Welcome, {profile?.name}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-white rounded-xl shadow-md p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-orange-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Projects & Time Slots
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-orange-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            User Management
          </button>
        </div>

        {activeTab === 'projects' ? (
          <>
            <DateFilterControls
              startDateFilter={startDateFilter}
              endDateFilter={endDateFilter}
              selectedPreset={selectedPreset}
              showAvailable={showAvailable}
              showFull={showFull}
              onStartDateChange={setStartDateFilter}
              onEndDateChange={setEndDateFilter}
              onPresetChange={applyPreset}
              onShowAvailableChange={setShowAvailable}
              onShowFullChange={setShowFull}
              onReset={handleResetFilters}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <ProjectsList
                  projects={projects}
                  selectedProject={selectedProject}
                  loading={loading}
                  deletingProjectId={deletingProjectId}
                  onSelectProject={setSelectedProject}
                  onCreateProject={() => setShowProjectModal(true)}
                  onDeleteProject={(projectId, projectName) =>
                    setConfirmDeleteProjectModal({ projectId, projectName })
                  }
                  formatDate={formatDate}
                />
              </div>

              <div className="lg:col-span-2 space-y-6">
                {selectedProject && selectedProjectData && (
                  <ReservationChart
                    data={reservationData}
                    projectName={selectedProjectData.name}
                  />
                )}

                <TimeSlotsList
                  timeSlots={timeSlots}
                  selectedProject={selectedProject}
                  selectedProjectName={selectedProjectData?.name}
                  deletingSlotId={deletingSlotId}
                  showAvailable={showAvailable}
                  showFull={showFull}
                  onCreateTimeSlot={() => setShowTimeSlotModal(true)}
                  onDeleteTimeSlot={(slotId, slotName) =>
                    setConfirmDeleteSlotModal({ slotId, slotName })
                  }
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              </div>
            </div>
          </>
        ) : (
          <UserManagementTable
            users={users}
            loading={loading}
            currentUserId={profile?.id}
            deletingUserId={deletingUserId}
            blockingUserId={blockingUserId}
            onCreateAdmin={() => setShowCreateAdminModal(true)}
            onDownloadCSV={downloadUsersCSV}
            onResetPassword={(userId, userName, userEmail) =>
              setResetPasswordModal({ userId, userName, userEmail })
            }
            onToggleBlock={(userId, userName, isBlocked) =>
              setConfirmBlockModal({ userId, userName, currentBlockStatus: isBlocked })
            }
            onDeleteUser={(userId, userName, userRole) =>
              setConfirmDeleteUserModal({ userId, userName, userRole })
            }
            formatDate={formatDate}
          />
        )}
      </div>

      {showProjectModal && (
        <CreateProjectModal
          onClose={() => setShowProjectModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}

      {showTimeSlotModal && selectedProject && (
        <CreateTimeSlotModal
          projectId={selectedProject}
          onClose={() => setShowTimeSlotModal(false)}
          onSuccess={handleTimeSlotCreated}
        />
      )}

      {confirmBlockModal && (
        <ConfirmModal
          title={confirmBlockModal.currentBlockStatus ? 'Unblock User' : 'Block User'}
          message={
            confirmBlockModal.currentBlockStatus
              ? `Are you sure you want to unblock ${confirmBlockModal.userName}? They will be able to log in and make reservations again.`
              : `Are you sure you want to block ${confirmBlockModal.userName}? They will not be able to log in or access the system.`
          }
          confirmText={confirmBlockModal.currentBlockStatus ? 'Unblock' : 'Block'}
          onConfirm={handleToggleBlockUser}
          onCancel={() => setConfirmBlockModal(null)}
          isDestructive={!confirmBlockModal.currentBlockStatus}
        />
      )}

      {confirmDeleteSlotModal && (
        <ConfirmModal
          title="Delete Time Slot"
          message={`Are you sure you want to delete the time slot for ${confirmDeleteSlotModal.slotName}? All associated reservations will be permanently removed.`}
          confirmText="Delete"
          onConfirm={handleDeleteTimeSlot}
          onCancel={() => setConfirmDeleteSlotModal(null)}
          isDestructive={true}
        />
      )}

      {confirmDeleteProjectModal && (
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete "${confirmDeleteProjectModal.projectName}"? This will permanently remove the project, all its time slots, and all associated reservations. This action cannot be undone.`}
          confirmText="Delete Project"
          onConfirm={handleDeleteProject}
          onCancel={() => setConfirmDeleteProjectModal(null)}
          isDestructive={true}
        />
      )}

      {showCreateAdminModal && (
        <CreateAdminModal
          onClose={() => setShowCreateAdminModal(false)}
          onSuccess={() => {
            setShowCreateAdminModal(false);
            fetchUsers();
          }}
        />
      )}

      {resetPasswordModal && (
        <ResetPasswordModal
          userId={resetPasswordModal.userId}
          userName={resetPasswordModal.userName}
          userEmail={resetPasswordModal.userEmail}
          onClose={() => setResetPasswordModal(null)}
          onSuccess={() => {
            setResetPasswordModal(null);
          }}
        />
      )}

      {confirmDeleteUserModal && (
        <ConfirmModal
          title={`Delete ${confirmDeleteUserModal.userRole === 'admin' ? 'Admin' : 'Worker'}`}
          message={
            confirmDeleteUserModal.userRole === 'admin'
              ? `Are you sure you want to delete admin user "${confirmDeleteUserModal.userName}"? This action cannot be undone.`
              : `Are you sure you want to delete worker "${confirmDeleteUserModal.userName}"? All their reservations will be permanently removed.`
          }
          confirmText="Delete"
          onConfirm={handleDeleteUser}
          onCancel={() => setConfirmDeleteUserModal(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
}
