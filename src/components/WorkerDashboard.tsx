import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, LogOut, CheckCircle, XCircle, UserCircle } from 'lucide-react';
import { ProfileEditModal } from './ProfileEditModal';

interface Project {
  id: string;
  name: string;
  starting_date: string;
  created_at: string;
}

interface TimeSlotWithDetails {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  reservation_count: number;
  user_reserved: boolean;
  user_reservation_id: string | null;
}

export function WorkerDashboard() {
  const { signOut, profile, user, refreshProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTimeSlots(selectedProject);
    }
  }, [selectedProject, user?.id, startDateFilter, endDateFilter]);

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
          const { data: reservations, count } = await supabase
            .from('reservations')
            .select('*', { count: 'exact' })
            .eq('time_slot_id', slot.id);

          const userReservation = reservations?.find((r) => r.worker_id === user?.id);

          return {
            ...slot,
            reservation_count: count || 0,
            user_reserved: !!userReservation,
            user_reservation_id: userReservation?.id || null,
          };
        })
      );

      setTimeSlots(slotsWithDetails);
    }
  };

  const handleReservation = async (slotId: string) => {
    setActionLoading(slotId);

    try {
      const { error } = await supabase.from('reservations').insert({
        time_slot_id: slotId,
        worker_id: user!.id,
      });

      if (error) throw error;

      if (selectedProject) {
        await fetchTimeSlots(selectedProject);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create reservation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    setActionLoading(reservationId);

    try {
      const { error } = await supabase.from('reservations').delete().eq('id', reservationId);

      if (error) throw error;

      if (selectedProject) {
        await fetchTimeSlots(selectedProject);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel reservation');
    } finally {
      setActionLoading(null);
    }
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
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Project Reservations</h1>
                <p className="text-sm text-slate-600">Welcome, {profile?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <UserCircle size={18} />
                )}
                <span>My Profile</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Calendar size={20} />
                Projects
              </h2>

              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No projects available yet.</div>
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

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={20} />
                  Available Time Slots
                  {selectedProjectData && (
                    <span className="text-slate-600 font-normal">- {selectedProjectData.name}</span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
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
                  {(startDateFilter || endDateFilter) && (
                    <button
                      onClick={() => {
                        setStartDateFilter('');
                        setEndDateFilter('');
                      }}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {!selectedProject ? (
                <div className="text-center py-12 text-slate-500">
                  Select a project to view time slots
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No time slots available for this project yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {timeSlots.map((slot) => {
                    const isAvailable = slot.reservation_count < slot.total_seats;
                    const isFull = slot.reservation_count >= slot.total_seats;

                    return (
                      <div
                        key={slot.id}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          slot.user_reserved
                            ? 'border-green-300 bg-green-50'
                            : isFull
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
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
                          <div className="flex items-center gap-2">
                            {slot.user_reserved ? (
                              <>
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                  <CheckCircle size={14} />
                                  Reserved
                                </div>
                                <button
                                  onClick={() =>
                                    slot.user_reservation_id &&
                                    handleCancelReservation(slot.user_reservation_id)
                                  }
                                  disabled={actionLoading === slot.user_reservation_id}
                                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === slot.user_reservation_id
                                    ? 'Canceling...'
                                    : 'Cancel'}
                                </button>
                              </>
                            ) : isFull ? (
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                                <XCircle size={14} />
                                Full
                              </div>
                            ) : (
                              <>
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  Available
                                </div>
                                <button
                                  onClick={() => handleReservation(slot.id)}
                                  disabled={!isAvailable || actionLoading === slot.id}
                                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === slot.id ? 'Reserving...' : 'Reserve'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentPhoneNumber={profile?.phone_number || ''}
        currentAvatarUrl={profile?.avatar_url || ''}
        onUpdate={refreshProfile}
      />
    </div>
  );
}
