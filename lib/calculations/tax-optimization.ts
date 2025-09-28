import {
  FiscalRegime,
  TaxCalculationResult,
  EnhancedLegalEntity,
  TaxReferenceData,
  DEFAULT_TAX_REFERENCE
} from '@/lib/types/fiscal';
import { Property, Transaction } from '@/lib/types/database';
import { calculateLMNPTaxResult, calculateSCIISTaxResult } from './fiscal';

/**
 * Stoneverse Tax Optimization Engine
 * Advanced tax optimization for French real estate investments
 */

export interface OptimizationScenario {
  id: string;
  name: string;
  description: string;
  fiscal_regime: FiscalRegime;
  properties: Property[];
  entities: EnhancedLegalEntity[];
  transactions: Transaction[];
  estimated_annual_savings: number;
  implementation_complexity: 'low' | 'medium' | 'high';
  implementation_cost: number;
  time_to_implementation: number; // months
  legal_requirements: string[];
}

export interface TaxOptimizationSuggestion {
  id: string;
  type: 'regime_change' | 'entity_restructuring' | 'transaction_timing' | 'depreciation_optimization' | 'expense_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potential_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
  applicable_properties: string[];
  detailed_analysis: {
    current_situation: string;
    proposed_changes: string;
    benefits: string[];
    risks: string[];
    timeline: string;
  };
}

export interface RegimeComparison {
  regime: FiscalRegime;
  entity_name: string;
  annual_tax_burden: number;
  effective_tax_rate: number;
  cash_flow_impact: number;
  depreciation_benefit: number;
  flexibility_score: number;
  exit_tax_implications: number;
  overall_score: number;
  pros: string[];
  cons: string[];
}

/**
 * Compare tax implications across different fiscal regimes
 */
