-- Attendance Performance Optimization Indexes
-- Migration: 20250830131412_attendance_performance_indexes.sql
-- Purpose: Create optimized indexes for attendance realtime widget queries

-- ================================================================
-- 1. Core Attendance Query Performance Indexes
-- ================================================================

-- Primary composite index for real-time attendance queries
-- Covers: tenant_id + attendance_date + status lookups
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_date_status 
ON attendances(tenant_id, attendance_date, status) 
WHERE attendance_date IS NOT NULL;

-- Index for class-based attendance queries
-- Covers: class_id + attendance_date + status for class attendance breakdown
CREATE INDEX IF NOT EXISTS idx_attendances_class_date_status 
ON attendances(class_id, attendance_date, status) 
WHERE class_id IS NOT NULL AND attendance_date IS NOT NULL;

-- Index for student-based attendance queries
-- Covers: student_id + attendance_date + tenant_id for individual student tracking
CREATE INDEX IF NOT EXISTS idx_attendances_student_tenant_date 
ON attendances(student_id, tenant_id, attendance_date) 
WHERE student_id IS NOT NULL AND attendance_date IS NOT NULL;

-- Index for time-based trend analysis
-- Covers: tenant_id + attendance_date (range queries) + check_in_time for hourly trends
CREATE INDEX IF NOT EXISTS idx_attendances_trends 
ON attendances(tenant_id, attendance_date, check_in_time) 
WHERE attendance_date IS NOT NULL;

-- ================================================================
-- 2. Classes Performance Indexes
-- ================================================================

-- Index for today's classes lookup
-- Covers: tenant_id + scheduled_at (date range queries) + status
CREATE INDEX IF NOT EXISTS idx_classes_tenant_scheduled_status 
ON classes(tenant_id, scheduled_at, status) 
WHERE scheduled_at IS NOT NULL;

-- Index for class membership joins
-- Covers: class_id for efficient joins with class_memberships
CREATE INDEX IF NOT EXISTS idx_classes_membership_join 
ON classes(id, tenant_id, status) 
WHERE status IS NOT NULL;

-- ================================================================
-- 3. Class Memberships Performance Indexes
-- ================================================================

-- Index for class-student relationship queries
-- Covers: class_id + student_id for attendance calculation
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_student 
ON class_memberships(class_id, student_id) 
WHERE class_id IS NOT NULL AND student_id IS NOT NULL;

-- Index for student enrollment lookup
-- Covers: student_id for finding all classes a student is enrolled in
CREATE INDEX IF NOT EXISTS idx_class_memberships_student_class 
ON class_memberships(student_id, class_id) 
WHERE student_id IS NOT NULL;

-- ================================================================
-- 4. Students Performance Indexes
-- ================================================================

-- Enhanced index for active students queries
-- Covers: tenant_id + status + id for efficient active student counting
CREATE INDEX IF NOT EXISTS idx_students_tenant_status_id 
ON students(tenant_id, status, id) 
WHERE status IS NOT NULL;

-- Index for student joins with attendance
-- Covers: id + status for JOIN optimization
CREATE INDEX IF NOT EXISTS idx_students_join_optimization 
ON students(id, status, tenant_id) 
WHERE status = 'active';

-- ================================================================
-- 5. Composite Indexes for Complex Queries
-- ================================================================

-- Multi-table join optimization for real-time queries
-- Covers the most common query pattern: attendance + class + student
CREATE INDEX IF NOT EXISTS idx_attendances_full_context 
ON attendances(tenant_id, attendance_date, class_id, student_id, status) 
WHERE attendance_date IS NOT NULL AND class_id IS NOT NULL AND student_id IS NOT NULL;

-- Partial index for ongoing/recent classes
-- Covers: tenant_id + scheduled_at for classes within the last 24 hours
CREATE INDEX IF NOT EXISTS idx_classes_recent 
ON classes(tenant_id, scheduled_at, id, name, status) 
WHERE scheduled_at >= (CURRENT_DATE - INTERVAL '1 day');

-- ================================================================
-- 6. Performance Monitoring Views
-- ================================================================

-- Create a view for attendance statistics (frequently accessed)
CREATE OR REPLACE VIEW v_attendance_daily_stats AS
SELECT 
    tenant_id,
    attendance_date,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
    ROUND(
        (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::decimal / 
         NULLIF(COUNT(*), 0)) * 100, 
        1
    ) as attendance_rate
FROM attendances 
WHERE attendance_date IS NOT NULL
GROUP BY tenant_id, attendance_date;

-- Create an index on the view's underlying query pattern
CREATE INDEX IF NOT EXISTS idx_attendance_stats_materialized 
ON attendances(tenant_id, attendance_date) 
WHERE attendance_date IS NOT NULL;

-- ================================================================
-- 7. Query Optimization Comments
-- ================================================================

-- Add comments to explain the optimization strategy
COMMENT ON INDEX idx_attendances_tenant_date_status IS 
'Primary index for real-time attendance widget queries. Optimizes tenant + date + status filtering.';

COMMENT ON INDEX idx_attendances_full_context IS 
'Composite index covering the complete attendance context for multi-table joins.';

COMMENT ON INDEX idx_classes_recent IS 
'Partial index for recent classes, optimized for dashboard real-time queries.';

COMMENT ON VIEW v_attendance_daily_stats IS 
'Pre-aggregated daily attendance statistics for performance optimization.';

-- ================================================================
-- 8. Statistics Update
-- ================================================================

-- Update table statistics for better query planning
ANALYZE attendances;
ANALYZE classes;
ANALYZE class_memberships;
ANALYZE students;

-- ================================================================
-- 9. Performance Validation Query
-- ================================================================

-- This query should benefit from the new indexes
-- Can be used for testing index effectiveness
/*
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    a.status,
    c.id as class_id,
    c.name as class_name,
    c.scheduled_at,
    COUNT(*) as total_students,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count
FROM attendances a
JOIN classes c ON c.id = a.class_id
JOIN students s ON s.id = a.student_id
WHERE a.tenant_id = $1
  AND a.attendance_date = CURRENT_DATE
  AND s.status = 'active'
GROUP BY a.status, c.id, c.name, c.scheduled_at
ORDER BY c.scheduled_at;
*/