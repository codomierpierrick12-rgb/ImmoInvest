'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LTVTooltip, DSCRTooltip } from '@/components/ui/TooltipMetric';
import { cn } from '@/lib/utils';

interface KPIData {
  portfolio_kpi: {
    total_property_value: number;
    total_debt: number;
    net_worth: number;
    portfolio_ltv: number;
    total_annual_cashflow: number;
    total_monthly_cashflow: number;
    portfolio_gross_yield: number;
    portfolio_net_yield: number;
    active_properties: number;
    portfolio_capital_gain_percentage: number;
  };
}

interface KPICardsProps {
  portfolioId: string;
  className?: string;
  refreshTrigger?: number;
}

interface KPICardProps {
  title: string | React.ReactNode;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function KPICard({ title, value, subtitle, trend, icon, variant = 'default' }: KPICardProps) {
  const variantClasses = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50',
  };

  const variantTextClasses = {
    default: 'text-gray-900',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    danger: 'text-red-900',
  };

  return (
    <Card className={cn('relative overflow-hidden', variantClasses[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', variantTextClasses[variant])}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KPICards({ portfolioId, className, refreshTrigger }: KPICardsProps) {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/portfolios/${portfolioId}/kpi`);

        if (!response.ok) {
          throw new Error('Failed to fetch KPI data');
        }

        const data = await response.json();
        setKpiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchKPIData();
  }, [portfolioId, refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return formatCurrency(value);
  };

  if (loading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            Error loading KPI data: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpiData) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardContent>
          <div className="text-gray-500 text-center py-4">
            No KPI data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { portfolio_kpi } = kpiData;

  // Determine variants based on values
  const getLTVVariant = (ltv: number) => {
    if (ltv < 70) return 'success';
    if (ltv < 85) return 'warning';
    return 'danger';
  };

  const getCashFlowVariant = (cashflow: number) => {
    if (cashflow > 0) return 'success';
    if (cashflow > -500) return 'warning';
    return 'danger';
  };

  const getYieldVariant = (yield_value: number) => {
    if (yield_value > 6) return 'success';
    if (yield_value > 3) return 'default';
    return 'warning';
  };

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {/* Total Portfolio Value */}
      <KPICard
        title="Portfolio Value"
        value={formatLargeNumber(portfolio_kpi.total_property_value)}
        subtitle={`${portfolio_kpi.active_properties} properties`}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
          </svg>
        }
      />

      {/* Net Worth */}
      <KPICard
        title="Net Worth"
        value={formatLargeNumber(portfolio_kpi.net_worth)}
        subtitle={`Debt: ${formatLargeNumber(portfolio_kpi.total_debt)}`}
        variant={portfolio_kpi.net_worth > 0 ? 'success' : 'danger'}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        }
      />

      {/* LTV Ratio */}
      <KPICard
        title={<LTVTooltip scope="portfolio">LTV Ratio</LTVTooltip>}
        value={formatPercentage(portfolio_kpi.portfolio_ltv)}
        subtitle="Loan-to-Value"
        variant={getLTVVariant(portfolio_kpi.portfolio_ltv)}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />

      {/* Monthly Cash Flow */}
      <KPICard
        title="Monthly Cash Flow"
        value={formatCurrency(portfolio_kpi.total_monthly_cashflow)}
        subtitle={`Annual: ${formatCurrency(portfolio_kpi.total_annual_cashflow)}`}
        variant={getCashFlowVariant(portfolio_kpi.total_monthly_cashflow)}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />

      {/* Gross Yield */}
      <KPICard
        title="Gross Yield"
        value={formatPercentage(portfolio_kpi.portfolio_gross_yield)}
        subtitle="Before expenses"
        variant={getYieldVariant(portfolio_kpi.portfolio_gross_yield)}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        }
      />

      {/* Net Yield */}
      <KPICard
        title="Net Yield"
        value={formatPercentage(portfolio_kpi.portfolio_net_yield)}
        subtitle="After expenses"
        variant={getYieldVariant(portfolio_kpi.portfolio_net_yield)}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        }
      />

      {/* Capital Gain */}
      <KPICard
        title="Capital Gain"
        value={formatPercentage(portfolio_kpi.portfolio_capital_gain_percentage)}
        subtitle="Unrealized gain"
        variant={portfolio_kpi.portfolio_capital_gain_percentage > 0 ? 'success' : 'danger'}
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />

      {/* Property Count */}
      <KPICard
        title="Properties"
        value={portfolio_kpi.active_properties}
        subtitle="Active properties"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />
    </div>
  );
}