export function compareRegimes(
  properties: Property[],
  transactions: Transaction[],
  year: number = new Date().getFullYear(),
  taxRef: TaxReferenceData = DEFAULT_TAX_REFERENCE
): RegimeComparison[] {
  const regimes: FiscalRegime[] = ['personal', 'lmnp', 'sci_is'];
  const comparisons: RegimeComparison[] = [];

  regimes.forEach(regime => {
    // Create a mock entity for comparison
    const mockEntity: EnhancedLegalEntity = {
      id: `mock-${regime}`,
      name: `Comparaison ${regime.toUpperCase()}`,
      type: regime,
      properties_count: properties.length,
      incorporation_date: null,
      created_at: new Date().toISOString(),
      fiscal_settings: getDefaultFiscalSettings(regime)
    };

    let totalTaxBurden = 0;
    let totalRentalIncome = 0;
    let totalDepreciation = 0;

    // Calculate tax for each property under this regime
    properties.forEach(property => {
      const propertyTransactions = transactions.filter(t => t.property_id === property.id);

      let taxResult: TaxCalculationResult;
      if (regime === 'lmnp') {
        taxResult = calculateLMNPTaxResult(property, mockEntity, propertyTransactions, year, taxRef);
      } else if (regime === 'sci_is') {
        taxResult = calculateSCIISTaxResult(property, mockEntity, propertyTransactions, year, taxRef);
      } else {
        // Personal regime - simplified calculation
        const rentalIncome = propertyTransactions
          .filter(t => t.transaction_type === 'rental_income')
          .reduce((sum, t) => sum + t.amount, 0);

        // Apply micro-foncier if under 15K€, otherwise real regime
        const isMicroFoncier = rentalIncome <= 15000;
        const taxableIncome = isMicroFoncier ?
          rentalIncome * 0.7 : // 30% allowance
          rentalIncome - propertyTransactions
            .filter(t => t.tax_deductible && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        taxResult = {
          fiscal_regime: 'personal',
          annual_result: {
            gross_rental_income: rentalIncome,
            deductible_expenses: isMicroFoncier ? rentalIncome * 0.3 : 0,
            depreciation_total: 0,
            taxable_result: taxableIncome,
            tax_due: 0, // Would be integrated with personal income tax
            effective_tax_rate: 0
          },
          depreciation_detail: []
        };
      }

      totalTaxBurden += taxResult.annual_result.tax_due;
      totalRentalIncome += taxResult.annual_result.gross_rental_income;
      totalDepreciation += taxResult.annual_result.depreciation_total;
    });

    const effectiveRate = totalRentalIncome > 0 ? (totalTaxBurden / totalRentalIncome) * 100 : 0;
    const cashFlowImpact = totalRentalIncome - totalTaxBurden;

    // Calculate flexibility and scores
    const flexibilityScore = calculateFlexibilityScore(regime);
    const exitTaxImplications = calculateExitTaxImplications(regime, properties);
    const overallScore = calculateOverallScore(regime, totalTaxBurden, flexibilityScore, exitTaxImplications);

    comparisons.push({
      regime,
      entity_name: getRegimeName(regime),
      annual_tax_burden: totalTaxBurden,
      effective_tax_rate: effectiveRate,
      cash_flow_impact: cashFlowImpact,
      depreciation_benefit: totalDepreciation,
      flexibility_score: flexibilityScore,
      exit_tax_implications: exitTaxImplications,
      overall_score: overallScore,
      pros: getRegimePros(regime),
      cons: getRegimeCons(regime)
    });
  });

  return comparisons.sort((a, b) => b.overall_score - a.overall_score);
}

/**
 * Generate tax optimization suggestions
 */
export function generateOptimizationSuggestions(
  properties: Property[],
  entities: EnhancedLegalEntity[],
  transactions: Transaction[],
  year: number = new Date().getFullYear()
): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];

  // 1. Regime Optimization
  const regimeComparisons = compareRegimes(properties, transactions, year);
  const currentRegimes = entities.map(e => e.type);
  const bestRegime = regimeComparisons[0];

  if (currentRegimes.length === 1 && !currentRegimes.includes(bestRegime.regime)) {
    suggestions.push({
      id: 'regime-optimization-1',
      type: 'regime_change',
      priority: 'high',
      title: `Optimisation: Passage en ${getRegimeName(bestRegime.regime)}`,
      description: `Basculer vers le régime ${getRegimeName(bestRegime.regime)} pourrait réduire votre fiscalité de ${Math.round((regimeComparisons.find(r => currentRegimes.includes(r.regime))?.annual_tax_burden || 0) - bestRegime.annual_tax_burden)}€/an`,
      potential_savings: (regimeComparisons.find(r => currentRegimes.includes(r.regime))?.annual_tax_burden || 0) - bestRegime.annual_tax_burden,
      implementation_effort: 'medium',
      applicable_properties: properties.map(p => p.id),
      detailed_analysis: {
        current_situation: `Régime actuel: ${currentRegimes.map(getRegimeName).join(', ')}`,
        proposed_changes: `Migration vers ${getRegimeName(bestRegime.regime)}`,
        benefits: bestRegime.pros,
        risks: bestRegime.cons,
        timeline: 'Mise en œuvre possible au 1er janvier suivant'
      }
    });
  }

  // 2. Depreciation Optimization
  entities.forEach(entity => {
    if (entity.type === 'lmnp' || entity.type === 'sci_is') {
      const entityProperties = properties.filter(p =>
        transactions.some(t => t.property_id === p.id && t.legal_entity_id === entity.id)
      );

      entityProperties.forEach(property => {
        const depreciationPotential = calculateDepreciationOptimization(property, entity);

        if (depreciationPotential.additional_deduction > 1000) {
          suggestions.push({
            id: `depreciation-${property.id}`,
            type: 'depreciation_optimization',
            priority: 'medium',
            title: 'Optimisation des amortissements',
            description: `Répartition optimale des composants d'amortissement pour ${property.address}`,
            potential_savings: depreciationPotential.additional_deduction * 0.25, // Estimation at 25% tax rate
            implementation_effort: 'low',
            applicable_properties: [property.id],
            detailed_analysis: {
              current_situation: `Amortissement actuel: ${depreciationPotential.current_depreciation}€/an`,
              proposed_changes: `Amortissement optimisé: ${depreciationPotential.optimized_depreciation}€/an`,
              benefits: ['Réduction immédiate de la fiscalité', 'Optimisation du cash-flow'],
              risks: ['Contrôle fiscal potentiel', 'Documentation requise'],
              timeline: 'Immédiat pour les prochaines déclarations'
            }
          });
        }
      });
    }
  });

  // 3. Transaction Timing Optimization
  const timingOptimization = analyzeTransactionTiming(transactions, year);
  if (timingOptimization.potential_savings > 500) {
    suggestions.push({
      id: 'timing-optimization',
      type: 'transaction_timing',
      priority: 'low',
      title: 'Optimisation temporelle des dépenses',
      description: 'Programmer les dépenses déductibles pour optimiser l\'impact fiscal',
      potential_savings: timingOptimization.potential_savings,
      implementation_effort: 'low',
      applicable_properties: properties.map(p => p.id),
      detailed_analysis: {
        current_situation: 'Dépenses réparties de manière non optimale',
        proposed_changes: 'Report ou anticipation de certaines dépenses',
        benefits: ['Lissage de la fiscalité', 'Optimisation des taux marginaux'],
        risks: ['Contraintes de trésorerie', 'Risques opérationnels'],
        timeline: 'Planification sur 12-24 mois'
      }
    });
  }

  // 4. Entity Restructuring
  if (entities.length > 1) {
    const restructuringBenefit = analyzeEntityRestructuring(properties, entities, transactions);
    if (restructuringBenefit.potential_savings > 2000) {
      suggestions.push({
        id: 'entity-restructuring',
        type: 'entity_restructuring',
        priority: 'high',
        title: 'Restructuration des entités',
        description: 'Réorganisation des entités pour optimiser la fiscalité globale',
        potential_savings: restructuringBenefit.potential_savings,
        implementation_effort: 'high',
        applicable_properties: properties.map(p => p.id),
        detailed_analysis: {
          current_situation: `${entities.length} entités distinctes`,
          proposed_changes: restructuringBenefit.recommended_structure,
          benefits: ['Optimisation fiscale globale', 'Simplification administrative'],
          risks: ['Coûts de restructuration', 'Complexité juridique'],
          timeline: '6-12 mois avec accompagnement juridique'
        }
      });
    }
  }

  return suggestions.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return (priorityWeight[b.priority] * b.potential_savings) - (priorityWeight[a.priority] * a.potential_savings);
  });
}

