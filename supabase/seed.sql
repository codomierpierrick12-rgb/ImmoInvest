-- Seed data for Stoneverse immo-invest-app
-- This file contains sample data for testing and demonstration

-- Note: Replace 'demo-user-id' with actual user ID from auth.users after authentication setup

-- Sample portfolios
INSERT INTO public.portfolios (id, user_id, name, description, base_currency) VALUES
  ('portfolio-demo', 'demo-user-id', 'Portfolio Principal', 'Portfolio de démonstration Stoneverse', 'EUR'),
  ('portfolio-demo-1', 'demo-user-id', 'Portfolio Secondaire', 'Portfolio pour investissements locatifs', 'EUR');

-- Sample legal entities
INSERT INTO public.legal_entities (id, portfolio_id, name, type, incorporation_date) VALUES
  ('entity-lmnp', 'portfolio-demo', 'LMNP Personnel', 'lmnp', '2023-01-15'),
  ('entity-sci', 'portfolio-demo', 'SCI Immobilier', 'sci_ir', '2022-06-10'),
  ('entity-1', 'portfolio-demo-1', 'LMNP Invest', 'lmnp', '2023-03-20'),
  ('entity-2', 'portfolio-demo-1', 'SCI Holdings', 'sci_is', '2022-11-05'),
  ('entity-3', 'portfolio-demo-1', 'SARL Immo', 'sarl', '2023-05-12');

-- Sample properties
INSERT INTO public.properties (id, portfolio_id, legal_entity_id, address, city, postal_code, property_type, surface_area, number_of_rooms, acquisition_date, acquisition_price, current_value, rental_type) VALUES
  ('prop-1', 'portfolio-demo', 'entity-lmnp', '12 Rue de la Paix', 'Paris', '75001', 'apartment', 45.5, 2, '2023-02-15', 320000, 340000, 'furnished'),
  ('prop-2', 'portfolio-demo', 'entity-sci', '8 Avenue des Champs', 'Lyon', '69001', 'apartment', 65.0, 3, '2022-08-20', 280000, 295000, 'unfurnished'),
  ('prop-3', 'portfolio-demo-1', 'entity-1', '25 Boulevard Haussman', 'Marseille', '13001', 'house', 120.0, 5, '2023-04-10', 450000, 465000, 'furnished'),
  ('prop-4', 'portfolio-demo-1', 'entity-2', '15 Rue Voltaire', 'Nice', '06000', 'commercial', 80.0, null, '2022-12-01', 380000, 390000, null),
  ('prop-5', 'portfolio-demo-1', 'entity-3', '5 Place de la République', 'Toulouse', '31000', 'apartment', 55.0, 3, '2023-06-15', 220000, 235000, 'unfurnished');

-- Sample loans
INSERT INTO public.loans (id, property_id, bank_name, initial_amount, current_balance, interest_rate, monthly_payment, start_date, end_date) VALUES
  ('loan-1', 'prop-1', 'Crédit Agricole', 240000, 220000, 0.0185, 1150, '2023-02-15', '2043-02-15'),
  ('loan-2', 'prop-2', 'BNP Paribas', 210000, 195000, 0.0210, 1080, '2022-08-20', '2042-08-20'),
  ('loan-3', 'prop-3', 'Société Générale', 337500, 315000, 0.0195, 1650, '2023-04-10', '2043-04-10'),
  ('loan-4', 'prop-4', 'LCL', 285000, 270000, 0.0220, 1420, '2022-12-01', '2042-12-01'),
  ('loan-5', 'prop-5', 'Crédit Mutuel', 165000, 155000, 0.0175, 850, '2023-06-15', '2043-06-15');

-- Sample transactions
INSERT INTO public.transactions (id, portfolio_id, property_id, legal_entity_id, type, category, description, amount, transaction_date, is_recurring, recurring_frequency) VALUES
  -- Rental income
  ('trans-1', 'portfolio-demo', 'prop-1', 'entity-lmnp', 'rental_income', 'rent', 'Loyer janvier 2024', 1800, '2024-01-01', true, 'monthly'),
  ('trans-2', 'portfolio-demo', 'prop-2', 'entity-sci', 'rental_income', 'rent', 'Loyer janvier 2024', 1500, '2024-01-01', true, 'monthly'),
  ('trans-3', 'portfolio-demo-1', 'prop-3', 'entity-1', 'rental_income', 'rent', 'Loyer janvier 2024', 2200, '2024-01-01', true, 'monthly'),
  ('trans-4', 'portfolio-demo-1', 'prop-4', 'entity-2', 'rental_income', 'rent', 'Loyer commercial janvier 2024', 1800, '2024-01-01', true, 'monthly'),
  ('trans-5', 'portfolio-demo-1', 'prop-5', 'entity-3', 'rental_income', 'rent', 'Loyer janvier 2024', 1200, '2024-01-01', true, 'monthly'),

  -- Loan payments
  ('trans-6', 'portfolio-demo', 'prop-1', 'entity-lmnp', 'loan_payment', 'mortgage', 'Mensualité prêt janvier 2024', -1150, '2024-01-05', true, 'monthly'),
  ('trans-7', 'portfolio-demo', 'prop-2', 'entity-sci', 'loan_payment', 'mortgage', 'Mensualité prêt janvier 2024', -1080, '2024-01-05', true, 'monthly'),
  ('trans-8', 'portfolio-demo-1', 'prop-3', 'entity-1', 'loan_payment', 'mortgage', 'Mensualité prêt janvier 2024', -1650, '2024-01-05', true, 'monthly'),
  ('trans-9', 'portfolio-demo-1', 'prop-4', 'entity-2', 'loan_payment', 'mortgage', 'Mensualité prêt janvier 2024', -1420, '2024-01-05', true, 'monthly'),
  ('trans-10', 'portfolio-demo-1', 'prop-5', 'entity-3', 'loan_payment', 'mortgage', 'Mensualité prêt janvier 2024', -850, '2024-01-05', true, 'monthly'),

  -- Expenses
  ('trans-11', 'portfolio-demo', 'prop-1', 'entity-lmnp', 'expense', 'maintenance', 'Réparation plomberie', -350, '2024-01-10', false, null),
  ('trans-12', 'portfolio-demo', 'prop-2', 'entity-sci', 'insurance', 'insurance', 'Assurance habitation annuelle', -480, '2024-01-15', true, 'yearly'),
  ('trans-13', 'portfolio-demo-1', 'prop-3', 'entity-1', 'expense', 'management', 'Frais de gestion syndic', -120, '2024-01-20', true, 'monthly'),
  ('trans-14', 'portfolio-demo-1', 'prop-4', 'entity-2', 'tax_payment', 'property_tax', 'Taxe foncière 2024', -1200, '2024-01-25', true, 'yearly'),
  ('trans-15', 'portfolio-demo-1', 'prop-5', 'entity-3', 'expense', 'utilities', 'Charges copropriété', -180, '2024-01-30', true, 'monthly');

