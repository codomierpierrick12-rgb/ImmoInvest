import {
  PropertyComparison,
  ComparisonCriteria,
  ComparisonReport,
  ComparisonMetric,
  DEFAULT_COMPARISON_METRICS,
  COMPARISON_PRESETS
} from '@/lib/types/comparison';
import { Property, Transaction } from '@/lib/types/database';

/**
 * Stoneverse Property Comparator
 * Advanced property comparison and analysis engine
 */
export class PropertyComparator {
  private metrics: ComparisonMetric[] = DEFAULT_COMPARISON_METRICS;

  /**
   * Compare multiple properties based on specified criteria
   */
  async compareProperties(
    properties: Property[],
    transactions: Transaction[],
    criteria?: ComparisonCriteria
  ): Promise<ComparisonReport> {
    // Calculate detailed metrics for each property
    const propertyComparisons = await Promise.all(
      properties.map(property => this.calculatePropertyMetrics(property, transactions))
    );

    // Apply filters if specified
    const filteredComparisons = criteria?.filters
      ? this.applyFilters(propertyComparisons, criteria.filters)
      : propertyComparisons;

    // Calculate comparative scores
    const comparisonsWithScores = this.calculateComparativeScores(filteredComparisons);

    // Sort by specified criteria
    const sortedComparisons = this.sortComparisons(
      comparisonsWithScores,
      criteria?.sort_by || 'overall_score',
      criteria?.sort_direction || 'desc'
    );

    // Generate summary and recommendations
    const summary = this.generateSummary(sortedComparisons);
    const marketContext = this.getMarketContext(sortedComparisons);

    return {
      properties: sortedComparisons,
      summary,
      market_context: marketContext
    };
  }