/**
 * Helper functions
 */
function getDefaultFiscalSettings(regime: FiscalRegime): EnhancedLegalEntity['fiscal_settings'] {
  // This would import from the fiscal.ts file
  return {
    capital_gains: {
      lmnp: {
        income_tax_allowances: [],
        social_charges_allowances: [],
        surcharge_threshold: 50000,
        surcharge_rates: [],
        depreciation_recapture: false
      },
      sci_is: {
        corporate_tax_rate: 0.25,
        depreciation_recapture: true,
        special_allowances: []
      }
    }
  };
}

function getRegimeName(regime: FiscalRegime): string {
  const names = {
    personal: 'Revenus Fonciers',
    lmnp: 'LMNP',
    sci_is: 'SCI IS'
  };
  return names[regime] || regime;
}

function getRegimePros(regime: FiscalRegime): string[] {
  const pros = {
    personal: ['Simplicité administrative', 'Pas de comptabilité', 'Micro-foncier possible'],
    lmnp: ['Amortissements déductibles', 'Charges déductibles étendues', 'Pas de charge sociale'],
    sci_is: ['Amortissements sans limite', 'Report de déficits illimité', 'Optimisation succession']
  };
  return pros[regime] || [];
}

function getRegimeCons(regime: FiscalRegime): string[] {
  const cons = {
    personal: ['Pas d\'amortissement', 'Charges limitées', 'Taxation marginale'],
    lmnp: ['Limitation déficit BIC', 'Plus-values privées', 'Complexité comptable'],
    sci_is: ['IS à payer', 'Comptabilité obligatoire', 'Charges sociales gérant']
  };
  return cons[regime] || [];
}

function calculateFlexibilityScore(regime: FiscalRegime): number {
  const scores = { personal: 90, lmnp: 70, sci_is: 50 };
  return scores[regime] || 0;
}

function calculateExitTaxImplications(regime: FiscalRegime, properties: Property[]): number {
  const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const rates = { personal: 0.19, lmnp: 0.19, sci_is: 0.25 };
  return totalValue * (rates[regime] || 0) * 0.1; // Estimation
}

function calculateOverallScore(
  regime: FiscalRegime,
  taxBurden: number,
  flexibilityScore: number,
  exitTaxImplications: number
): number {
  // Weighted scoring algorithm
  const taxScore = Math.max(0, 100 - (taxBurden / 1000));
  const exitScore = Math.max(0, 100 - (exitTaxImplications / 1000));

  return (taxScore * 0.4) + (flexibilityScore * 0.3) + (exitScore * 0.3);
}

function calculateDepreciationOptimization(property: Property, entity: EnhancedLegalEntity) {
  // Simplified calculation - could be much more sophisticated
  const currentDepreciation = property.acquisition_price * 0.025; // 2.5% building
  const optimizedDepreciation = property.acquisition_price * 0.035; // Optimized with furniture/equipment

  return {
    current_depreciation: currentDepreciation,
    optimized_depreciation: optimizedDepreciation,
    additional_deduction: optimizedDepreciation - currentDepreciation
  };
}

function analyzeTransactionTiming(transactions: Transaction[], year: number) {
  // Simplified analysis of transaction timing optimization
  const yearTransactions = transactions.filter(t =>
    new Date(t.transaction_date).getFullYear() === year
  );

  const q4Expenses = yearTransactions.filter(t =>
    t.amount < 0 && new Date(t.transaction_date).getMonth() >= 9
  );

  return {
    potential_savings: q4Expenses.length * 100 // Simplified calculation
  };
}

function analyzeEntityRestructuring(
  properties: Property[],
  entities: EnhancedLegalEntity[],
  transactions: Transaction[]
) {
  // Simplified analysis - in reality would be much more complex
  const currentComplexity = entities.length;
  const potentialSavings = currentComplexity > 2 ? currentComplexity * 1000 : 0;

  return {
    potential_savings: potentialSavings,
    recommended_structure: 'Consolidation en 1-2 entités optimales'
  };
}