-- Sample alerts
INSERT INTO public.alerts (id, portfolio_id, property_id, legal_entity_id, type, severity, title, message, status, due_date) VALUES
  ('alert-1', 'portfolio-demo', 'prop-1', 'entity-lmnp', 'maintenance_required', 'medium', 'Révision chaudière', 'La révision annuelle de la chaudière est due', 'active', '2024-03-15'),
  ('alert-2', 'portfolio-demo', 'prop-2', 'entity-sci', 'tax_deadline', 'high', 'Déclaration fiscale SCI', 'Date limite de déclaration fiscale approche', 'active', '2024-04-30'),
  ('alert-3', 'portfolio-demo-1', 'prop-3', 'entity-1', 'lease_expiry', 'medium', 'Fin de bail', 'Le bail arrive à échéance dans 3 mois', 'active', '2024-06-30'),
  ('alert-4', 'portfolio-demo-1', 'prop-4', 'entity-2', 'compliance_issue', 'critical', 'Diagnostic ERP manquant', 'Le diagnostic État des Risques et Pollutions doit être renouvelé', 'active', '2024-02-28'),
  ('alert-5', 'portfolio-demo-1', 'prop-5', 'entity-3', 'payment_due', 'low', 'Charges syndic', 'Appel de charges trimestriel à régler', 'acknowledged', '2024-03-01'),
  ('alert-6', 'portfolio-demo', null, 'entity-lmnp', 'tax_deadline', 'high', 'Déclaration LMNP', 'Déclaration revenus LMNP à effectuer', 'active', '2024-05-31'),
  ('alert-7', 'portfolio-demo-1', 'prop-3', 'entity-1', 'market_opportunity', 'low', 'Opportunité refinancement', 'Taux plus avantageux disponibles', 'active', null),
  ('alert-8', 'portfolio-demo-1', 'prop-4', 'entity-2', 'maintenance_required', 'medium', 'Contrôle ascenseur', 'Contrôle technique ascenseur obligatoire', 'resolved', '2024-02-15');

-- Sample fiscal settings
INSERT INTO public.fiscal_settings (legal_entity_id, regime_type, tax_year, land_percentage, depreciation_components, deduction_limits) VALUES
  ('entity-lmnp', 'lmnp', 2024, 20.00,
   '{"building": {"rate": 2.5, "base_amount": 0}, "furniture": {"rate": 10.0, "base_amount": 15000}, "equipment": {"rate": 20.0, "base_amount": 5000}}'::jsonb,
   '{"deficit_carryforward": 10700, "interest_deduction": 0.85}'::jsonb),
  ('entity-sci', 'sci_ir', 2024, 25.00,
   '{"building": {"rate": 2.5, "base_amount": 0}, "furniture": {"rate": 0.0, "base_amount": 0}, "equipment": {"rate": 10.0, "base_amount": 0}}'::jsonb,
   '{"deficit_carryforward": 0, "interest_deduction": 1.0}'::jsonb),
  ('entity-1', 'lmnp', 2024, 20.00,
   '{"building": {"rate": 2.5, "base_amount": 0}, "furniture": {"rate": 10.0, "base_amount": 20000}, "equipment": {"rate": 20.0, "base_amount": 8000}}'::jsonb,
   '{"deficit_carryforward": 10700, "interest_deduction": 0.85}'::jsonb),
  ('entity-2', 'sci_is', 2024, 25.00,
   '{"building": {"rate": 4.0, "base_amount": 0}, "furniture": {"rate": 0.0, "base_amount": 0}, "equipment": {"rate": 20.0, "base_amount": 0}}'::jsonb,
   '{"deficit_carryforward": 0, "interest_deduction": 1.0}'::jsonb),
  ('entity-3', 'sarl', 2024, 25.00,
   '{"building": {"rate": 4.0, "base_amount": 0}, "furniture": {"rate": 10.0, "base_amount": 0}, "equipment": {"rate": 20.0, "base_amount": 0}}'::jsonb,
   '{"deficit_carryforward": 1000000, "interest_deduction": 1.0}'::jsonb);