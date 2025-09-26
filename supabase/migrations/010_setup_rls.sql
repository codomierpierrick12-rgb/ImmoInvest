-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admin users can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- PORTFOLIOS TABLE POLICIES
-- ========================================

-- Users can view their own portfolios
CREATE POLICY "Users can view own portfolios"
  ON portfolios FOR SELECT
  USING (user_id = auth.uid());

-- Users can view shared portfolios
CREATE POLICY "Users can view shared portfolios"
  ON portfolios FOR SELECT
  USING (
    sharing_settings->>'is_shared' = 'true' AND
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(sharing_settings->'shared_users') AS shared_user
      WHERE shared_user->>'user_id' = auth.uid()::text
    )
  );

-- Users can manage their own portfolios
CREATE POLICY "Users can manage own portfolios"
  ON portfolios FOR ALL
  USING (user_id = auth.uid());

-- Users can update shared portfolios if they have edit permission
CREATE POLICY "Users can edit shared portfolios with permission"
  ON portfolios FOR UPDATE
  USING (
    sharing_settings->>'is_shared' = 'true' AND
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(sharing_settings->'shared_users') AS shared_user
      WHERE shared_user->>'user_id' = auth.uid()::text
        AND shared_user->>'permission' = 'edit'
    )
  );

-- ========================================
-- LEGAL ENTITIES TABLE POLICIES
-- ========================================

-- Users can view legal entities in their portfolios
CREATE POLICY "Users can view legal entities in own portfolios"
  ON legal_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Users can view legal entities in shared portfolios
CREATE POLICY "Users can view legal entities in shared portfolios"
  ON legal_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage legal entities in their own portfolios
CREATE POLICY "Users can manage legal entities in own portfolios"
  ON legal_entities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Users can edit legal entities in shared portfolios with permission
CREATE POLICY "Users can edit legal entities in shared portfolios"
  ON legal_entities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
            AND shared_user->>'permission' = 'edit'
        )
    )
  );

-- ========================================
-- PROPERTIES TABLE POLICIES
-- ========================================

-- Users can view properties in their legal entities
CREATE POLICY "Users can view properties in own legal entities"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM legal_entities le
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE le.id = legal_entity_id AND p.user_id = auth.uid()
    )
  );

-- Users can view properties in shared portfolios
CREATE POLICY "Users can view properties in shared portfolios"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM legal_entities le
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE le.id = legal_entity_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage properties in their own legal entities
CREATE POLICY "Users can manage properties in own legal entities"
  ON properties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM legal_entities le
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE le.id = legal_entity_id AND p.user_id = auth.uid()
    )
  );

-- ========================================
-- LOANS TABLE POLICIES
-- ========================================

-- Users can view loans for their properties
CREATE POLICY "Users can view loans for own properties"
  ON loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id AND p.user_id = auth.uid()
    )
  );

-- Users can view loans in shared portfolios
CREATE POLICY "Users can view loans in shared portfolios"
  ON loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage loans for their properties
CREATE POLICY "Users can manage loans for own properties"
  ON loans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id AND p.user_id = auth.uid()
    )
  );

-- ========================================
-- TRANSACTIONS TABLE POLICIES
-- ========================================

-- Users can view transactions for their properties
CREATE POLICY "Users can view transactions for own properties"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id AND p.user_id = auth.uid()
    )
  );

-- Users can view transactions in shared portfolios
CREATE POLICY "Users can view transactions in shared portfolios"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage transactions for their properties
CREATE POLICY "Users can manage transactions for own properties"
  ON transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id AND p.user_id = auth.uid()
    )
  );

-- ========================================
-- SCENARIOS TABLE POLICIES
-- ========================================

-- Users can view scenarios in their portfolios
CREATE POLICY "Users can view scenarios in own portfolios"
  ON scenarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- Users can view scenarios in shared portfolios
CREATE POLICY "Users can view scenarios in shared portfolios"
  ON scenarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage scenarios in their portfolios
