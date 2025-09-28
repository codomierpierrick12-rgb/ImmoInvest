'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PortfolioAnalysis {
  performance_summary: {
    total_investment: number;
    current_value: number;
    total_return: number;
    annualized_return: number;
    risk_score: number;
    sharpe_ratio: number;
  };
  risk_analysis: {
    volatility: number;
    max_drawdown: number;
    value_at_risk: number;
    concentration_risk: number;
    liquidity_risk: number;
    market_risk: number;
  };
  diversification: {
    geographic_score: number;
    property_type_score: number;
    tenant_diversification: number;
    overall_diversification: number;
  };
  cash_flow_analysis: {
    monthly_cash_flow: number;
    cash_flow_stability: number;
    growth_trend: number;
    seasonal_variance: number;
  };
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potential_impact: number;
  }>;
  benchmarks: {
    vs_market_index: number;
    vs_real_estate_sector: number;
    vs_risk_free_rate: number;
  };
}

interface PortfolioAnalysisReportProps {
  portfolioId: string;
}

export default function PortfolioAnalysisReport({ portfolioId }: PortfolioAnalysisReportProps) {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolioAnalysis() {
      try {
        const response = await fetch(`/api/v1/portfolios/${portfolioId}/reports/analysis`);
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio analysis');
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolioAnalysis();
  }, [portfolioId]);

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

  const getRiskBadge = (score: number) => {
    if (score < 0.3) return <Badge className="bg-green-100 text-green-800">Faible</Badge>;
    if (score < 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Modéré</Badge>;
    return <Badge className="bg-red-100 text-red-800">Élevé</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportReport = () => {
    // Simulate report export
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-analysis-${portfolioId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Génération du rapport d'analyse...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Erreur lors du chargement de l'analyse: {error}
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Aucune donnée d'analyse disponible
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Rapport d'Analyse du Portefeuille</h2>
        <Button onClick={exportReport} variant="outline">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter le rapport
        </Button>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Analyse de Risque</TabsTrigger>
          <TabsTrigger value="diversification">Diversification</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Investissement Total</div>
                  <div className="text-2xl font-bold">{formatCurrency(analysis.performance_summary.total_investment)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Valeur Actuelle</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(analysis.performance_summary.current_value)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rendement Total</div>
                  <div className="text-2xl font-bold">{formatPercentage(analysis.performance_summary.total_return)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rendement Annualisé</div>
                  <div className="text-2xl font-bold">{formatPercentage(analysis.performance_summary.annualized_return)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Score de Risque</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{(analysis.performance_summary.risk_score * 100).toFixed(0)}/100</span>
                    {getRiskBadge(analysis.performance_summary.risk_score)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ratio de Sharpe</div>
                  <div className="text-2xl font-bold">{analysis.performance_summary.sharpe_ratio.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison avec les Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>vs. Indice de Marché</span>
                  <span className={`font-semibold ${analysis.benchmarks.vs_market_index > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analysis.benchmarks.vs_market_index > 0 ? '+' : ''}{formatPercentage(analysis.benchmarks.vs_market_index)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>vs. Secteur Immobilier</span>
                  <span className={`font-semibold ${analysis.benchmarks.vs_real_estate_sector > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analysis.benchmarks.vs_real_estate_sector > 0 ? '+' : ''}{formatPercentage(analysis.benchmarks.vs_real_estate_sector)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>vs. Taux Sans Risque</span>
                  <span className={`font-semibold ${analysis.benchmarks.vs_risk_free_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analysis.benchmarks.vs_risk_free_rate > 0 ? '+' : ''}{formatPercentage(analysis.benchmarks.vs_risk_free_rate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de Risque Détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Volatilité</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{formatPercentage(analysis.risk_analysis.volatility)}</span>
                    {getRiskBadge(analysis.risk_analysis.volatility)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Drawdown Maximum</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{formatPercentage(analysis.risk_analysis.max_drawdown)}</span>
                    {getRiskBadge(analysis.risk_analysis.max_drawdown)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Value at Risk (95%)</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{formatPercentage(analysis.risk_analysis.value_at_risk)}</span>
                    {getRiskBadge(analysis.risk_analysis.value_at_risk)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Risque de Concentration</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{formatPercentage(analysis.risk_analysis.concentration_risk)}</span>
                    {getRiskBadge(analysis.risk_analysis.concentration_risk)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Risque de Liquidité</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{formatPercentage(analysis.risk_analysis.liquidity_risk)}</span>
                    {getRiskBadge(analysis.risk_analysis.liquidity_risk)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Risque de Marché</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{formatPercentage(analysis.risk_analysis.market_risk)}</span>
                    {getRiskBadge(analysis.risk_analysis.market_risk)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diversification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de Diversification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Diversification Géographique</div>
                  <div className="text-xl font-bold">{(analysis.diversification.geographic_score * 100).toFixed(0)}/100</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analysis.diversification.geographic_score * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Diversification par Type</div>
                  <div className="text-xl font-bold">{(analysis.diversification.property_type_score * 100).toFixed(0)}/100</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${analysis.diversification.property_type_score * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Diversification Locataires</div>
                  <div className="text-xl font-bold">{(analysis.diversification.tenant_diversification * 100).toFixed(0)}/100</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${analysis.diversification.tenant_diversification * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Score Global</div>
                  <div className="text-xl font-bold">{(analysis.diversification.overall_diversification * 100).toFixed(0)}/100</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${analysis.diversification.overall_diversification * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {analysis.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                      <Badge variant="outline">
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                  <div className="text-sm">
                    <span className="font-semibold">Impact Potentiel: </span>
                    <span className="text-green-600">+{formatPercentage(rec.potential_impact)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}