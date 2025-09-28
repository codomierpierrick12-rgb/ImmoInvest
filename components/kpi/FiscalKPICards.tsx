'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calculator, TrendingUp, TrendingDown, Receipt, Coins } from 'lucide-react';
import { FiscalRegime } from '@/lib/types/fiscal';

interface FiscalKPIData {
  entity_summary: {
    entity_id: string;
    entity_name: string;
    entity_type: FiscalRegime;
    calculation_year: number;
    total_properties: number;
    aggregated_results: {
      total_rental_income: number;
      total_expenses: number;
      total_depreciation: number;
      total_taxable_result: number;
      total_tax_due: number;
    };
  };
}

interface FiscalKPICardsProps {
  portfolioId: string;
  entityId: string;
  year?: number;
  className?: string;
}

interface FiscalKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  regime?: FiscalRegime;
}

function FiscalKPICard({ title, value, subtitle, icon, variant = 'default', regime }: FiscalKPICardProps) {
  const variantClasses = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    danger: 'border-red-200 bg-red-50/50',
  };

  const valueClasses = {
    default: 'text-foreground',
    success: 'text-green-700',
    warning: 'text-orange-700',
    danger: 'text-red-700',
  };

  return (
    <Card className={cn('relative', variantClasses[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold font-tabular', valueClasses[variant])}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {regime && (
          <Badge
            variant={regime === 'lmnp' ? 'secondary' : regime === 'sci_is' ? 'destructive' : 'outline'}
            className="absolute top-2 right-2 text-xs"
          >
            {regime === 'lmnp' ? 'LMNP' : regime === 'sci_is' ? 'SCI IS' : 'PERSO'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function FiscalKPICards({
  portfolioId,
  entityId,
  year = new Date().getFullYear(),
  className
}: FiscalKPICardsProps) {
  const [fiscalData, setFiscalData] = useState<FiscalKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFiscalData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/v1/portfolios/${portfolioId}/entities/${entityId}/fiscal`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              year: year,
              calculation_type: 'annual_result',
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch fiscal data');
        }

        const data = await response.json();
        setFiscalData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (entityId) {
      fetchFiscalData();
    }
  }, [portfolioId, entityId, year]);

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

  if (loading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive bg-destructive/5', className)}>
        <CardContent className="pt-6">
          <div className="text-destructive text-center py-4">
            Erreur lors du chargement des données fiscales : {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fiscalData) {
    return (
      <Card className={cn('border-muted', className)}>
        <CardContent className="pt-6">
          <div className="text-muted-foreground text-center py-4">
            Aucune donnée fiscale disponible pour cette entité
          </div>
        </CardContent>
      </Card>
    );
  }

  const { entity_summary } = fiscalData;
  const { aggregated_results } = entity_summary;

  // Calculate derived metrics
  const operatingResult = aggregated_results.total_rental_income - aggregated_results.total_expenses;
  const effectiveTaxRate = aggregated_results.total_taxable_result > 0 ?
    (aggregated_results.total_tax_due / aggregated_results.total_taxable_result) * 100 : 0;
  const netResult = aggregated_results.total_taxable_result - aggregated_results.total_tax_due;

  // Determine variants based on values
  const getResultVariant = (result: number) => {
    if (result > 0) return 'success';
    if (result < 0) return 'danger';
    return 'default';
  };

  const getTaxVariant = (taxRate: number) => {
    if (taxRate > 30) return 'danger';
    if (taxRate > 15) return 'warning';
    return 'success';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Entity Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fiscalité {entity_summary.entity_name}</h3>
          <p className="text-sm text-muted-foreground">
            Exercice {entity_summary.calculation_year} • {entity_summary.total_properties} bien(s)
          </p>
        </div>
        <Badge
          variant={entity_summary.entity_type === 'lmnp' ? 'secondary' : 'destructive'}
          className="text-sm"
        >
          {entity_summary.entity_type === 'lmnp' ? 'LMNP' : 'SCI IS'}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Revenus Locatifs */}
        <FiscalKPICard
          title="Revenus Locatifs"
          value={formatCurrency(aggregated_results.total_rental_income)}
          subtitle="Revenus bruts"
          icon={<Receipt className="h-4 w-4" />}
          variant="success"
          regime={entity_summary.entity_type}
        />

        {/* Charges Déductibles */}
        <FiscalKPICard
          title="Charges Déductibles"
          value={formatCurrency(aggregated_results.total_expenses)}
          subtitle="Hors amortissements"
          icon={<TrendingDown className="h-4 w-4" />}
          variant="warning"
        />

        {/* Amortissements */}
        <FiscalKPICard
          title="Amortissements"
          value={formatCurrency(aggregated_results.total_depreciation)}
          subtitle={entity_summary.entity_type === 'lmnp' ? 'Limité au résultat' : 'Déductible intégralement'}
          icon={<Calculator className="h-4 w-4" />}
          variant="default"
        />

        {/* Résultat Fiscal */}
        <FiscalKPICard
          title="Résultat Fiscal"
          value={formatCurrency(aggregated_results.total_taxable_result)}
          subtitle={aggregated_results.total_taxable_result < 0 ? 'Déficit reportable' : 'Base imposable'}
          icon={<TrendingUp className="h-4 w-4" />}
          variant={getResultVariant(aggregated_results.total_taxable_result)}
        />

        {/* Impôt Dû */}
        <FiscalKPICard
          title={entity_summary.entity_type === 'sci_is' ? 'IS Dû' : 'Impact IR'}
          value={formatCurrency(aggregated_results.total_tax_due)}
          subtitle={`Taux effectif: ${formatPercentage(effectiveTaxRate)}`}
          icon={<Coins className="h-4 w-4" />}
          variant={getTaxVariant(effectiveTaxRate)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résultat Opérationnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenus</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(aggregated_results.total_rental_income)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Charges</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(aggregated_results.total_expenses)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Résultat avant amortissements</span>
                  <span className={operatingResult >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(operatingResult)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impact Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amortissements déduits</span>
                <span className="font-medium">
                  -{formatCurrency(aggregated_results.total_depreciation)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Base imposable</span>
                <span className="font-medium">
                  {formatCurrency(aggregated_results.total_taxable_result)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Résultat net d'impôt</span>
                  <span className={netResult >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(netResult)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entity-specific Information */}
      {entity_summary.entity_type === 'lmnp' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <Receipt className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Régime LMNP</h4>
                <p className="text-sm text-amber-700">
                  Les amortissements ne peuvent pas créer de déficit BIC.
                  Le résultat s'intègre dans votre déclaration d'impôt sur le revenu.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {entity_summary.entity_type === 'sci_is' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Coins className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Régime SCI IS</h4>
                <p className="text-sm text-blue-700">
                  Taux réduit IS 15% jusqu'à 42 500€, puis 25%.
                  Les déficits sont reportables sans limitation de durée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}