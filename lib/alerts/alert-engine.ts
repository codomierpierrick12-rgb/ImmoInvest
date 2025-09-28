import {
  Alert,
  AlertRule,
  AlertType,
  AlertSeverity,
  AlertSummary,
  DEFAULT_ALERT_RULES
} from '@/lib/types/alerts';

interface KPIData {
  irr: number;
  cash_on_cash_return: number;
  cap_rate: number;
  dscr: number;
  ltv_ratio: number;
  occupancy_rate: number;
  monthly_cash_flow: number;
  break_even_ratio: number;
  debt_yield: number;
}

interface PropertyData {
  id: string;
  address: string;
  current_value: number;
  rental_price: number;
  last_maintenance_date?: string;
  lease_end_date?: string;
  occupancy_status: 'occupied' | 'vacant' | 'partial';
}

/**
 * Stoneverse Alert Engine
 * Intelligent monitoring and alerting system for real estate portfolios
 */
export class AlertEngine {
  private rules: AlertRule[] = [];
  private alerts: Alert[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = DEFAULT_ALERT_RULES.map((rule, index) => ({
      ...rule,
      id: `rule-${index + 1}`,
      created_at: new Date().toISOString()
    }));
  }

  /**
   * Evaluate all rules against current portfolio data
   */
  async evaluateAlerts(
    portfolioId: string,
    kpiData: KPIData,
    properties: PropertyData[]
  ): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const triggeredAlert = await this.evaluateRule(rule, portfolioId, kpiData, properties);
      if (triggeredAlert) {
        newAlerts.push(triggeredAlert);
      }
    }

    // Add property-specific alerts
    for (const property of properties) {
      const propertyAlerts = await this.evaluatePropertyAlerts(portfolioId, property);
      newAlerts.push(...propertyAlerts);
    }

    this.alerts.push(...newAlerts);
    return newAlerts;
  }

  private async evaluateRule(
    rule: AlertRule,
    portfolioId: string,
    kpiData: KPIData,
    properties: PropertyData[]
  ): Promise<Alert | null> {
    const { condition } = rule;
    let currentValue: number;

    // Get current value based on metric
    switch (condition.metric) {
      case 'irr':
        currentValue = kpiData.irr;
        break;
      case 'monthly_cash_flow':
        currentValue = kpiData.monthly_cash_flow;
        break;
      case 'occupancy_rate':
        currentValue = kpiData.occupancy_rate;
        break;
      case 'dscr':
        currentValue = kpiData.dscr;
        break;
      case 'days_to_tax_deadline':
        currentValue = this.calculateDaysToTaxDeadline();
        break;
      default:
        return null;
    }

    // Check if condition is met
    const isTriggered = this.checkCondition(currentValue, condition.operator, condition.threshold);

    if (!isTriggered) return null;

    // Check if alert already exists for this rule
    const existingAlert = this.alerts.find(
      alert => alert.type === rule.type && alert.status === 'active'
    );

    if (existingAlert) return null;

    return this.createAlert(rule, portfolioId, currentValue);
  }

  private checkCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  private createAlert(rule: AlertRule, portfolioId: string, triggerValue: number): Alert {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alertMessages = this.getAlertMessages(rule.type, triggerValue, rule.condition.threshold);

    return {
      id: alertId,
      portfolio_id: portfolioId,
      type: rule.type,
      severity: rule.severity,
      status: 'active',
      title: alertMessages.title,
      description: alertMessages.description,
      recommendation: alertMessages.recommendation,
      trigger_value: triggerValue,
      threshold_value: rule.condition.threshold,
      created_at: new Date().toISOString(),
      metadata: {
        rule_id: rule.id,
        rule_name: rule.name
      }
    };
  }

  private getAlertMessages(
    type: AlertType,
    triggerValue: number,
    threshold: number
  ): { title: string; description: string; recommendation: string } {
    switch (type) {
      case 'cash_flow_negative':
        return {
          title: 'Cash Flow Négatif Détecté',
          description: `Le cash flow mensuel est de ${this.formatCurrency(triggerValue)}, en dessous du seuil de ${this.formatCurrency(threshold)}.`,
          recommendation: 'Analysez les dépenses récentes et considérez une révision des loyers ou une optimisation des charges.'
        };

      case 'occupancy_low':
        return {
          title: 'Taux d\'Occupation Faible',
          description: `Le taux d'occupation est de ${this.formatPercentage(triggerValue)}, en dessous du seuil de ${this.formatPercentage(threshold)}.`,
          recommendation: 'Intensifiez les efforts de commercialisation et vérifiez l\'attractivité de vos biens.'
        };

      case 'performance_drop':
        return {
          title: 'Baisse de Performance',
          description: `L'IRR est de ${this.formatPercentage(triggerValue)}, en dessous du seuil de ${this.formatPercentage(threshold)}.`,
          recommendation: 'Analysez les causes de la baisse et considérez des actions correctives ou une stratégie de sortie.'
        };

      case 'risk_warning':
        return {
          title: 'Alerte Risque DSCR',
          description: `Le DSCR est de ${triggerValue.toFixed(2)}, en dessous du seuil critique de ${threshold.toFixed(2)}.`,
          recommendation: 'Action urgente requise : renégociation du financement ou augmentation des revenus.'
        };

      case 'tax_deadline':
        return {
          title: 'Échéance Fiscale Proche',
          description: `Une échéance fiscale approche dans ${Math.round(triggerValue)} jours.`,
          recommendation: 'Préparez vos déclarations fiscales et consultez votre expert-comptable si nécessaire.'
        };

      default:
        return {
          title: 'Alerte',
          description: `Valeur actuelle: ${triggerValue}, seuil: ${threshold}`,
          recommendation: 'Veuillez analyser cette situation.'
        };
    }
  }

  private async evaluatePropertyAlerts(
    portfolioId: string,
    property: PropertyData
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Lease expiry alert
    if (property.lease_end_date) {
      const daysToExpiry = this.calculateDaysToDate(property.lease_end_date);
      if (daysToExpiry <= 60 && daysToExpiry > 0) {
        alerts.push({
          id: `lease-expiry-${property.id}-${Date.now()}`,
          portfolio_id: portfolioId,
          property_id: property.id,
          type: 'lease_expiry',
          severity: daysToExpiry <= 30 ? 'high' : 'medium',
          status: 'active',
          title: 'Fin de Bail Proche',
          description: `Le bail de ${property.address} expire dans ${daysToExpiry} jours.`,
          recommendation: 'Contactez le locataire pour un renouvellement ou préparez la remise en location.',
          trigger_value: daysToExpiry,
          threshold_value: 60,
          created_at: new Date().toISOString()
        });
      }
    }

    // Maintenance due alert
    if (property.last_maintenance_date) {
      const daysSinceMaintenance = this.calculateDaysSinceDate(property.last_maintenance_date);
      if (daysSinceMaintenance >= 365) {
        alerts.push({
          id: `maintenance-${property.id}-${Date.now()}`,
          portfolio_id: portfolioId,
          property_id: property.id,
          type: 'maintenance_due',
          severity: 'medium',
          status: 'active',
          title: 'Maintenance Requise',
          description: `Aucune maintenance effectuée sur ${property.address} depuis ${Math.round(daysSinceMaintenance / 30)} mois.`,
          recommendation: 'Planifiez une inspection et des travaux de maintenance préventive.',
          trigger_value: daysSinceMaintenance,
          threshold_value: 365,
          created_at: new Date().toISOString()
        });
      }
    }

    // Vacancy alert
    if (property.occupancy_status === 'vacant') {
      alerts.push({
        id: `vacancy-${property.id}-${Date.now()}`,
        portfolio_id: portfolioId,
        property_id: property.id,
        type: 'occupancy_low',
        severity: 'high',
        status: 'active',
        title: 'Bien Vacant',
        description: `${property.address} est actuellement vacant.`,
        recommendation: 'Lancez une campagne de commercialisation active et vérifiez l\'état du bien.',
        trigger_value: 0,
        threshold_value: 1,
        created_at: new Date().toISOString()
      });
    }

    return alerts;
  }

  /**
   * Generate alert summary
   */
  getAlertSummary(portfolioId: string): AlertSummary {
    const portfolioAlerts = this.alerts.filter(
      alert => alert.portfolio_id === portfolioId
    );

    const activeAlerts = portfolioAlerts.filter(alert => alert.status === 'active');
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');

    const alertsByType = portfolioAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    const alertsBySeverity = portfolioAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const recentAlerts = portfolioAlerts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      total_alerts: portfolioAlerts.length,
      active_alerts: activeAlerts.length,
      critical_alerts: criticalAlerts.length,
      alerts_by_type: alertsByType,
      alerts_by_severity: alertsBySeverity,
      recent_alerts: recentAlerts
    };
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledged_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && alert.status !== 'resolved') {
      alert.status = 'resolved';
      alert.resolved_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Helper methods
  private calculateDaysToTaxDeadline(): number {
    const now = new Date();
    const nextTaxDeadline = new Date(now.getFullYear(), 4, 31); // May 31st
    if (nextTaxDeadline < now) {
      nextTaxDeadline.setFullYear(now.getFullYear() + 1);
    }
    return Math.ceil((nextTaxDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysToDate(dateString: string): number {
    const targetDate = new Date(dateString);
    const now = new Date();
    return Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysSinceDate(dateString: string): number {
    const targetDate = new Date(dateString);
    const now = new Date();
    return Math.ceil((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}

// Global alert engine instance
export const alertEngine = new AlertEngine();