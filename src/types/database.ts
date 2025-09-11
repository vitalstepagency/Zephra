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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'paused' | 'completed'
          type: 'email' | 'sms' | 'social' | 'ads' | 'funnel'
          settings: Json
          metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          type: 'email' | 'sms' | 'social' | 'ads' | 'funnel'
          settings?: Json
          metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          type?: 'email' | 'sms' | 'social' | 'ads' | 'funnel'
          settings?: Json
          metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      funnels: {
        Row: {
          id: string
          user_id: string
          campaign_id: string | null
          name: string
          description: string | null
          steps: Json
          conversion_rates: Json
          total_visitors: number
          total_conversions: number
          revenue: number
          status: 'draft' | 'active' | 'paused'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id?: string | null
          name: string
          description?: string | null
          steps?: Json
          conversion_rates?: Json
          total_visitors?: number
          total_conversions?: number
          revenue?: number
          status?: 'draft' | 'active' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string | null
          name?: string
          description?: string | null
          steps?: Json
          conversion_rates?: Json
          total_visitors?: number
          total_conversions?: number
          revenue?: number
          status?: 'draft' | 'active' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Json
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
      campaign_status: 'draft' | 'active' | 'paused' | 'completed'
      campaign_type: 'email' | 'sms' | 'social' | 'ads' | 'funnel'
      funnel_status: 'draft' | 'active' | 'paused'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Funnel = Database['public']['Tables']['funnels']['Row']
export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']

export type UserInsert = Database['public']['Tables']['users']['Insert']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type FunnelInsert = Database['public']['Tables']['funnels']['Insert']
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert']

export type UserUpdate = Database['public']['Tables']['users']['Update']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']
export type FunnelUpdate = Database['public']['Tables']['funnels']['Update']
export type AnalyticsEventUpdate = Database['public']['Tables']['analytics_events']['Update']