export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'worker'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'worker'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'worker'
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          starting_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          starting_date: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          starting_date?: string
          created_by?: string | null
          created_at?: string
        }
      }
      time_slots: {
        Row: {
          id: string
          project_id: string
          start_time: string
          end_time: string
          total_seats: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          start_time: string
          end_time: string
          total_seats: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          start_time?: string
          end_time?: string
          total_seats?: number
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          time_slot_id: string
          worker_id: string
          created_at: string
        }
        Insert: {
          id?: string
          time_slot_id: string
          worker_id: string
          created_at?: string
        }
        Update: {
          id?: string
          time_slot_id?: string
          worker_id?: string
          created_at?: string
        }
      }
    }
  }
}
