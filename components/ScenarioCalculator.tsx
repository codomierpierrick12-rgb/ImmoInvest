'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoanData {
  amount: number;
  interest_rate: number;
  duration_years: number;
  bank_name: string;
  loan_type: string;
}

interface ScenarioData {
  // Property Information
  property_name: string;
  property_type: string;
  location: string;
  surface: number;
  rooms: number;

  // Financial Data
  purchase_price: number;
  notary_fees: number;
  renovation_cost: number;
  agency_fees: number;
  other_purchase_costs: number;

  // Rental Information
  monthly_rent: number;
  charges: number;
  vacancy_rate: number; // percentage
  rent_increase_rate: number; // percentage per year

  // Loan Information
  loan: LoanData;

  // Tax Information
  tax_regime: 'LMNP' | 'SCI_IS';

  // Operating Expenses
  property_management_rate: number; // percentage
  insurance_annual: number;
  property_tax_annual: number;
  maintenance_annual: number;

  // Exit Strategy
  exit_year: number;
  exit_value: number;
  capital_gains_tax_rate: number; // percentage
  sale_costs_rate: number; // percentage
}

interface CalculationResults {
  monthly_payment: number;
  net_monthly_cash_flow: number;
  annual_cash_flow: number;
  total_investment: number;
  irr: number;
  npv: number;
  roi: number;
  cap_rate: number;
  ltv: number;
  dscr: number;
  total_return: number;
  cash_on_cash_return: number;
}

interface ScenarioCalculatorProps {
  onSave?: (scenario: any) => void;
  onCancel?: () => void;
}

