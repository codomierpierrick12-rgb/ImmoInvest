-- Create custom types
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'commercial', 'parking', 'land', 'office', 'retail', 'warehouse');
CREATE TYPE property_status AS ENUM ('active', 'sold', 'under_renovation', 'vacant', 'rented');

-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'FR',
  acquisition_price DECIMAL(15,2) NOT NULL,
  acquisition_date DATE NOT NULL,
  acquisition_costs JSONB NOT NULL DEFAULT '{}',
  current_value DECIMAL(15,2) NOT NULL,
  valuation_date DATE,
  property_type property_type NOT NULL,
  surface_area DECIMAL(10,2),
  rental_yield_target DECIMAL(5,2),
  status property_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT properties_address_length_check CHECK (char_length(address) BETWEEN 1 AND 500),
  CONSTRAINT properties_city_length_check CHECK (char_length(city) BETWEEN 1 AND 100),
  CONSTRAINT properties_country_length_check CHECK (char_length(country) BETWEEN 2 AND 3),
  CONSTRAINT properties_acquisition_price_check CHECK (acquisition_price > 0),
  CONSTRAINT properties_current_value_check CHECK (current_value > 0),
  CONSTRAINT properties_surface_area_check CHECK (surface_area IS NULL OR surface_area > 0),
  CONSTRAINT properties_rental_yield_check CHECK (rental_yield_target IS NULL OR (rental_yield_target >= 0 AND rental_yield_target <= 50)),
  CONSTRAINT properties_acquisition_date_check CHECK (acquisition_date <= CURRENT_DATE),
  CONSTRAINT properties_valuation_date_check CHECK (valuation_date IS NULL OR valuation_date >= acquisition_date),
  CONSTRAINT properties_acquisition_costs_check CHECK (jsonb_typeof(acquisition_costs) = 'object')
);

-- Create trigger for properties table
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_properties_legal_entity_id ON properties (legal_entity_id);
CREATE INDEX idx_properties_city ON properties (city);
CREATE INDEX idx_properties_country ON properties (country);
CREATE INDEX idx_properties_property_type ON properties (property_type);
CREATE INDEX idx_properties_status ON properties (status);
CREATE INDEX idx_properties_acquisition_date ON properties (acquisition_date);
CREATE INDEX idx_properties_current_value ON properties (current_value);

-- Create GIN index for JSONB acquisition_costs
CREATE INDEX idx_properties_acquisition_costs ON properties USING GIN (acquisition_costs);

-- Create composite indexes for common queries
CREATE INDEX idx_properties_status_type ON properties (status, property_type);
CREATE INDEX idx_properties_city_status ON properties (city, status);

-- Insert comments for documentation
COMMENT ON TABLE properties IS 'Individual real estate assets with acquisition and operational details';
COMMENT ON COLUMN properties.id IS 'Unique identifier for the property';
COMMENT ON COLUMN properties.legal_entity_id IS 'Reference to the legal entity that owns this property';
COMMENT ON COLUMN properties.address IS 'Full street address of the property';
COMMENT ON COLUMN properties.city IS 'City where the property is located';
COMMENT ON COLUMN properties.postal_code IS 'Postal/ZIP code of the property';
COMMENT ON COLUMN properties.country IS 'Country code (ISO 3166-1 alpha-2/3)';
COMMENT ON COLUMN properties.acquisition_price IS 'Purchase price of the property in base currency';
COMMENT ON COLUMN properties.acquisition_date IS 'Date when the property was acquired';
COMMENT ON COLUMN properties.acquisition_costs IS 'Breakdown of acquisition-related costs (notary, agency, works, etc.)';
COMMENT ON COLUMN properties.current_value IS 'Current market value of the property';
COMMENT ON COLUMN properties.valuation_date IS 'Date of the current valuation';
COMMENT ON COLUMN properties.property_type IS 'Type/category of the property';
COMMENT ON COLUMN properties.surface_area IS 'Property surface area in square meters';
COMMENT ON COLUMN properties.rental_yield_target IS 'Target rental yield percentage';
COMMENT ON COLUMN properties.status IS 'Current status of the property';
COMMENT ON COLUMN properties.created_at IS 'Timestamp when the property record was created';
COMMENT ON COLUMN properties.updated_at IS 'Timestamp when the property record was last updated';

-- Sample acquisition_costs JSON structure (for documentation)
-- acquisition_costs JSON structure:
-- {
--   "notary_fees": 35000.00,
--   "agency_fees": 20000.00,
--   "renovation_costs": 15000.00,
--   "furniture_costs": 5000.00,
--   "loan_setup_fees": 2500.00,
--   "inspection_fees": 500.00,
--   "insurance_setup": 800.00,
--   "other_costs": 1200.00,
--   "total_acquisition_costs": 80000.00
-- }