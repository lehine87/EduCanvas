// src/types/database.ts 임시
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: import('@/types/student').Student;
        Insert: Omit<import('@/types/student').Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<import('@/types/student').Student, 'id'>>;
      };
      classes: {
        Row: import('@/types/class').Class;
        Insert: Omit<import('@/types/class').Class, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<import('@/types/class').Class, 'id'>>;
      };
      users: {
        Row: import('@/types/auth').User;
        Insert: Omit<import('@/types/auth').User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<import('@/types/auth').User, 'id'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      status: 'active' | 'inactive' | 'waiting' | 'graduated';
    };
  };
}
