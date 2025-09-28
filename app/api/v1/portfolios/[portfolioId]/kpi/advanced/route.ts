import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    // Demo mode - advanced financial KPIs
    const advancedKPIs = {
      irr: 0.095, // 9.5% IRR
      total_roi: 0.187, // 18.7% total ROI
      cash_on_cash_return: 0.073, // 7.3% cash-on-cash return
      cap_rate: 0.048, // 4.8% cap rate
      dscr: 1.34, // Debt service coverage ratio
      ltv_ratio: 0.73, // 73% loan-to-value
      equity_multiple: 1.62, // 1.62x equity multiple
      cash_flow_per_unit: 315, // €315 cash flow per property per month
      occupancy_rate: 0.94, // 94% occupancy rate
      yield_on_cost: 0.052, // 5.2% yield on cost
      break_even_ratio: 0.82, // 82% break even ratio
      debt_yield: 0.089, // 8.9% debt yield

      // Additional metrics for enhanced analysis
      cash_flow_growth_rate: 0.035, // 3.5% annual cash flow growth
      appreciation_rate: 0.024, // 2.4% annual appreciation
      total_leverage: 2.7, // Total leverage multiple
      net_present_value: 47850, // NPV at 8% discount rate
      payback_period: 12.3, // 12.3 years payback period
      profitability_index: 1.23, // Profitability index
      modified_irr: 0.087, // 8.7% MIRR (more conservative)

      // Risk metrics
      volatility: 0.156, // 15.6% volatility
      sharpe_ratio: 0.42, // Sharpe ratio
      max_drawdown: 0.089, // 8.9% maximum drawdown
      value_at_risk_95: 0.134, // 13.4% VaR at 95% confidence

      // Efficiency metrics
      asset_turnover: 0.092, // Asset turnover ratio
      return_on_assets: 0.067, // Return on assets
      return_on_equity: 0.143, // Return on equity
      debt_to_equity: 2.1, // Debt to equity ratio

      // Market comparison
      market_cap_rate: 0.043, // Market average cap rate
      market_irr: 0.081, // Market average IRR
      performance_vs_market: 0.164, // 16.4% outperformance vs market

      // Tax efficiency (entity-specific)
      effective_tax_rate: entityId === 'entity-lmnp' ? 0.125 :
                         entityId === 'entity-sci' ? 0.168 : 0.195,
      tax_savings_vs_personal: entityId === 'entity-lmnp' ? 2850 :
                               entityId === 'entity-sci' ? 1240 : 0,

      // Cash flow metrics
      operating_cash_flow: 28650, // Annual operating cash flow
      free_cash_flow: 23100, // Annual free cash flow
      cash_flow_margin: 0.67, // Cash flow margin

      // Portfolio concentration
      geographic_diversification_score: 0.73, // Geographic diversification
      property_type_diversification: 0.65, // Property type diversification
      tenant_concentration_risk: 0.28, // Tenant concentration risk

      // Liquidity metrics
      quick_ratio: 1.84, // Quick ratio
      current_ratio: 2.12, // Current ratio
      cash_coverage_ratio: 3.45, // Cash coverage ratio

      // Operational efficiency
      revenue_per_sqm: 275, // €275 revenue per square meter
      operating_expense_ratio: 0.33, // 33% operating expense ratio
      maintenance_capex_ratio: 0.045, // 4.5% maintenance/capex ratio

      // Growth metrics
      revenue_growth_rate: 0.042, // 4.2% revenue growth
      noi_growth_rate: 0.038, // 3.8% NOI growth
      asset_value_growth: 0.029 // 2.9% asset value growth
    };

    // Adjust metrics based on entity type for more realistic simulation
    if (entityId === 'entity-lmnp') {
      advancedKPIs.irr = 0.103; // Slightly higher due to tax benefits
      advancedKPIs.cash_on_cash_return = 0.081;
      advancedKPIs.effective_tax_rate = 0.125;
    } else if (entityId === 'entity-sci') {
      advancedKPIs.irr = 0.089; // Slightly lower due to IS tax
      advancedKPIs.cash_on_cash_return = 0.069;
      advancedKPIs.effective_tax_rate = 0.168;
    }

    return NextResponse.json({
      success: true,
      advanced_kpis: advancedKPIs,
      metadata: {
        portfolio_id: portfolioId,
        entity_id: entityId,
        calculation_date: new Date().toISOString(),
        discount_rate: 0.08,
        analysis_period_years: 10,
        currency: 'EUR',
        methodology: 'DCF with risk-adjusted returns',
        data_quality_score: 0.92,
        last_updated: new Date().toISOString(),
        benchmarks: {
          market_average_irr: 0.081,
          market_average_cap_rate: 0.043,
          risk_free_rate: 0.025,
          market_risk_premium: 0.056
        }
      }
    });

  } catch (error) {
    console.error('Error fetching advanced KPIs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advanced KPIs' },
      { status: 500 }
    );
  }
}