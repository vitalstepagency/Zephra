-- Error logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'VALIDATION',
    'AUTHENTICATION', 
    'AUTHORIZATION',
    'DATABASE',
    'EXTERNAL_API',
    'RATE_LIMIT',
    'SECURITY',
    'SYSTEM',
    'BUSINESS_LOGIC'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  stack TEXT,
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  url TEXT,
  method VARCHAR(10),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_request_id ON error_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_ip_address ON error_logs(ip_address);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_type_severity ON error_logs(type, severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(resolved, timestamp DESC) WHERE resolved = FALSE;

-- RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admin can view error logs" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Only system can insert error logs (via service role)
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT
  WITH CHECK (true); -- This will be restricted by service role usage

-- Only admins can update error logs (for resolution)
CREATE POLICY "Admin can update error logs" ON error_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_error_logs_updated_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_error_logs_updated_at();

-- Function to automatically set resolved_at when resolved is set to true
CREATE OR REPLACE FUNCTION set_error_log_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved = TRUE AND OLD.resolved = FALSE THEN
    NEW.resolved_at = NOW();
    IF NEW.resolved_by IS NULL THEN
      NEW.resolved_by = auth.uid();
    END IF;
  ELSIF NEW.resolved = FALSE THEN
    NEW.resolved_at = NULL;
    NEW.resolved_by = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for resolved_at
CREATE TRIGGER trigger_set_error_log_resolved_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_error_log_resolved_at();

-- Function to clean up old resolved error logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs 
  WHERE resolved = TRUE 
    AND resolved_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON error_logs TO authenticated;
GRANT USAGE ON SEQUENCE error_logs_id_seq TO authenticated;

-- Comments for documentation
COMMENT ON TABLE error_logs IS 'Comprehensive error logging for application monitoring and debugging';
COMMENT ON COLUMN error_logs.type IS 'Categorization of error type for filtering and analysis';
COMMENT ON COLUMN error_logs.severity IS 'Error severity level for prioritization';
COMMENT ON COLUMN error_logs.context IS 'Additional context data in JSON format';
COMMENT ON COLUMN error_logs.stack IS 'Error stack trace (sanitized)';
COMMENT ON COLUMN error_logs.request_id IS 'Unique request identifier for tracing';
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Maintenance function to clean up old resolved error logs';