-- Create custom types
CREATE TYPE user_role AS ENUM ('individual', 'professional', 'admin');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'individual',
  profile JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT users_email_format_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_profile_check CHECK (jsonb_typeof(profile) = 'object')
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_created_at ON users (created_at);

-- Insert comments for documentation
COMMENT ON TABLE users IS 'Primary actors in the system with authentication and profile management';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User email address, must be unique and valid format';
COMMENT ON COLUMN users.role IS 'User role determining feature access levels';
COMMENT ON COLUMN users.profile IS 'User profile information including name, preferences, and settings';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user account was last updated';

-- Sample profile structure (for documentation)
-- profile JSON structure:
-- {
--   "name": "John Doe",
--   "preferences": {
--     "currency": "EUR",
--     "language": "fr",
--     "timezone": "Europe/Paris",
--     "notifications": {
--       "email": true,
--       "push": false
--     }
--   },
--   "tax_settings": {
--     "jurisdiction": "France",
--     "tax_year": "calendar",
--     "default_entity_type": "personal"
--   }
-- }