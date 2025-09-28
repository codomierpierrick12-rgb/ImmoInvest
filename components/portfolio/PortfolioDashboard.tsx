'use client';

import { useEffect, useState } from 'react';
import { Portfolio } from '@/lib/types/database';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KPICards from '@/components/kpi/KPICards';
import PropertyList from '@/components/property/PropertyList';
import PropertyForm from '@/components/PropertyForm';
import EntitySelector from '@/components/entities/EntitySelector';
import EntityManager from '@/components/entities/EntityManager';
import FiscalKPICards from '@/components/kpi/FiscalKPICards';
import AdvancedKPICards from '@/components/kpi/AdvancedKPICards';
import TransactionManager from '@/components/transactions/TransactionManager';
import TaxOptimizationDashboard from '@/components/optimization/TaxOptimizationDashboard';
import PortfolioAnalysisReport from '@/components/reports/PortfolioAnalysisReport';
import AlertCenter from '@/components/alerts/AlertCenter';
import PropertyComparator from '@/components/comparison/PropertyComparator';
import { FiscalRegime } from '@/lib/types/fiscal';

interface LegalEntity {
  id: string;
  name: string;
  type: FiscalRegime;
  properties_count?: number;
  incorporation_date?: string | null;
  created_at: string;
}

interface PortfolioDashboardProps {
  userId: string;
}

export default function PortfolioDashboard({ userId }: PortfolioDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([{
    id: 'portfolio-demo',
    user_id: userId,
    name: 'Portfolio Principal',
    description: 'Portfolio de démonstration Stoneverse',
    created_at: new Date().toISOString()
  }]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>({
    id: 'portfolio-demo',
    user_id: userId,
    name: 'Portfolio Principal',
    description: 'Portfolio de démonstration Stoneverse',
    created_at: new Date().toISOString()
  });
  const [selectedEntity, setSelectedEntity] = useState<LegalEntity | null>({
    id: 'entity-lmnp',
    name: 'LMNP Personnel',
    type: 'lmnp',
    properties_count: 2,
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPortfolios() {
      try {
        const response = await fetch('/api/v1/portfolios');

        if (!response.ok) {
          throw new Error('Failed to fetch portfolios');
        }

        const data = await response.json();
        setPortfolios(data.portfolios);

        // Auto-select first portfolio if available
        if (data.portfolios && data.portfolios.length > 0) {
          setSelectedPortfolio(data.portfolios[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolios();
  }, [userId]);

  // Fetch properties when portfolio is selected
  useEffect(() => {
    async function fetchProperties() {
      if (!selectedPortfolio) return;

      try {
        const response = await fetch(`/api/v1/portfolios/${selectedPortfolio.id}/properties`);
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    }

    fetchProperties();
  }, [selectedPortfolio]);

  const handlePortfolioSelect = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setSelectedEntity(null); // Reset entity selection when portfolio changes
  };

  const handleEntitySelect = (entity: LegalEntity) => {
    setSelectedEntity(entity);
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowPropertyForm(true);
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    setShowPropertyForm(true);
  };

  const handleSaveProperty = async (propertyData: any) => {
    try {
      if (!selectedPortfolio) return;

      const response = await fetch(`/api/v1/portfolios/${selectedPortfolio.id}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      if (response.ok) {
        setShowPropertyForm(false);
        setEditingProperty(null);
        // Refresh the properties list would happen here
        console.log('Property saved successfully');
      }
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleCancelProperty = () => {
    setShowPropertyForm(false);
    setEditingProperty(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stoneverse</h1>
          <p className="text-gray-600 mt-2">
            Own your property universe. Simulate. Compare. Decide.
          </p>
        </div>

        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No portfolios found</div>
          <Button>
            Create Your First Portfolio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stoneverse</h1>
              <p className="text-gray-600 mt-1">
                Own your property universe. Simulate. Compare. Decide.
              </p>
            </div>

            {portfolios.length > 1 && (
              <div className="flex gap-2">
                {portfolios.map((portfolio) => (
                  <Button
                    key={portfolio.id}
                    variant={selectedPortfolio?.id === portfolio.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePortfolioSelect(portfolio)}
                  >
                    {portfolio.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Content with Tabs */}
      {selectedPortfolio && (
        <Tabs defaultValue="overview" className="w-full">
          {/* Navigation Tabs */}
          <div className="border-t bg-gray-50">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-8 bg-transparent h-auto p-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  📊 Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger
                  value="properties"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  🏠 Biens immobiliers
                </TabsTrigger>
                <TabsTrigger
                  value="entities"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  🏛️ Entités légales
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  💰 Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  📊 Comparateur
                </TabsTrigger>
                <TabsTrigger
                  value="optimization"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  🏛️ Optimisation Fiscale
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  🚨 Alertes
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
                >
                  📈 Rapports
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Portfolio Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedPortfolio.name}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {selectedPortfolio.base_currency} • Created {new Date(selectedPortfolio.created_at).toLocaleDateString()}
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Entity Selection */}
              <div>
                <EntitySelector
                  portfolioId={selectedPortfolio.id}
                  selectedEntity={selectedEntity}
                  onEntitySelect={handleEntitySelect}
                />
              </div>

              {/* KPI Cards */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Performance</h2>
                <KPICards portfolioId={selectedPortfolio.id} />
              </div>

              {/* Fiscal KPIs */}
              {selectedEntity && (
                <div>
                  <FiscalKPICards
                    portfolioId={selectedPortfolio.id}
                    entityId={selectedEntity.id}
                  />
                </div>
              )}

              {/* Advanced Financial KPIs */}
              <div>
                <AdvancedKPICards
                  portfolioId={selectedPortfolio.id}
                  entityId={selectedEntity?.id}
                />
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col" onClick={handleAddProperty}>
                      <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Property
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Add Transaction
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Create Scenario
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <PropertyList
                portfolioId={selectedPortfolio.id}
                onPropertySelect={handleEditProperty}
                onAddProperty={handleAddProperty}
                onEditProperty={handleEditProperty}
                onDeleteProperty={() => {
                  // Refresh properties list when a property is deleted
                  // This could be improved with a callback
                  console.log('Property deleted, refreshing...');
                }}
              />
            </TabsContent>

            <TabsContent value="entities" className="space-y-4">
              <EntityManager
                portfolioId={selectedPortfolio.id}
                selectedEntity={selectedEntity}
                onEntitySelect={handleEntitySelect}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionManager
                portfolioId={selectedPortfolio.id}
                properties={properties.map(p => ({
                  id: p.id,
                  address: p.address,
                  city: p.city
                }))}
              />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <PropertyComparator portfolioId={selectedPortfolio.id} />
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <TaxOptimizationDashboard portfolioId={selectedPortfolio.id} />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <AlertCenter portfolioId={selectedPortfolio.id} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <PortfolioAnalysisReport portfolioId={selectedPortfolio.id} />
            </TabsContent>
          </div>
        </Tabs>
      )}

      {showPropertyForm && (
        <PropertyForm
          property={editingProperty}
          onSave={handleSaveProperty}
          onCancel={handleCancelProperty}
        />
      )}
    </div>
  );
}