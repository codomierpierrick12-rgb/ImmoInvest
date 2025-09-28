'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetricType = 'LTV' | 'DSCR' | 'CRD' | 'VAN' | 'TRI' | 'CASH_NET_VENDEUR';
type ScopeType = 'portfolio' | 'property';

interface TooltipMetricProps {
  metric: MetricType;
  scope?: ScopeType;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

const metricDefinitions: Record<MetricType, {
  title: string;
  description: string;
  formula: string;
  threshold?: string;
}> = {
  LTV: {
    title: 'LTV — Loan-to-Value',
    description: 'Part de dette par rapport à la valeur de marché.',
    formula: 'LTV = Dette / Valeur',
    threshold: 'Plus c\'est bas, plus c\'est sûr. Seuil d\'alerte : 85 %.'
  },
  DSCR: {
    title: 'DSCR — Debt Service Coverage Ratio',
    description: 'Capacité des flux d\'exploitation à couvrir les mensualités de dette.',
    formula: 'DSCR = Cash-flow opérationnel / Service de la dette, avec CF op = loyers nets − charges − impôts d\'exploitation (hors amortissements)',
    threshold: 'Zone de confort ≥ 1,20.'
  },
  CRD: {
    title: 'CRD — Capital Restant Dû',
    description: 'Montant de principal restant à rembourser à la date considérée.',
    formula: 'Sert au calcul de l\'IRA (remb. anticipé), du cash net vendeur et du refinancement.',
  },
  VAN: {
    title: 'VAN@r — Valeur Actuelle Nette',
    description: 'Valeur actuelle des flux futurs nets actualisés au taux r.',
    formula: 'VAN = Σ(CF_t / (1+r)^t) - Investissement initial',
  },
  TRI: {
    title: 'TRI — Taux de Rendement Interne',
    description: 'Taux d\'actualisation pour lequel la VAN = 0.',
    formula: 'TRI tel que Σ(CF_t / (1+TRI)^t) = Investissement initial',
  },
  CASH_NET_VENDEUR: {
    title: 'Cash net vendeur',
    description: 'Montant net encaissé par le vendeur après tous frais et remboursements.',
    formula: 'Cash net = Prix × (1 − frais) − CRD − IRA − Impôts',
  }
};

export default function TooltipMetric({
  metric,
  scope = 'portfolio',
  className,
  iconClassName,
  children
}: TooltipMetricProps) {
  const definition = metricDefinitions[metric];

  const scopeText = scope === 'portfolio' ? 'portefeuille' : 'bien';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'inline-flex items-center gap-1 cursor-help',
            className
          )}>
            {children}
            <Info className={cn('h-4 w-4 text-muted-foreground hover:text-foreground', iconClassName)} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-[320px] p-4 text-sm"
          side="top"
          align="start"
        >
          <div className="space-y-2">
            <div className="font-semibold text-foreground">
              {definition.title}
            </div>

            <div className="text-muted-foreground">
              {definition.description}
            </div>

            <div className="text-xs bg-muted p-2 rounded font-mono">
              <strong>Formule :</strong> {definition.formula}
            </div>

            {definition.threshold && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                {definition.threshold}
              </div>
            )}

            <div className="text-xs text-muted-foreground border-t pt-2">
              Calcul {scopeText} {scope === 'portfolio' ? 'agrégé' : 'par bien'}.
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience components for common use cases
export function LTVTooltip({ scope, className, children }: Omit<TooltipMetricProps, 'metric'>) {
  return (
    <TooltipMetric metric="LTV" scope={scope} className={className}>
      {children || 'LTV'}
    </TooltipMetric>
  );
}

export function DSCRTooltip({ scope, className, children }: Omit<TooltipMetricProps, 'metric'>) {
  return (
    <TooltipMetric metric="DSCR" scope={scope} className={className}>
      {children || 'DSCR'}
    </TooltipMetric>
  );
}

export function CRDTooltip({ scope, className, children }: Omit<TooltipMetricProps, 'metric'>) {
  return (
    <TooltipMetric metric="CRD" scope={scope} className={className}>
      {children || 'CRD'}
    </TooltipMetric>
  );
}