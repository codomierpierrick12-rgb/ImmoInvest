export type AlertType =
  | 'performance_drop'
  | 'cash_flow_negative'
  | 'occupancy_low'
  | 'maintenance_due'
  | 'lease_expiry'
  | 'tax_deadline'
  | 'opportunity'
  | 'risk_warning';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  portfolio_id: string;
  property_id?: string;
  entity_id?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  recommendation?: string;
  trigger_value?: number;
  threshold_value?: number;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  enabled: boolean;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    period?: number; // days
  };
  severity: AlertSeverity;
  notification_channels: ('email' | 'sms' | 'push')[];
  created_at: string;
}

export interface AlertSummary {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  alerts_by_type: Record<AlertType, number>;
  alerts_by_severity: Record<AlertSeverity, number>;
  recent_alerts: Alert[];
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  email_address?: string;
  phone_number?: string;
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:mm
    end_time: string; // HH:mm
  };
  alert_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

// Default alert rules
export const DEFAULT_ALERT_RULES: Omit<AlertRule, 'id' | 'created_at'>[] = [
  {
    name: 'Taux d\'occupation faible',
    type: 'occupancy_low',
    enabled: true,
    condition: {
      metric: 'occupancy_rate',
      operator: 'lt',
      threshold: 0.85,
      period: 7
    },
    severity: 'medium',
    notification_channels: ['email', 'push']
  },
  {
    name: 'Cash flow négatif',
    type: 'cash_flow_negative',
    enabled: true,
    condition: {
      metric: 'monthly_cash_flow',
      operator: 'lt',
      threshold: 0,
      period: 1
    },
    severity: 'high',
    notification_channels: ['email', 'sms', 'push']
  },
  {
    name: 'Performance en baisse',
    type: 'performance_drop',
    enabled: true,
    condition: {
      metric: 'irr',
      operator: 'lt',
      threshold: 0.05,
      period: 30
    },
    severity: 'medium',
    notification_channels: ['email']
  },
  {
    name: 'DSCR critique',
    type: 'risk_warning',
    enabled: true,
    condition: {
      metric: 'dscr',
      operator: 'lt',
      threshold: 1.1,
      period: 1
    },
    severity: 'critical',
    notification_channels: ['email', 'sms', 'push']
  },
  {
    name: 'Échéance fiscale',
    type: 'tax_deadline',
    enabled: true,
    condition: {
      metric: 'days_to_tax_deadline',
      operator: 'lte',
      threshold: 30,
      period: 1
    },
    severity: 'high',
    notification_channels: ['email', 'push']
  }
];

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  performance_drop: 'Baisse de performance',
  cash_flow_negative: 'Cash flow négatif',
  occupancy_low: 'Taux d\'occupation faible',
  maintenance_due: 'Maintenance requise',
  lease_expiry: 'Fin de bail',
  tax_deadline: 'Échéance fiscale',
  opportunity: 'Opportunité',
  risk_warning: 'Alerte risque'
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique'
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};