'use client';

import { useEffect, useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Alert,
  AlertSummary,
  ALERT_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS
} from '@/lib/types/alerts';

interface AlertCenterProps {
  portfolioId: string;
}

export default function AlertCenter({ portfolioId }: AlertCenterProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'critical'>('all');

  useEffect(() => {
    fetchAlerts();
  }, [portfolioId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [alertsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/v1/portfolios/${portfolioId}/alerts`),
        fetch(`/api/v1/portfolios/${portfolioId}/alerts/summary`)
      ]);

      if (!alertsResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const alertsData = await alertsResponse.json();
      const summaryData = await summaryResponse.json();

      setAlerts(alertsData.alerts);
      setAlertSummary(summaryData.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert =>
          alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
        ));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/alerts/${alertId}/resolve`, {
        method: 'POST'
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert =>
          alert.id === alertId ? { ...alert, status: 'resolved' } : alert
        ));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'active':
        return alert.status === 'active';
      case 'critical':
        return alert.severity === 'critical';
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Chargement des alertes...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Erreur lors du chargement des alertes: {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {alertSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="text-2xl font-bold">{alertSummary.total_alerts}</div>
                  <div className="text-sm text-gray-600">Total Alertes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔴</span>
                <div>
                  <div className="text-2xl font-bold text-red-600">{alertSummary.active_alerts}</div>
                  <div className="text-sm text-gray-600">Actives</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="text-2xl font-bold text-red-800">{alertSummary.critical_alerts}</div>
                  <div className="text-sm text-gray-600">Critiques</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📈</span>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((alertSummary.total_alerts - alertSummary.active_alerts) / Math.max(alertSummary.total_alerts, 1) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Résolues</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Centre d'Alertes</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Toutes ({alerts.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Actives ({alerts.filter(a => a.status === 'active').length})
              </Button>
              <Button
                variant={filter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('critical')}
              >
                Critiques ({alerts.filter(a => a.severity === 'critical').length})
              </Button>
              <Button variant="outline" size="sm" onClick={fetchAlerts}>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === 'all' ? 'Aucune alerte' : `Aucune alerte ${filter === 'active' ? 'active' : 'critique'}`}
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4" style={{
                  borderLeftColor: alert.severity === 'critical' ? '#dc2626' :
                                   alert.severity === 'high' ? '#ea580c' :
                                   alert.severity === 'medium' ? '#d97706' : '#2563eb'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <Badge className={SEVERITY_COLORS[alert.severity]}>
                            {SEVERITY_LABELS[alert.severity]}
                          </Badge>
                          <Badge variant="outline">
                            {ALERT_TYPE_LABELS[alert.type]}
                          </Badge>
                          <Badge
                            className={
                              alert.status === 'active' ? 'bg-red-100 text-red-800' :
                              alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {alert.status === 'active' ? 'Active' :
                             alert.status === 'acknowledged' ? 'Reconnue' : 'Résolue'}
                          </Badge>
                        </div>

                        <p className="text-gray-600 mb-2">{alert.description}</p>

                        {alert.recommendation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                            <p className="text-sm text-blue-800">
                              <strong>Recommandation:</strong> {alert.recommendation}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Créée le {formatDate(alert.created_at)}</span>
                          {alert.property_id && (
                            <span>Bien concerné: {alert.property_id}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Reconnaître
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Résoudre
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Résoudre
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}