  /**
   * Calculate detailed metrics for a single property
   */
  private async calculatePropertyMetrics(
    property: Property,
    transactions: Transaction[]
  ): Promise<PropertyComparison> {
    const propertyTransactions = transactions.filter(t => t.property_id === property.id);

    // Calculate basic financial metrics
    const annualRent = property.rental_price * 12;
    const annualExpenses = propertyTransactions
      .filter(t => t.amount < 0 && t.category === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netAnnualIncome = annualRent - annualExpenses;
    const monthlyExpenses = annualExpenses / 12;
    const monthlyCashFlow = property.rental_price - monthlyExpenses;

    // Financial ratios
    const rentalYield = annualRent / property.acquisition_price;
    const capRate = netAnnualIncome / property.current_value;
    const pricePerSqm = property.current_value / property.surface_area;

    // Advanced calculations
    const totalInvestment = property.acquisition_price + annualExpenses;
    const currentEquity = property.current_value - (property.acquisition_price * 0.8); // Assuming 80% LTV
    const cashOnCashReturn = monthlyCashFlow * 12 / (property.acquisition_price * 0.2); // On 20% down payment

    // Calculate IRR (simplified 5-year projection)
    const projectedValue = property.current_value * Math.pow(1.025, 5); // 2.5% annual appreciation
    const totalCashFlows = monthlyCashFlow * 12 * 5;
    const totalReturn = (projectedValue + totalCashFlows - totalInvestment) / totalInvestment;
    const irr = Math.pow(1 + totalReturn, 1/5) - 1;

    // Location and risk scores (simulated based on city and other factors)
    const locationScores = this.calculateLocationScores(property);
    const riskScores = this.calculateRiskScores(property, propertyTransactions);

    // Performance scores
    const financialScore = this.calculateFinancialScore({
      rentalYield,
      capRate,
      cashOnCashReturn,
      irr,
      monthlyCashFlow
    });

    const riskScore = this.calculateRiskScore(riskScores);
    const locationScore = this.calculateLocationScore(locationScores);
    const overallScore = (financialScore * 0.5) + (riskScore * 0.3) + (locationScore * 0.2);

    return {
      property_id: property.id,
      address: property.address,
      city: property.city,
      property_type: property.property_type,

      // Basic metrics
      acquisition_price: property.acquisition_price,
      current_value: property.current_value,
      surface_area: property.surface_area,
      price_per_sqm: pricePerSqm,

      // Financial metrics
      rental_yield: rentalYield,
      cap_rate: capRate,
      cash_on_cash_return: cashOnCashReturn,
      total_roi: (property.current_value - property.acquisition_price) / property.acquisition_price,
      irr: irr,

      // Cash flow
      monthly_rent: property.rental_price,
      monthly_expenses: monthlyExpenses,
      monthly_cash_flow: monthlyCashFlow,
      annual_cash_flow: monthlyCashFlow * 12,

      // Risk metrics
      occupancy_rate: 0.94, // Simulated
      vacancy_risk: riskScores.vacancyRisk,
      market_volatility: riskScores.marketVolatility,
      liquidity_score: riskScores.liquidityScore,

      // Location metrics
      market_growth_rate: locationScores.marketGrowthRate,
      neighborhood_score: locationScores.neighborhoodScore,
      transport_score: locationScores.transportScore,
      amenities_score: locationScores.amenitiesScore,

      // Performance scores
      financial_score: financialScore,
      risk_score: riskScore,
      location_score: locationScore,
      overall_score: overallScore,

      // Comparative indicators (calculated later)
      vs_portfolio_avg: {
        yield: 0,
        cash_flow: 0,
        roi: 0,
        risk: 0
      },

      vs_market_avg: {
        price_per_sqm: 0,
        yield: 0,
        growth: 0
      }
    };
  }

  private calculateLocationScores(property: Property) {
    // Simulated location scoring based on city
    const cityScores: Record<string, any> = {
      'Paris': {
        marketGrowthRate: 0.032,
        neighborhoodScore: 85,
        transportScore: 95,
        amenitiesScore: 90
      },
      'Lyon': {
        marketGrowthRate: 0.028,
        neighborhoodScore: 78,
        transportScore: 82,
        amenitiesScore: 75
      },
      'Bordeaux': {
        marketGrowthRate: 0.025,
        neighborhoodScore: 72,
        transportScore: 70,
        amenitiesScore: 68
      }
    };

    return cityScores[property.city] || {
      marketGrowthRate: 0.020,
      neighborhoodScore: 60,
      transportScore: 60,
      amenitiesScore: 60
    };
  }

  private calculateRiskScores(property: Property, transactions: Transaction[]) {
    // Simulated risk scoring
    const baseRisk = property.property_type === 'apartment' ? 0.15 : 0.25;
    const cityRiskMultiplier = property.city === 'Paris' ? 0.8 :
                              property.city === 'Lyon' ? 0.9 : 1.0;

    return {
      vacancyRisk: baseRisk * cityRiskMultiplier,
      marketVolatility: 0.12 + (Math.random() * 0.08),
      liquidityScore: property.city === 'Paris' ? 85 :
                     property.city === 'Lyon' ? 75 : 65
    };
  }

  private calculateFinancialScore(metrics: {
    rentalYield: number;
    capRate: number;
    cashOnCashReturn: number;
    irr: number;
    monthlyCashFlow: number;
  }): number {
    // Weighted financial score calculation
    const yieldScore = Math.min(metrics.rentalYield * 1000, 100); // Cap at 10%
    const capRateScore = Math.min(metrics.capRate * 1666, 100); // Cap at 6%
    const cashReturnScore = Math.min(metrics.cashOnCashReturn * 1000, 100);
    const irrScore = Math.min(metrics.irr * 1000, 100);
    const cashFlowScore = Math.min(Math.max(metrics.monthlyCashFlow / 10, 0), 100);

    return (yieldScore * 0.25) + (capRateScore * 0.2) + (cashReturnScore * 0.2) +
           (irrScore * 0.2) + (cashFlowScore * 0.15);
  }

  private calculateRiskScore(riskMetrics: {
    vacancyRisk: number;
    marketVolatility: number;
    liquidityScore: number;
  }): number {
    // Lower risk = higher score
    const vacancyScore = (1 - riskMetrics.vacancyRisk) * 100;
    const volatilityScore = (1 - riskMetrics.marketVolatility) * 100;
    const liquidityScore = riskMetrics.liquidityScore;

    return (vacancyScore * 0.4) + (volatilityScore * 0.3) + (liquidityScore * 0.3);
  }

  private calculateLocationScore(locationMetrics: {
    marketGrowthRate: number;
    neighborhoodScore: number;
    transportScore: number;
    amenitiesScore: number;
  }): number {
    const growthScore = Math.min(locationMetrics.marketGrowthRate * 2500, 100);

    return (growthScore * 0.4) + (locationMetrics.neighborhoodScore * 0.3) +
           (locationMetrics.transportScore * 0.2) + (locationMetrics.amenitiesScore * 0.1);
  }

  private calculateComparativeScores(properties: PropertyComparison[]): PropertyComparison[] {
    if (properties.length === 0) return properties;

    // Calculate portfolio averages
    const avgYield = properties.reduce((sum, p) => sum + p.rental_yield, 0) / properties.length;
    const avgCashFlow = properties.reduce((sum, p) => sum + p.monthly_cash_flow, 0) / properties.length;
    const avgROI = properties.reduce((sum, p) => sum + p.total_roi, 0) / properties.length;
    const avgRiskScore = properties.reduce((sum, p) => sum + p.risk_score, 0) / properties.length;

    // Market averages (simulated)
    const marketAvgPricePerSqm = 5500; // €/m²
    const marketAvgYield = 0.045; // 4.5%
    const marketAvgGrowth = 0.025; // 2.5%

    return properties.map(property => ({
      ...property,
      vs_portfolio_avg: {
        yield: (property.rental_yield - avgYield) / avgYield,
        cash_flow: (property.monthly_cash_flow - avgCashFlow) / Math.max(avgCashFlow, 1),
        roi: (property.total_roi - avgROI) / Math.max(avgROI, 0.01),
        risk: (property.risk_score - avgRiskScore) / avgRiskScore
      },
      vs_market_avg: {
        price_per_sqm: (property.price_per_sqm - marketAvgPricePerSqm) / marketAvgPricePerSqm,
        yield: (property.rental_yield - marketAvgYield) / marketAvgYield,
        growth: (property.market_growth_rate - marketAvgGrowth) / marketAvgGrowth
      }
    }));
  }

  private applyFilters(
    properties: PropertyComparison[],
    filters: ComparisonCriteria['filters']
  ): PropertyComparison[] {
    if (!filters) return properties;

    return properties.filter(property => {
      if (filters.min_yield && property.rental_yield < filters.min_yield) return false;
      if (filters.max_price && property.current_value > filters.max_price) return false;
      if (filters.min_surface && property.surface_area < filters.min_surface) return false;
      if (filters.max_surface && property.surface_area > filters.max_surface) return false;
      if (filters.cities && !filters.cities.includes(property.city)) return false;
      if (filters.property_types && !filters.property_types.includes(property.property_type)) return false;

      return true;
    });
  }

  private sortComparisons(
    properties: PropertyComparison[],
    sortBy: string,
    direction: 'asc' | 'desc'
  ): PropertyComparison[] {
    return [...properties].sort((a, b) => {
      const aValue = this.getPropertyValue(a, sortBy);
      const bValue = this.getPropertyValue(b, sortBy);

      const comparison = aValue - bValue;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  private getPropertyValue(property: PropertyComparison, key: string): number {
    return (property as any)[key] || 0;
  }

  private generateSummary(properties: PropertyComparison[]) {
    if (properties.length === 0) {
      return {
        best_performer: {} as any,
        portfolio_insights: {
          total_properties: 0,
          avg_yield: 0,
          avg_cash_flow: 0,
          total_value: 0,
          diversification_score: 0
        },
        recommendations: []
      };
    }

    // Find best performers
    const bestOverall = properties.reduce((best, current) =>
      current.overall_score > best.overall_score ? current : best
    );

    const bestFinancial = properties.reduce((best, current) =>
      current.financial_score > best.financial_score ? current : best
    );

    const bestRiskAdjusted = properties.reduce((best, current) =>
      (current.financial_score * current.risk_score / 100) > (best.financial_score * best.risk_score / 100) ? current : best
    );

    const bestLocation = properties.reduce((best, current) =>
      current.location_score > best.location_score ? current : best
    );

    // Portfolio insights
    const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
    const avgYield = properties.reduce((sum, p) => sum + p.rental_yield, 0) / properties.length;
    const avgCashFlow = properties.reduce((sum, p) => sum + p.monthly_cash_flow, 0) / properties.length;

    // Diversification score (based on city and property type diversity)
    const cities = new Set(properties.map(p => p.city));
    const types = new Set(properties.map(p => p.property_type));
    const diversificationScore = Math.min((cities.size * 20) + (types.size * 15), 100);

    // Generate recommendations
    const recommendations = this.generateRecommendations(properties);

    return {
      best_performer: {
        overall: bestOverall,
        financial: bestFinancial,
        risk_adjusted: bestRiskAdjusted,
        location: bestLocation
      },
      portfolio_insights: {
        total_properties: properties.length,
        avg_yield: avgYield,
        avg_cash_flow: avgCashFlow,
        total_value: totalValue,
        diversification_score: diversificationScore
      },
      recommendations
    };
  }

  private generateRecommendations(properties: PropertyComparison[]) {
    const recommendations: any[] = [];

    properties.forEach(property => {
      // Sell recommendation for underperformers
      if (property.overall_score < 40 && property.monthly_cash_flow < 0) {
        recommendations.push({
          type: 'sell',
          property_id: property.property_id,
          reasoning: `Performance globale faible (${property.overall_score.toFixed(0)}/100) et cash flow négatif`,
          priority: 'high',
          potential_impact: Math.abs(property.monthly_cash_flow) * 12
        });
      }

      // Hold recommendation for solid performers
      if (property.overall_score >= 60 && property.monthly_cash_flow > 200) {
        recommendations.push({
          type: 'hold',
          property_id: property.property_id,
          reasoning: `Bon performer avec score global de ${property.overall_score.toFixed(0)}/100`,
          priority: 'low',
          potential_impact: property.annual_cash_flow
        });
      }

      // Improve recommendation for potential
      if (property.location_score > 70 && property.financial_score < 50) {
        recommendations.push({
          type: 'improve',
          property_id: property.property_id,
          reasoning: `Excellent emplacement mais performance financière à améliorer`,
          priority: 'medium',
          potential_impact: property.monthly_rent * 0.2 * 12 // 20% improvement potential
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority as keyof typeof priorityWeight] - priorityWeight[a.priority as keyof typeof priorityWeight];
    });
  }

  private getMarketContext(properties: PropertyComparison[]) {
    // Simulate market context based on property data
    const avgGrowthRate = properties.reduce((sum, p) => sum + p.market_growth_rate, 0) / properties.length;
    const avgYield = properties.reduce((sum, p) => sum + p.rental_yield, 0) / properties.length;

    return {
      market_conditions: avgGrowthRate > 0.03 ? 'bullish' : avgGrowthRate < 0.02 ? 'bearish' : 'neutral',
      interest_rate_trend: 'stable' as const,
      best_investment_areas: ['Paris 11ème', 'Lyon Part-Dieu', 'Bordeaux Centre'],
      emerging_opportunities: ['Télétravail-friendly areas', 'Green buildings', 'Student housing']
    };
  }

  /**
   * Get comparison preset configurations
   */
  getComparisonPresets() {
    return COMPARISON_PRESETS;
  }

  /**
   * Get available comparison metrics
   */
  getAvailableMetrics() {
    return this.metrics;
  }
}

// Global comparator instance
export const propertyComparator = new PropertyComparator();