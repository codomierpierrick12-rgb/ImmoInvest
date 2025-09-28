'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PropertyComparison,
  ComparisonReport,
  COMPARISON_PRESETS,
  METRIC_CATEGORIES
} from '@/lib/types/comparison';

interface PropertyComparatorProps {
  portfolioId: string;
}

export default function PropertyComparator({ portfolioId }: PropertyComparatorProps) {
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  useEffect(() => {
    fetchComparison();
  }, [portfolioId, selectedPreset]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/comparison?preset=${selectedPreset}`);

      if (!response.ok) {
        throw new Error('Failed to fetch property comparison');
      }

      const data = await response.json();
      setComparisonReport(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIndicator = (value: number) => {
    if (value > 0.1) return { icon: '📈', color: 'text-green-600', label: `+${formatPercentage(value)}` };
    if (value > 0) return { icon: '🔼', color: 'text-green-500', label: `+${formatPercentage(value)}` };
    if (value > -0.1) return { icon: '🔽', color: 'text-red-500', label: formatPercentage(value) };
    return { icon: '📉', color: 'text-red-600', label: formatPercentage(value) };
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-green-100 text-green-800 border-green-200';
      case 'hold': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sell': return 'bg-red-100 text-red-800 border-red-200';
      case 'improve': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Analyse comparative en cours...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Erreur lors de l'analyse comparative: {error}
        </div>
      </Card>
    );
  }

  if (!comparisonReport) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Aucune donnée de comparaison disponible
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Presets */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Comparateur de Biens</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Profil d'analyse:</span>
          {Object.entries(COMPARISON_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant={selectedPreset === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPreset(key)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-sm text-gray-600">Meilleur Global</div>
                <div className="font-semibold">{comparisonReport.summary.best_performer.overall.address}</div>
                <div className="text-sm text-green-600">
                  Score: {comparisonReport.summary.best_performer.overall.overall_score.toFixed(0)}/100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-sm text-gray-600">Meilleur Financier</div>
                <div className="font-semibold">{comparisonReport.summary.best_performer.financial.address}</div>
                <div className="text-sm text-green-600">
                  Score: {comparisonReport.summary.best_performer.financial.financial_score.toFixed(0)}/100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="text-sm text-gray-600">Meilleur Risque/Rendement</div>
                <div className="font-semibold">{comparisonReport.summary.best_performer.risk_adjusted.address}</div>
                <div className="text-sm text-blue-600">
                  Équilibré: {((comparisonReport.summary.best_performer.risk_adjusted.financial_score * comparisonReport.summary.best_performer.risk_adjusted.risk_score) / 100).toFixed(0)}/100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-sm text-gray-600">Meilleur Emplacement</div>
                <div className="font-semibold">{comparisonReport.summary.best_performer.location.address}</div>
                <div className="text-sm text-purple-600">
                  Score: {comparisonReport.summary.best_performer.location.location_score.toFixed(0)}/100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Tableau Comparatif</TabsTrigger>
          <TabsTrigger value="insights">Insights Portfolio</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison Détaillée ({comparisonReport.properties.length} biens)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Bien</th>
                      <th className="text-right p-2">Score Global</th>
                      <th className="text-right p-2">Rendement</th>
                      <th className="text-right p-2">Cash Flow</th>
                      <th className="text-right p-2">IRR</th>
                      <th className="text-right p-2">Risque</th>
                      <th className="text-right p-2">Emplacement</th>
                      <th className="text-right p-2">vs Portfolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonReport.properties.map((property, index) => (
                      <tr key={property.property_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{property.address}</div>
                            <div className="text-xs text-gray-500">{property.city} • {formatCurrency(property.current_value)}</div>
                          </div>
                        </td>
                        <td className="text-right p-2">
                          <Badge className={getScoreColor(property.overall_score)}>
                            {property.overall_score.toFixed(0)}/100
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          <div>{formatPercentage(property.rental_yield)}</div>
                          <div className="text-xs text-gray-500">
                            {getPerformanceIndicator(property.vs_portfolio_avg.yield).icon}
                            <span className={getPerformanceIndicator(property.vs_portfolio_avg.yield).color}>
                              {getPerformanceIndicator(property.vs_portfolio_avg.yield).label}
                            </span>
                          </div>
                        </td>
                        <td className="text-right p-2">
                          <div>{formatCurrency(property.monthly_cash_flow)}</div>
                          <div className="text-xs text-gray-500">
                            {getPerformanceIndicator(property.vs_portfolio_avg.cash_flow).icon}
                            <span className={getPerformanceIndicator(property.vs_portfolio_avg.cash_flow).color}>
                              {getPerformanceIndicator(property.vs_portfolio_avg.cash_flow).label}
                            </span>
                          </div>
                        </td>
                        <td className="text-right p-2">
                          {formatPercentage(property.irr)}
                        </td>
                        <td className="text-right p-2">
                          <Badge className={getScoreColor(property.risk_score)}>
                            {property.risk_score.toFixed(0)}
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          <Badge className={getScoreColor(property.location_score)}>
                            {property.location_score.toFixed(0)}
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          <div className="text-xs">
                            <div className={getPerformanceIndicator(property.vs_portfolio_avg.roi).color}>
                              ROI {getPerformanceIndicator(property.vs_portfolio_avg.roi).label}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Insights du Portefeuille</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Nombre de biens:</span>
                  <span className="font-semibold">{comparisonReport.summary.portfolio_insights.total_properties}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valeur totale:</span>
                  <span className="font-semibold">{formatCurrency(comparisonReport.summary.portfolio_insights.total_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rendement moyen:</span>
                  <span className="font-semibold">{formatPercentage(comparisonReport.summary.portfolio_insights.avg_yield)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash flow moyen:</span>
                  <span className="font-semibold">{formatCurrency(comparisonReport.summary.portfolio_insights.avg_cash_flow)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Score de diversification:</span>
                  <span className="font-semibold">
                    <Badge className={getScoreColor(comparisonReport.summary.portfolio_insights.diversification_score)}>
                      {comparisonReport.summary.portfolio_insights.diversification_score.toFixed(0)}/100
                    </Badge>
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contexte de Marché</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Conditions de marché:</span>
                  <Badge className={
                    comparisonReport.market_context.market_conditions === 'bullish' ? 'bg-green-100 text-green-800' :
                    comparisonReport.market_context.market_conditions === 'bearish' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {comparisonReport.market_context.market_conditions === 'bullish' ? 'Haussier' :
                     comparisonReport.market_context.market_conditions === 'bearish' ? 'Baissier' : 'Neutre'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tendance taux d'intérêt:</span>
                  <span className="font-semibold">{comparisonReport.market_context.interest_rate_trend === 'stable' ? 'Stable' : comparisonReport.market_context.interest_rate_trend}</span>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Zones d'investissement recommandées:</div>
                  <div className="flex flex-wrap gap-1">
                    {comparisonReport.market_context.best_investment_areas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Opportunités émergentes:</div>
                  <div className="flex flex-wrap gap-1">
                    {comparisonReport.market_context.emerging_opportunities.map((opportunity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {opportunity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommandations d'Actions ({comparisonReport.summary.recommendations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonReport.summary.recommendations.map((rec, index) => (
                  <Card key={index} className="border-l-4" style={{
                    borderLeftColor: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#d97706' : '#2563eb'
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getRecommendationColor(rec.type)}>
                              {rec.type === 'buy' ? 'Acheter' :
                               rec.type === 'hold' ? 'Conserver' :
                               rec.type === 'sell' ? 'Vendre' : 'Améliorer'}
                            </Badge>
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Faible'}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{rec.reasoning}</p>
                          <div className="text-sm text-green-600">
                            <strong>Impact potentiel:</strong> {formatCurrency(rec.potential_impact)}/an
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}