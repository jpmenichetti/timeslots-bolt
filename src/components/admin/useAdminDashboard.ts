import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
    avatar_url?: string;
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

export function useAdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationData, setReservationData] = useState<ReservationData[]>([]);

  const getDefaultStartDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return end.toISOString().split('T')[0];
  };

  const [startDateFilter, setStartDateFilter] = useState<string>(getDefaultStartDate());
  const [endDateFilter, setEndDateFilter] = useState<string>(getDefaultEndDate());

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
            .select('id, worker_id, profiles(name, email, avatar_url)')
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

  const fetchReservationData = async (projectId: string) => {
    const startDate = new Date(startDateFilter || getDefaultStartDate());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateFilter || getDefaultEndDate());
    endDate.setHours(23, 59, 59, 999);

    let query = supabase
      .from('time_slots')
      .select('id, start_time')
      .eq('project_id', projectId);

    if (startDateFilter) {
      query = query.gte('start_time', startDate.toISOString());
    }

    if (endDateFilter) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data: slots } = await query;

    const dateCountMap = new Map<string, number>();

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
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
        const dateStr = slotStartTime.split('T')[0];
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

  return {
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
  };
}