CREATE POLICY "Users can manage scenarios in own portfolios"
  ON scenarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
  );

-- ========================================
-- SCENARIO EVENTS TABLE POLICIES
-- ========================================

-- Users can view scenario events in their scenarios
CREATE POLICY "Users can view scenario events in own scenarios"
  ON scenario_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN portfolios p ON p.id = s.portfolio_id
      WHERE s.id = scenario_id AND p.user_id = auth.uid()
    )
  );

-- Users can view scenario events in shared portfolios
CREATE POLICY "Users can view scenario events in shared portfolios"
  ON scenario_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN portfolios p ON p.id = s.portfolio_id
      WHERE s.id = scenario_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage scenario events in their scenarios
CREATE POLICY "Users can manage scenario events in own scenarios"
  ON scenario_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN portfolios p ON p.id = s.portfolio_id
      WHERE s.id = scenario_id AND p.user_id = auth.uid()
    )
  );

-- ========================================
-- BUDGETS TABLE POLICIES
-- ========================================

-- Users can view budgets for their properties
CREATE POLICY "Users can view budgets for own properties"
  ON budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id AND p.user_id = auth.uid()
    )
  );

-- Users can view budgets in shared portfolios
CREATE POLICY "Users can view budgets in shared portfolios"
  ON budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    )
  );

-- Users can manage budgets for their properties
CREATE POLICY "Users can manage budgets for own properties"
  ON budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties pr
      JOIN legal_entities le ON le.id = pr.legal_entity_id
      JOIN portfolios p ON p.id = le.portfolio_id
      WHERE pr.id = property_id AND p.user_id = auth.uid()
    )
  );

-- ========================================
-- HELPER FUNCTIONS FOR RLS
-- ========================================

-- Function to check if user has access to portfolio
CREATE OR REPLACE FUNCTION user_has_portfolio_access(portfolio_uuid UUID, required_permission TEXT DEFAULT 'read')
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user owns the portfolio
  IF EXISTS (
    SELECT 1 FROM portfolios
    WHERE id = portfolio_uuid AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if portfolio is shared with user
  IF required_permission = 'read' THEN
    RETURN EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_uuid
        AND p.sharing_settings->>'is_shared' = 'true'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
          WHERE shared_user->>'user_id' = auth.uid()::text
        )
    );
  END IF;

  -- Check for specific permission (comment, edit)
  RETURN EXISTS (
    SELECT 1 FROM portfolios p
    WHERE p.id = portfolio_uuid
      AND p.sharing_settings->>'is_shared' = 'true'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
        WHERE shared_user->>'user_id' = auth.uid()::text
          AND shared_user->>'permission' = required_permission
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get accessible portfolio IDs for current user
CREATE OR REPLACE FUNCTION get_accessible_portfolio_ids()
RETURNS UUID[] AS $$
DECLARE
  portfolio_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT p.id) INTO portfolio_ids
  FROM portfolios p
  WHERE p.user_id = auth.uid()
    OR (
      p.sharing_settings->>'is_shared' = 'true'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p.sharing_settings->'shared_users') AS shared_user
        WHERE shared_user->>'user_id' = auth.uid()::text
      )
    );

  RETURN COALESCE(portfolio_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SECURITY NOTES
-- ========================================

-- Comments for security documentation
COMMENT ON POLICY "Users can view own profile" ON users IS 'Users can only access their own user record';
COMMENT ON POLICY "Users can view own portfolios" ON portfolios IS 'Users can view portfolios they own';
COMMENT ON POLICY "Users can view shared portfolios" ON portfolios IS 'Users can view portfolios shared with them';
COMMENT ON FUNCTION user_has_portfolio_access IS 'Helper function to check user access to portfolios with permission levels';
COMMENT ON FUNCTION get_accessible_portfolio_ids IS 'Returns array of portfolio IDs accessible to current user';

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION user_has_portfolio_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_portfolio_ids TO authenticated;