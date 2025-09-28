'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TooltipMetric, { LTVTooltip, DSCRTooltip } from '@/components/ui/tooltip-metric';

interface AdvancedKPIData {
  irr: number;
  total_roi: number;
  cash_on_cash_return: number;
  cap_rate: number;
  dscr: number;
  ltv_ratio: number;
  equity_multiple: number;
  cash_flow_per_unit: number;
  occupancy_rate: number;
  yield_on_cost: number;
  break_even_ratio: number;
  debt_yield: number;
}

interface AdvancedKPICardsProps {
  portfolioId: string;
  entityId?: string;
}

export default function AdvancedKPICards({ portfolioId, entityId }: AdvancedKPICardsProps) {
  const [kpiData, setKpiData] = useState<AdvancedKPIData | null>({
    irr: 0.095,
    total_roi: 0.187,
    cash_on_cash_return: 0.073,
    cap_rate: 0.048,
    dscr: 1.34,
    ltv_ratio: 0.73,
    equity_multiple: 1.62,
    cash_flow_per_unit: 315,
    occupancy_rate: 0.94,
    yield_on_cost: 0.052,
    break_even_ratio: 0.82,
    debt_yield: 0.089
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdvancedKPIs() {
      try {
        let url = `/api/v1/portfolios/${portfolioId}/kpi/advanced`;
        if (entityId) {
          url += `?entityId=${entityId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch advanced KPIs');
        }

        const data = await response.json();
        setKpiData(data.advanced_kpis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAdvancedKPIs();
  }, [portfolioId, entityId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Error loading advanced KPIs: {error}
        </div>
      </Card>
    );
  }

  if (!kpiData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No advanced KPI data available
        </div>
      </Card>
    );
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const getPerformanceBadge = (value: number, thresholds: { good: number; excellent: number }) => {
    if (value >= thresholds.excellent) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
    } else if (value >= thresholds.good) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Bon</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">À améliorer</Badge>;
    }
  };

  const kpiCards = [
    {
      title: 'IRR',
      value: formatPercentage(kpiData.irr),
      description: 'Taux de Rendement Interne',
      badge: getPerformanceBadge(kpiData.irr, { good: 0.08, excellent: 0.12 }),
      trend: kpiData.irr > 0.1 ? '↗' : kpiData.irr > 0.05 ? '→' : '↘',
      tooltip: 'TRI'
    },
    {
      title: 'ROI Total',
      value: formatPercentage(kpiData.total_roi),
      description: 'Retour sur Investissement',
      badge: getPerformanceBadge(kpiData.total_roi, { good: 0.15, excellent: 0.25 }),
      trend: kpiData.total_roi > 0.2 ? '↗' : kpiData.total_roi > 0.1 ? '→' : '↘'
    },
    {
      title: 'Cash-on-Cash',
      value: formatPercentage(kpiData.cash_on_cash_return),
      description: 'Rendement sur fonds propres',
      badge: getPerformanceBadge(kpiData.cash_on_cash_return, { good: 0.06, excellent: 0.10 }),
      trend: kpiData.cash_on_cash_return > 0.08 ? '↗' : kpiData.cash_on_cash_return > 0.04 ? '→' : '↘'
    },
    {
      title: 'Cap Rate',
      value: formatPercentage(kpiData.cap_rate),
      description: 'Taux de Capitalisation',
      badge: getPerformanceBadge(kpiData.cap_rate, { good: 0.04, excellent: 0.06 }),
      trend: kpiData.cap_rate > 0.05 ? '↗' : kpiData.cap_rate > 0.03 ? '→' : '↘'
    },
    {
      title: 'DSCR',
      value: formatNumber(kpiData.dscr),
      description: 'Ratio de Couverture de Dette',
      badge: getPerformanceBadge(kpiData.dscr, { good: 1.25, excellent: 1.5 }),
      trend: kpiData.dscr > 1.4 ? '↗' : kpiData.dscr > 1.1 ? '→' : '↘',
      tooltip: 'DSCR'
    },
    {
      title: 'LTV',
      value: formatPercentage(kpiData.ltv_ratio),
      description: 'Loan-to-Value Ratio',
      badge: kpiData.ltv_ratio < 0.7 ?
        <Badge className="bg-green-100 text-green-800 border-green-200">Conservateur</Badge> :
        kpiData.ltv_ratio < 0.8 ?
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Modéré</Badge> :
        <Badge className="bg-red-100 text-red-800 border-red-200">Élevé</Badge>,
      trend: kpiData.ltv_ratio < 0.7 ? '↗' : kpiData.ltv_ratio < 0.8 ? '→' : '↘',
      tooltip: 'LTV'
    },
    {
      title: 'Multiple d\'Équité',
      value: formatNumber(kpiData.equity_multiple) + 'x',
      description: 'Multiplicateur de capital',
      badge: getPerformanceBadge(kpiData.equity_multiple, { good: 1.5, excellent: 2.0 }),
      trend: kpiData.equity_multiple > 1.8 ? '↗' : kpiData.equity_multiple > 1.3 ? '→' : '↘'
    },
    {
      title: 'Cash Flow/Unité',
      value: formatCurrency(kpiData.cash_flow_per_unit),
      description: 'Cash Flow par bien',
      badge: getPerformanceBadge(kpiData.cash_flow_per_unit, { good: 200, excellent: 500 }),
      trend: kpiData.cash_flow_per_unit > 400 ? '↗' : kpiData.cash_flow_per_unit > 100 ? '→' : '↘'
    },
    {
      title: 'Taux d\'Occupation',
      value: formatPercentage(kpiData.occupancy_rate),
      description: 'Pourcentage d\'occupation',
      badge: getPerformanceBadge(kpiData.occupancy_rate, { good: 0.9, excellent: 0.95 }),
      trend: kpiData.occupancy_rate > 0.93 ? '↗' : kpiData.occupancy_rate > 0.85 ? '→' : '↘'
    },
    {
      title: 'Yield on Cost',
      value: formatPercentage(kpiData.yield_on_cost),
      description: 'Rendement sur coût',
      badge: getPerformanceBadge(kpiData.yield_on_cost, { good: 0.05, excellent: 0.07 }),
      trend: kpiData.yield_on_cost > 0.06 ? '↗' : kpiData.yield_on_cost > 0.04 ? '→' : '↘'
    },
    {
      title: 'Break Even Ratio',
      value: formatPercentage(kpiData.break_even_ratio),
      description: 'Ratio de point mort',
      badge: kpiData.break_even_ratio < 0.8 ?
        <Badge className="bg-green-100 text-green-800 border-green-200">Sécurisé</Badge> :
        kpiData.break_even_ratio < 0.9 ?
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Modéré</Badge> :
        <Badge className="bg-red-100 text-red-800 border-red-200">Risqué</Badge>,
      trend: kpiData.break_even_ratio < 0.8 ? '↗' : kpiData.break_even_ratio < 0.9 ? '→' : '↘'
    },
    {
      title: 'Debt Yield',
      value: formatPercentage(kpiData.debt_yield),
      description: 'Rendement de la dette',
      badge: getPerformanceBadge(kpiData.debt_yield, { good: 0.08, excellent: 0.12 }),
      trend: kpiData.debt_yield > 0.1 ? '↗' : kpiData.debt_yield > 0.06 ? '→' : '↘'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">KPIs Financiers Avancés</h3>
        <Badge variant="outline" className="text-xs">
          Mis à jour • {new Date().toLocaleDateString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.tooltip ? (
                    <TooltipMetric metric={kpi.tooltip as any} scope="portfolio">
                      {kpi.title}
                    </TooltipMetric>
                  ) : (
                    kpi.title
                  )}
                </CardTitle>
                <span className="text-lg">{kpi.trend}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {kpi.value}
                </div>
                <div className="text-xs text-gray-500">
                  {kpi.description}
                </div>
                <div className="flex justify-end">
                  {kpi.badge}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}