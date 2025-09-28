export interface PropertyComparison {
  property_id: string;
  address: string;
  city: string;
  property_type: string;

  // Basic metrics
  acquisition_price: number;
  current_value: number;
  surface_area: number;
  price_per_sqm: number;

  // Financial metrics
  rental_yield: number;
  cap_rate: number;
  cash_on_cash_return: number;
  total_roi: number;
  irr: number;

  // Cash flow
  monthly_rent: number;
  monthly_expenses: number;
  monthly_cash_flow: number;
  annual_cash_flow: number;

  // Risk metrics
  occupancy_rate: number;
  vacancy_risk: number;
  market_volatility: number;
  liquidity_score: number;

  // Location metrics
  market_growth_rate: number;
  neighborhood_score: number;
  transport_score: number;
  amenities_score: number;

  // Performance scores (0-100)
  financial_score: number;
  risk_score: number;
  location_score: number;
  overall_score: number;

  // Comparative indicators
  vs_portfolio_avg: {
    yield: number;
    cash_flow: number;
    roi: number;
    risk: number;
  };

  vs_market_avg: {
    price_per_sqm: number;
    yield: number;
    growth: number;
  };
}

export interface ComparisonCriteria {
  metrics: ComparisonMetric[];
  weights: Record<string, number>;
  filters?: {
    min_yield?: number;
    max_price?: number;
    min_surface?: number;
    max_surface?: number;
    cities?: string[];
    property_types?: string[];
  };
  sort_by: string;
  sort_direction: 'asc' | 'desc';
}

export interface ComparisonMetric {
  key: string;
  label: string;
  category: 'financial' | 'risk' | 'location' | 'physical';
  format: 'currency' | 'percentage' | 'number' | 'score';
  weight: number;
  ideal_direction: 'higher' | 'lower'; // Higher is better or lower is better
}

export interface ComparisonReport {
  properties: PropertyComparison[];
  summary: {
    best_performer: {
      overall: PropertyComparison;
      financial: PropertyComparison;
      risk_adjusted: PropertyComparison;
      location: PropertyComparison;
    };
    portfolio_insights: {
      total_properties: number;
      avg_yield: number;
      avg_cash_flow: number;
      total_value: number;
      diversification_score: number;
    };
    recommendations: Array<{
      type: 'buy' | 'hold' | 'sell' | 'improve';
      property_id: string;
      reasoning: string;
      priority: 'high' | 'medium' | 'low';
      potential_impact: number;
    }>;
  };
  market_context: {
    market_conditions: 'bullish' | 'bearish' | 'neutral';
    interest_rate_trend: 'rising' | 'falling' | 'stable';
    best_investment_areas: string[];
    emerging_opportunities: string[];
  };
}

// Default comparison metrics
export const DEFAULT_COMPARISON_METRICS: ComparisonMetric[] = [
  // Financial metrics
  {
    key: 'rental_yield',
    label: 'Rendement Locatif',
    category: 'financial',
    format: 'percentage',
    weight: 20,
    ideal_direction: 'higher'
  },
  {
    key: 'cap_rate',
    label: 'Taux de Capitalisation',
    category: 'financial',
    format: 'percentage',
    weight: 15,
    ideal_direction: 'higher'
  },
  {
    key: 'cash_on_cash_return',
    label: 'Cash-on-Cash Return',
    category: 'financial',
    format: 'percentage',
    weight: 15,
    ideal_direction: 'higher'
  },
  {
    key: 'irr',
    label: 'Taux de Rendement Interne',
    category: 'financial',
    format: 'percentage',
    weight: 15,
    ideal_direction: 'higher'
  },
  {
    key: 'monthly_cash_flow',
    label: 'Cash Flow Mensuel',
    category: 'financial',
    format: 'currency',
    weight: 10,
    ideal_direction: 'higher'
  },

  // Risk metrics
  {
    key: 'occupancy_rate',
    label: 'Taux d\'Occupation',
    category: 'risk',
    format: 'percentage',
    weight: 10,
    ideal_direction: 'higher'
  },
  {
    key: 'vacancy_risk',
    label: 'Risque de Vacance',
    category: 'risk',
    format: 'score',
    weight: 5,
    ideal_direction: 'lower'
  },
  {
    key: 'liquidity_score',
    label: 'Score de Liquidité',
    category: 'risk',
    format: 'score',
    weight: 5,
    ideal_direction: 'higher'
  },

  // Location metrics
  {
    key: 'market_growth_rate',
    label: 'Croissance du Marché',
    category: 'location',
    format: 'percentage',
    weight: 5,
    ideal_direction: 'higher'
  },
  {
    key: 'neighborhood_score',
    label: 'Score du Quartier',
    category: 'location',
    format: 'score',
    weight: 3,
    ideal_direction: 'higher'
  },
  {
    key: 'transport_score',
    label: 'Accessibilité Transport',
    category: 'location',
    format: 'score',
    weight: 2,
    ideal_direction: 'higher'
  }
];

export const METRIC_CATEGORIES = {
  financial: {
    label: 'Financier',
    color: 'text-green-600',
    icon: '💰'
  },
  risk: {
    label: 'Risque',
    color: 'text-red-600',
    icon: '⚠️'
  },
  location: {
    label: 'Emplacement',
    color: 'text-blue-600',
    icon: '📍'
  },
  physical: {
    label: 'Caractéristiques',
    color: 'text-purple-600',
    icon: '🏠'
  }
};

export const COMPARISON_PRESETS = {
  yield_focused: {
    name: 'Orienté Rendement',
    description: 'Priorise les rendements locatifs et les cash flows',
    weights: {
      rental_yield: 30,
      cash_on_cash_return: 25,
      monthly_cash_flow: 20,
      cap_rate: 15,
      occupancy_rate: 10
    }
  },
  growth_focused: {
    name: 'Orienté Croissance',
    description: 'Priorise l\'appréciation du capital et la croissance',
    weights: {
      irr: 25,
      market_growth_rate: 20,
      total_roi: 20,
      location_score: 15,
      neighborhood_score: 10,
      liquidity_score: 10
    }
  },
  risk_adjusted: {
    name: 'Ajusté au Risque',
    description: 'Équilibre rendement et maîtrise des risques',
    weights: {
      rental_yield: 20,
      occupancy_rate: 20,
      vacancy_risk: 15,
      liquidity_score: 15,
      cap_rate: 15,
      market_volatility: 15
    }
  },
  balanced: {
    name: 'Équilibré',
    description: 'Approche équilibrée entre tous les critères',
    weights: DEFAULT_COMPARISON_METRICS.reduce((acc, metric) => {
      acc[metric.key] = metric.weight;
      return acc;
    }, {} as Record<string, number>)
  }
};