export default function ScenarioCalculator({ onSave, onCancel }: ScenarioCalculatorProps) {
  const [activeTab, setActiveTab] = useState('property');
  const [scenario, setScenario] = useState<ScenarioData>({
    // Property Information
    property_name: '',
    property_type: 'Appartement',
    location: '',
    surface: 0,
    rooms: 0,

    // Financial Data
    purchase_price: 0,
    notary_fees: 0,
    renovation_cost: 0,
    agency_fees: 0,
    other_purchase_costs: 0,

    // Rental Information
    monthly_rent: 0,
    charges: 0,
    vacancy_rate: 5, // 5% by default
    rent_increase_rate: 1.5, // 1.5% per year

    // Loan Information
    loan: {
      amount: 0,
      interest_rate: 2.5,
      duration_years: 20,
      bank_name: '',
      loan_type: 'Amortissable'
    },

    // Tax Information
    tax_regime: 'LMNP',

    // Operating Expenses
    property_management_rate: 8, // 8% of rent
    insurance_annual: 600,
    property_tax_annual: 1200,
    maintenance_annual: 1000,

    // Exit Strategy
    exit_year: 10,
    exit_value: 0,
    capital_gains_tax_rate: 19,
    sale_costs_rate: 7 // notary + agency fees
  });

  const [results, setResults] = useState<CalculationResults | null>(null);

  const updateScenario = (field: string, value: any) => {
    setScenario(prev => {
      if (field.startsWith('loan.')) {
        const loanField = field.split('.')[1];
        return {
          ...prev,
          loan: {
            ...prev.loan,
            [loanField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const calculateMonthlyPayment = (principal: number, rate: number, years: number): number => {
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  const calculateScenario = (): CalculationResults => {
    const totalInvestment = scenario.purchase_price + scenario.notary_fees +
                           scenario.renovation_cost + scenario.agency_fees +
                           scenario.other_purchase_costs - scenario.loan.amount;

    const monthlyPayment = calculateMonthlyPayment(
      scenario.loan.amount,
      scenario.loan.interest_rate,
      scenario.loan.duration_years
    );

    const grossMonthlyRent = scenario.monthly_rent;
    const netMonthlyRent = grossMonthlyRent * (1 - scenario.vacancy_rate / 100);

    const monthlyExpenses = (netMonthlyRent * scenario.property_management_rate / 100) +
                           (scenario.insurance_annual / 12) +
                           (scenario.property_tax_annual / 12) +
                           (scenario.maintenance_annual / 12) +
                           scenario.charges;

    const netMonthlyCashFlow = netMonthlyRent - monthlyPayment - monthlyExpenses;
    const annualCashFlow = netMonthlyCashFlow * 12;

    // Calculate IRR and NPV (simplified)
    const exitValue = scenario.exit_value || scenario.purchase_price * 1.3; // 30% appreciation if not specified
    const saleNetProceeds = exitValue * (1 - scenario.sale_costs_rate / 100);

    // Remaining loan balance at exit
    const remainingBalance = scenario.loan.amount * Math.pow(1 + scenario.loan.interest_rate / 100, scenario.exit_year) -
                            monthlyPayment * 12 * scenario.exit_year;

    const netExitProceeds = saleNetProceeds - Math.max(0, remainingBalance);

    // Simple IRR calculation (approximation)
    const totalCashFlows = annualCashFlow * scenario.exit_year + netExitProceeds;
    const irr = Math.pow(totalCashFlows / totalInvestment, 1 / scenario.exit_year) - 1;

    const npv = totalCashFlows - totalInvestment;
    const roi = (totalCashFlows / totalInvestment - 1) * 100;
    const capRate = (grossMonthlyRent * 12) / scenario.purchase_price * 100;
    const ltv = scenario.loan.amount / scenario.purchase_price * 100;
    const dscr = (netMonthlyRent * 12) / (monthlyPayment * 12);
    const totalReturn = totalCashFlows - totalInvestment;
    const cashOnCashReturn = annualCashFlow / totalInvestment * 100;

    return {
      monthly_payment: monthlyPayment,
      net_monthly_cash_flow: netMonthlyCashFlow,
      annual_cash_flow: annualCashFlow,
      total_investment: totalInvestment,
      irr: irr * 100,
      npv,
      roi,
      cap_rate: capRate,
      ltv,
      dscr,
      total_return: totalReturn,
      cash_on_cash_return: cashOnCashReturn
    };
  };

  const handleCalculate = () => {
    const calculatedResults = calculateScenario();
    setResults(calculatedResults);
  };

  const handleSave = () => {
    if (onSave) {
      const scenarioToSave = {
        name: scenario.property_name || 'Nouveau Scénario',
        description: `Analyse ${scenario.property_type} - ${scenario.location}`,
        scenario_type: 'Acquisition',
        data: scenario,
        irr: results?.irr,
        npv: results?.npv,
        cash_flow_year_1: results?.annual_cash_flow,
        total_return: results?.total_return,
        status: 'Analyzed'
      };
      onSave(scenarioToSave);
    }
  };

  const tabs = [
    { id: 'property', name: 'Bien', icon: '🏠' },
    { id: 'financial', name: 'Financier', icon: '💰' },
    { id: 'rental', name: 'Location', icon: '📝' },
    { id: 'loan', name: 'Financement', icon: '🏦' },
    { id: 'expenses', name: 'Charges', icon: '📊' },
    { id: 'exit', name: 'Revente', icon: '🎯' },
    { id: 'results', name: 'Résultats', icon: '📈' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Calculateur de Scénarios</h2>
            <div className="space-x-2">
              {results && (
                <Button onClick={handleSave}>
                  Sauvegarder
                </Button>
              )}
              <Button variant="outline" onClick={onCancel}>
                Fermer
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'property' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Informations du Bien</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom du bien"
                  value={scenario.property_name}
                  onChange={(e) => updateScenario('property_name', e.target.value)}
                  placeholder="Appartement Bordeaux Centre"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de bien
                  </label>
                  <select
                    value={scenario.property_type}
                    onChange={(e) => updateScenario('property_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Appartement">Appartement</option>
                    <option value="Maison">Maison</option>
                    <option value="Studio">Studio</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Loft">Loft</option>
                  </select>
                </div>
              </div>
              <Input
                label="Localisation"
                value={scenario.location}
                onChange={(e) => updateScenario('location', e.target.value)}
                placeholder="Bordeaux, Gironde"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Surface (m²)"
                  type="number"
                  value={scenario.surface}
                  onChange={(e) => updateScenario('surface', Number(e.target.value))}
                  placeholder="75"
                />
                <Input
                  label="Nombre de pièces"
                  type="number"
                  value={scenario.rooms}
                  onChange={(e) => updateScenario('rooms', Number(e.target.value))}
                  placeholder="3"
                />
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Données Financières</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Prix d'achat (€)"
                  type="number"
                  value={scenario.purchase_price}
                  onChange={(e) => updateScenario('purchase_price', Number(e.target.value))}
                  placeholder="450000"
                />
                <Input
                  label="Frais de notaire (€)"
                  type="number"
                  value={scenario.notary_fees}
                  onChange={(e) => updateScenario('notary_fees', Number(e.target.value))}
                  placeholder="31500"
                  helperText="Généralement 7% du prix d'achat"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Coût des travaux (€)"
                  type="number"
                  value={scenario.renovation_cost}
                  onChange={(e) => updateScenario('renovation_cost', Number(e.target.value))}
                  placeholder="25000"
                />
                <Input
                  label="Frais d'agence (€)"
                  type="number"
                  value={scenario.agency_fees}
                  onChange={(e) => updateScenario('agency_fees', Number(e.target.value))}
                  placeholder="13500"
                  helperText="Généralement 3% du prix d'achat"
                />
              </div>
              <Input
                label="Autres frais d'acquisition (€)"
                type="number"
                value={scenario.other_purchase_costs}
                onChange={(e) => updateScenario('other_purchase_costs', Number(e.target.value))}
                placeholder="5000"
                helperText="Frais de dossier, diagnostics, etc."
              />
            </div>
          )}

          {activeTab === 'rental' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Informations Locatives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Loyer mensuel (€)"
                  type="number"
                  value={scenario.monthly_rent}
                  onChange={(e) => updateScenario('monthly_rent', Number(e.target.value))}
                  placeholder="2100"
                />
                <Input
                  label="Charges mensuelles (€)"
                  type="number"
                  value={scenario.charges}
                  onChange={(e) => updateScenario('charges', Number(e.target.value))}
                  placeholder="150"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Taux de vacance (%)"
                  type="number"
                  value={scenario.vacancy_rate}
                  onChange={(e) => updateScenario('vacancy_rate', Number(e.target.value))}
                  placeholder="5"
                  helperText="Pourcentage de vacance locative annuel"
                />
                <Input
                  label="Augmentation loyer annuelle (%)"
                  type="number"
                  step="0.1"
                  value={scenario.rent_increase_rate}
                  onChange={(e) => updateScenario('rent_increase_rate', Number(e.target.value))}
                  placeholder="1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Régime fiscal
                </label>
                <select
                  value={scenario.tax_regime}
                  onChange={(e) => updateScenario('tax_regime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LMNP">LMNP (Loueur Meublé Non Professionnel)</option>
                  <option value="SCI_IS">SCI IS (Société Civile Immobilière)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'loan' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Financement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Montant emprunté (€)"
                  type="number"
                  value={scenario.loan.amount}
                  onChange={(e) => updateScenario('loan.amount', Number(e.target.value))}
                  placeholder="337500"
                />
                <Input
                  label="Taux d'intérêt (%)"
                  type="number"
                  step="0.01"
                  value={scenario.loan.interest_rate}
                  onChange={(e) => updateScenario('loan.interest_rate', Number(e.target.value))}
                  placeholder="2.5"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Durée (années)"
                  type="number"
                  value={scenario.loan.duration_years}
                  onChange={(e) => updateScenario('loan.duration_years', Number(e.target.value))}
                  placeholder="20"
                />
                <Input
                  label="Nom de la banque"
                  value={scenario.loan.bank_name}
                  onChange={(e) => updateScenario('loan.bank_name', e.target.value)}
                  placeholder="Crédit Agricole"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de prêt
                </label>
                <select
                  value={scenario.loan.loan_type}
                  onChange={(e) => updateScenario('loan.loan_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Amortissable">Amortissable</option>
                  <option value="In Fine">In Fine</option>
                  <option value="Modulable">Modulable</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Charges et Frais de Gestion</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Gestion locative (%)"
                  type="number"
                  value={scenario.property_management_rate}
                  onChange={(e) => updateScenario('property_management_rate', Number(e.target.value))}
                  placeholder="8"
                  helperText="Pourcentage du loyer"
                />
                <Input
                  label="Assurance annuelle (€)"
                  type="number"
                  value={scenario.insurance_annual}
                  onChange={(e) => updateScenario('insurance_annual', Number(e.target.value))}
                  placeholder="600"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Taxe foncière annuelle (€)"
                  type="number"
                  value={scenario.property_tax_annual}
                  onChange={(e) => updateScenario('property_tax_annual', Number(e.target.value))}
                  placeholder="1200"
                />
                <Input
                  label="Maintenance annuelle (€)"
                  type="number"
                  value={scenario.maintenance_annual}
                  onChange={(e) => updateScenario('maintenance_annual', Number(e.target.value))}
                  placeholder="1000"
                  helperText="Travaux d'entretien, réparations"
                />
              </div>
            </div>
          )}

          {activeTab === 'exit' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Stratégie de Sortie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Année de revente"
                  type="number"
                  value={scenario.exit_year}
                  onChange={(e) => updateScenario('exit_year', Number(e.target.value))}
                  placeholder="10"
                />
                <Input
                  label="Valeur de revente estimée (€)"
                  type="number"
                  value={scenario.exit_value}
                  onChange={(e) => updateScenario('exit_value', Number(e.target.value))}
                  placeholder="585000"
                  helperText="Laissez vide pour +30% d'appréciation"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Taux plus-value (%)"
                  type="number"
                  step="0.1"
                  value={scenario.capital_gains_tax_rate}
                  onChange={(e) => updateScenario('capital_gains_tax_rate', Number(e.target.value))}
                  placeholder="19"
                  helperText="Impôt sur les plus-values"
                />
                <Input
                  label="Frais de vente (%)"
                  type="number"
                  step="0.1"
                  value={scenario.sale_costs_rate}
                  onChange={(e) => updateScenario('sale_costs_rate', Number(e.target.value))}
                  placeholder="7"
                  helperText="Notaire + agence"
                />
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Résultats de l'Analyse</h3>
                <Button onClick={handleCalculate}>
                  Calculer
                </Button>
              </div>

              {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Investissement Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {results.total_investment.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">Apport personnel requis</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cash Flow Mensuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.net_monthly_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.net_monthly_cash_flow.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">Trésorerie mensuelle</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Mensualité Prêt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {results.monthly_payment.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">Remboursement mensuel</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">TRI (IRR)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.irr >= 8 ? 'text-green-600' : results.irr >= 5 ? 'text-orange-500' : 'text-red-600'}`}>
                        {results.irr.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Taux de rendement interne</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">VAN (NPV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.npv.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">Valeur actuelle nette</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">ROI Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.roi >= 50 ? 'text-green-600' : results.roi >= 20 ? 'text-orange-500' : 'text-red-600'}`}>
                        {results.roi.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Retour sur investissement</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cap Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {results.cap_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Taux de capitalisation</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">LTV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {results.ltv.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Loan-to-Value</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">DSCR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.dscr >= 1.25 ? 'text-green-600' : results.dscr >= 1 ? 'text-orange-500' : 'text-red-600'}`}>
                        {results.dscr.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Debt Service Coverage</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cash-on-Cash</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.cash_on_cash_return >= 8 ? 'text-green-600' : results.cash_on_cash_return >= 4 ? 'text-orange-500' : 'text-red-600'}`}>
                        {results.cash_on_cash_return.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Rendement sur apport</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Gain Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.total_return.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">Sur {scenario.exit_year} ans</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cash Flow Annuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${results.annual_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.annual_cash_flow.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">Trésorerie annuelle</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!results && (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mb-4">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">🧮</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Prêt à calculer
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Cliquez sur "Calculer" pour analyser votre scénario d'investissement.
                    </p>
                    <Button onClick={handleCalculate}>
                      Calculer les résultats
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}