'use client';

import { useEffect, useState } from 'react';
import { Portfolio } from '@/lib/types/database';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import KPICards from '@/components/kpi/KPICards';
import PropertyList from '@/components/property/PropertyList';

interface PortfolioDashboardProps {
  userId: string;
}

export default function PortfolioDashboard({ userId }: PortfolioDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handlePortfolioSelect = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
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
          <h1 className="text-3xl font-bold text-gray-900">Real Estate Portfolio</h1>
          <p className="text-gray-600 mt-2">
            Manage and analyze your property investments
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
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real Estate Portfolio</h1>
          <p className="text-gray-600 mt-2">
            Manage and analyze your property investments
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

      {/* Selected Portfolio Content */}
      {selectedPortfolio && (
        <>
          {/* Portfolio Header */}
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

          {/* KPI Cards */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Performance</h2>
            <KPICards portfolioId={selectedPortfolio.id} />
          </div>

          {/* Properties List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Properties</h2>
            <PropertyList
              portfolioId={selectedPortfolio.id}
              onAddProperty={() => {
                // TODO: Implement add property modal
                console.log('Add property clicked');
              }}
            />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
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
        </>
      )}
    </div>
  );
}