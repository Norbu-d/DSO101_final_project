import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          current_balance: number
          is_premium: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          current_balance?: number
          is_premium?: boolean
        }
        Update: {
          name?: string
          current_balance?: number
          is_premium?: boolean
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category_id: string
          note: string | null
          date: string
          created_at: string
        }
        Insert: {
          user_id: string
          amount: number
          category_id: string
          note?: string | null
          date: string
        }
        Update: {
          amount?: number
          category_id?: string
          note?: string | null
          date?: string
        }
      }
      income_entries: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: string
          note: string | null
          date: string
          created_at: string
        }
        Insert: {
          user_id: string
          amount: number
          source: string
          note?: string | null
          date: string
        }
        Update: {
          amount?: number
          source?: string
          note?: string | null
          date?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          is_default: boolean
          user_id: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount_limit: number
          period: 'monthly' | 'weekly'
          created_at: string
        }
        Insert: {
          user_id: string
          category_id: string
          amount_limit: number
          period: 'monthly' | 'weekly'
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          budget_id: string
          threshold_pct: number
          triggered_at: string
          is_read: boolean
        }
      }
    }
  }
}
