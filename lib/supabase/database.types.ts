export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          date_of_birth: string | null;
          gender: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          waist_cm: number | null;
          neck_cm: number | null;
          activity_level: string | null;
          goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          waist_cm?: number | null;
          neck_cm?: number | null;
          activity_level?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          waist_cm?: number | null;
          neck_cm?: number | null;
          activity_level?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      health_snapshots: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          overall_score: number;
          bmi_score: number;
          whtr_score: number;
          body_fat_score: number;
          activity_score: number;
          primary_focus: string;
          coach_recommendation_id: string;
          weight_kg: number;
          waist_cm: number;
          neck_cm: number;
          engine_version: string;
          snapshot_reason: string;
          body_fat_pct: number | null;
          coach_duration_minutes: number | null;
          coach_frequency_per_week: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          overall_score: number;
          bmi_score: number;
          whtr_score: number;
          body_fat_score: number;
          activity_score: number;
          primary_focus: string;
          coach_recommendation_id: string;
          weight_kg: number;
          waist_cm: number;
          neck_cm: number;
          engine_version: string;
          snapshot_reason: string;
          body_fat_pct?: number | null;
          coach_duration_minutes?: number | null;
          coach_frequency_per_week?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          overall_score?: number;
          bmi_score?: number;
          whtr_score?: number;
          body_fat_score?: number;
          activity_score?: number;
          primary_focus?: string;
          coach_recommendation_id?: string;
          weight_kg?: number;
          waist_cm?: number;
          neck_cm?: number;
          engine_version?: string;
          snapshot_reason?: string;
          body_fat_pct?: number | null;
          coach_duration_minutes?: number | null;
          coach_frequency_per_week?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'health_snapshots_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      measurements: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          weight_kg: number;
          waist_cm: number;
          neck_cm: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          measured_at: string;
          weight_kg: number;
          waist_cm: number;
          neck_cm: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          measured_at?: string;
          weight_kg?: number;
          waist_cm?: number;
          neck_cm?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'measurements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      weekly_check_ins: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          sleep_quality: number;
          energy: number;
          stress: number;
          training_frequency: string;
          everyday_activity: number;
          eating_quality: number;
          alcohol_consumption: string;
          plan_adherence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          sleep_quality: number;
          energy: number;
          stress: number;
          training_frequency: string;
          everyday_activity: number;
          eating_quality: number;
          alcohol_consumption: string;
          plan_adherence: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          sleep_quality?: number;
          energy?: number;
          stress?: number;
          training_frequency?: string;
          everyday_activity?: number;
          eating_quality?: number;
          alcohol_consumption?: string;
          plan_adherence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'weekly_check_ins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      initial_lifestyle_checks: {
        Row: {
          id: string;
          user_id: string;
          sleep_quality: number;
          energy: number;
          stress: number;
          less_healthy_food_frequency: string | null;
          everyday_activity: number;
          eating_quality: number;
          alcohol_consumption: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sleep_quality: number;
          energy: number;
          stress: number;
          less_healthy_food_frequency: string | null;
          everyday_activity: number;
          eating_quality: number;
          alcohol_consumption: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sleep_quality?: number;
          energy?: number;
          stress?: number;
          less_healthy_food_frequency?: string | null;
          everyday_activity?: number;
          eating_quality?: number;
          alcohol_consumption?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'initial_lifestyle_checks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
