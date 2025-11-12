import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Calendar, Clock, Users, LogOut, UserX, Trash2, Ban, CheckCircle, Download } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { CreateTimeSlotModal } from './CreateTimeSlotModal';
import { ConfirmModal } from './ConfirmModal';
import { ReservationChart } from './ReservationChart';

interface Project {
  id: string;
  name: string;
  starting_date: string;
  created_at: string;
}

interface TimeSlot {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  reservation_count: number;
  reservations?: Reservation[];
}

interface Reservation {
  id: string;
  worker_id: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  is_blocked: boolean;
  avatar_url?: string;
  phone_number?: string;
}

interface ReservationData {
  date: string;
  count: number;
}

export function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [confirmBlockModal, setConfirmBlockModal] = useState<{
    userId: string;
    userName: string;
    currentBlockStatus: boolean;
  } | null>(null);
  const [reservationData, setReservationData] = useState<ReservationData[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('all-time');
  const [showAvailable, setShowAvailable] = useState<boolean>(true);
  const [showReserved, setShowReserved] = useState<boolean>(true);

  const getDefaultStartDate = () => {
    return '';
  };

  const getDefaultEndDate = () => {
    return '';
  };

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
      case 'all-time':
      default:
        setStartDateFilter('');
        setEndDateFilter('');
        break;
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTimeSlots(selectedProject);
      fetchReservationData(selectedProject);
    }
  }, [selectedProject, startDateFilter, endDateFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('starting_date', { ascending: false });

    if (!error && data) {
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchTimeSlots = async (projectId: string) => {
    let query = supabase
      .from('time_slots')
      .select('*')
      .eq('project_id', projectId);

    if (startDateFilter) {
      query = query.gte('start_time', new Date(startDateFilter).toISOString());
    }

    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data: slots, error } = await query.order('start_time', { ascending: true });

    if (!error && slots) {
      const slotsWithDetails = await Promise.all(
        slots.map(async (slot) => {
          const { data: reservations } = await supabase
            .from('reservations')
            .select('id, worker_id, profiles(name, email)')
            .eq('time_slot_id', slot.id);

          return {
            ...slot,
            reservation_count: reservations?.length || 0,
            reservations: reservations || [],
          };
        })
      );

      setTimeSlots(slotsWithDetails);
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

  const fetchReservationData = async (projectId: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const { data: slots } = await supabase
      .from('time_slots')
      .select('id, start_time')
      .eq('project_id', projectId)
      .gte('start_time', now.toISOString())
      .lt('start_time', twoWeeksFromNow.toISOString());

    const dateCountMap = new Map<string, number>();

    for (let i = 0; i < 14; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dateCountMap.set(dateStr, 0);
    }

    if (!slots || slots.length === 0) {
      const chartData = Array.from(dateCountMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setReservationData(chartData);
      return;
    }

    const slotIds = slots.map((slot) => slot.id);

    const { data: reservations } = await supabase
      .from('reservations')
      .select('time_slot_id, created_at')
      .in('time_slot_id', slotIds);

    const slotMap = new Map(slots.map((slot) => [slot.id, slot.start_time]));

    reservations?.forEach((reservation) => {
      const slotStartTime = slotMap.get(reservation.time_slot_id);
      if (slotStartTime) {
        const slotDate = new Date(slotStartTime);
        const dateStr = slotDate.toISOString().split('T')[0];
        if (dateCountMap.has(dateStr)) {
          dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
        }
      }
    });

    const chartData = Array.from(dateCountMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setReservationData(chartData);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? All their reservations will be removed.')) {
      return;
    }

    setDeletingUserId(userId);

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      alert('Failed to delete user: ' + error.message);
    } else {
      fetchUsers();
      if (selectedProject) {
        fetchTimeSlots(selectedProject);
      }
    }

    setDeletingUserId(null);
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

  const openBlockConfirmModal = (userId: string, userName: string, currentBlockStatus: boolean) => {
    setConfirmBlockModal({ userId, userName, currentBlockStatus });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Projects & Time Slots
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            User Management
          </button>
        </div>

        {activeTab === 'projects' ? (
          <>
            {/* Date Filter Controls */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 whitespace-nowrap">Preset:</label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => {
                      if (e.target.value) {
                        applyPreset(e.target.value);
                      }
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all-time">All Time</option>
                    <option value="last-month">Last Month</option>
                    <option value="last-two-weeks">Last Two Weeks</option>
                    <option value="next-two-weeks">Next Two Weeks</option>
                    <option value="next-month">Next Month</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 whitespace-nowrap">From:</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 whitespace-nowrap">To:</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-300">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAvailable}
                      onChange={(e) => setShowAvailable(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    Show Available
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showReserved}
                      onChange={(e) => setShowReserved(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    Show Reserved
                  </label>
                </div>
                <button
                  onClick={() => {
                    setSelectedPreset('all-time');
                    setStartDateFilter(getDefaultStartDate());
                    setEndDateFilter(getDefaultEndDate());
                    setShowAvailable(true);
                    setShowReserved(true);
                  }}
                  className="ml-auto px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} />
                    Projects
                  </h2>
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedProject === project.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-medium text-slate-800">{project.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Starts: {formatDate(project.starting_date)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedProject && selectedProjectData && (
              <ReservationChart
                data={reservationData}
                projectName={selectedProjectData.name}
              />
            )}

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={20} />
                  Time Slots
                  {selectedProjectData && (
                    <span className="text-slate-600 font-normal">
                      - {selectedProjectData.name}
                    </span>
                  )}
                </h2>
                {selectedProject && (
                  <button
                    onClick={() => setShowTimeSlotModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    Add Time Slot
                  </button>
                )}
              </div>

              {!selectedProject ? (
                <div className="text-center py-12 text-slate-500">
                  Select a project to view time slots
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No time slots yet. Add one to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {timeSlots.map((slot) => {
                    const hasReservations = slot.reservation_count > 0;
                    const isAvailable = slot.reservation_count < slot.total_seats;

                    // Filter based on visibility settings
                    if (hasReservations && !showReserved) return null;
                    if (!hasReservations && !showAvailable) return null;

                    return (
                    <div
                      key={slot.id}
                      className="p-4 border-2 border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="text-slate-800 font-medium">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Users size={16} />
                              <span>
                                {slot.reservation_count} / {slot.total_seats} seats
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            {formatDate(slot.start_time)}
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            slot.reservation_count >= slot.total_seats
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {slot.reservation_count >= slot.total_seats ? 'Full' : 'Available'}
                        </div>
                      </div>

                      {slot.reservations && slot.reservations.length > 0 && (
                        <div className="border-t border-slate-200 pt-3 mt-3">
                          <div className="text-xs font-medium text-slate-700 mb-2">Reserved by:</div>
                          <div className="space-y-1">
                            {slot.reservations.map((reservation) => (
                              <div
                                key={reservation.id}
                                className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded"
                              >
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {reservation.profiles.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{reservation.profiles.name}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-xs">{reservation.profiles.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Users size={20} />
                Registered Users
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">
                  {users.length} total users
                </div>
                {users.length > 0 && (
                  <button
                    onClick={downloadUsersCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download size={18} />
                    Download CSV
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No users registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
                              style={{ display: user.avatar_url ? 'none' : 'flex' }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{user.email}</td>
                        <td className="py-4 px-4 text-slate-600">
                          {user.phone_number || <span className="text-slate-400 italic">Not provided</span>}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              user.is_blocked
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {user.is_blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {user.id !== profile?.id && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openBlockConfirmModal(user.id, user.name, user.is_blocked)}
                                disabled={blockingUserId === user.id}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  user.is_blocked
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-orange-600 hover:bg-orange-50'
                                }`}
                              >
                                {blockingUserId === user.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Processing...</span>
                                  </>
                                ) : user.is_blocked ? (
                                  <>
                                    <CheckCircle size={16} />
                                    <span className="text-sm">Unblock</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban size={16} />
                                    <span className="text-sm">Block</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deletingUserId === user.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingUserId === user.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 size={16} />
                                    <span className="text-sm">Delete</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
    </div>
  );
}
