'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calculator,
  Target,
  BarChart3,
  PieChart,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxOptimizationDashboardProps {
  portfolioId: string;
  className?: string;
}

interface OptimizationSuggestion {
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

interface RegimeComparison {
  regime: string;
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

interface ScenarioResult {
  name: string;
  initial_investment: number;
  projected_annual_return: number;
  irr: number;
  break_even_year: number;
  total_return_10_years: number;
  risk_level: 'low' | 'medium' | 'high';
}

export default function TaxOptimizationDashboard({
  portfolioId,
  className
}: TaxOptimizationDashboardProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [regimeComparisons, setRegimeComparisons] = useState<RegimeComparison[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    fetchOptimizationData();
  }, [portfolioId]);

  const fetchOptimizationData = async () => {
    try {
      setLoading(true);

      // Fetch optimization suggestions
      const suggestionsResponse = await fetch(`/api/v1/portfolios/${portfolioId}/optimization/suggestions`);
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData.suggestions || []);
      }

      // Fetch regime comparisons
      const regimeResponse = await fetch(`/api/v1/portfolios/${portfolioId}/optimization/regime-comparison`);
      if (regimeResponse.ok) {
        const regimeData = await regimeResponse.json();
        setRegimeComparisons(regimeData.comparisons || []);
      }

      // Fetch scenario analysis
      const scenarioResponse = await fetch(`/api/v1/portfolios/${portfolioId}/optimization/scenarios`);
      if (scenarioResponse.ok) {
        const scenarioData = await scenarioResponse.json();
        setScenarios(scenarioData.scenarios || []);
      }
    } catch (error) {
      console.error('Error fetching optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getEffortBadgeVariant = (effort: string) => {
    switch (effort) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Économies potentielles</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(suggestions.reduce((sum, s) => sum + s.potential_savings, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suggestions actives</p>
                <p className="text-2xl font-bold">{suggestions.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priorité haute</p>
                <p className="text-2xl font-bold text-red-600">
                  {suggestions.filter(s => s.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score optimisation</p>
                <p className="text-2xl font-bold text-blue-600">
                  {regimeComparisons.length > 0 ? Math.round(regimeComparisons[0].overall_score) : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="regimes">Comparaison régimes</TabsTrigger>
          <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
          <TabsTrigger value="analysis">Analyse avancée</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Optimisations recommandées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune suggestion d'optimisation disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(suggestion.priority)}
                            <h4 className="font-semibold">{suggestion.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityVariant(suggestion.priority)}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <Badge variant={getEffortBadgeVariant(suggestion.implementation_effort)}>
                              {suggestion.implementation_effort === 'low' ? 'Facile' :
                               suggestion.implementation_effort === 'medium' ? 'Moyen' : 'Complexe'}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3">{suggestion.description}</p>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h5 className="font-medium mb-2">Économies potentielles</h5>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(suggestion.potential_savings)}/an
                            </p>
                          </div>

                          <div>
                            <h5 className="font-medium mb-2">Bénéfices</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {suggestion.detailed_analysis.benefits.map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Timeline: {suggestion.detailed_analysis.timeline}
                            </span>
                            <Button size="sm">
                              Voir les détails
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regimes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparaison des régimes fiscaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              {regimeComparisons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune comparaison disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {regimeComparisons.map((regime, index) => (
                    <Card key={regime.regime} className={cn(
                      "border-2",
                      index === 0 ? "border-green-500 bg-green-50" : ""
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg">{regime.entity_name}</h4>
                          {index === 0 && (
                            <Badge className="bg-green-600">Recommandé</Badge>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Charge fiscale</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(regime.annual_tax_burden)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Taux effectif</p>
                            <p className="text-xl font-bold">
                              {regime.effective_tax_rate.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Cash-flow</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(regime.cash_flow_impact)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Score global</p>
                            <p className="text-xl font-bold text-blue-600">
                              {Math.round(regime.overall_score)}%
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
                          <div>
                            <h5 className="font-medium mb-2 text-green-700">Avantages</h5>
                            <ul className="list-disc list-inside text-sm">
                              {regime.pros.map((pro, i) => (
                                <li key={i}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2 text-red-700">Inconvénients</h5>
                            <ul className="list-disc list-inside text-sm">
                              {regime.cons.map((con, i) => (
                                <li key={i}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulateurs de scénarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Nouveau bien immobilier
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <PieChart className="h-6 w-6 mb-2" />
                  Rééquilibrage portefeuille
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Projection 10 ans
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  Optimisation fiscale
                </Button>
              </div>

              {scenarios.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Scénarios récents</h4>
                  <div className="space-y-3">
                    {scenarios.map((scenario, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{scenario.name}</h5>
                              <p className="text-sm text-muted-foreground">
                                Investment: {formatCurrency(scenario.initial_investment)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                TRI: {scenario.irr.toFixed(1)}%
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Break-even: {scenario.break_even_year} ans
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de sensibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Impact des variations de marché sur votre portefeuille
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Scénario optimiste (+20%)</span>
                    <span className="font-semibold text-green-600">+15,2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scénario réaliste</span>
                    <span className="font-semibold">+8,7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scénario pessimiste (-20%)</span>
                    <span className="font-semibold text-red-600">+2,1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommandations stratégiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Diversification géographique optimale</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Concentration LMNP à rééquilibrer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Opportunité SCI IS identifiée</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}