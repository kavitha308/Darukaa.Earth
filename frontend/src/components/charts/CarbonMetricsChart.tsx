import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SiteMetric } from '../../types';

interface CarbonMetricsChartProps {
  metrics: SiteMetric[];
}

export const CarbonMetricsChart: React.FC<CarbonMetricsChartProps> = ({ metrics }) => {
  const dates = metrics.map((m) => {
    const d = new Date(m.recorded_at);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const cumulativeCarbon = metrics.map((m) => m.cumulative_carbon_tco2e);
  const sequestrationRate = metrics.map((m) => m.carbon_sequestration_rate_tco2e_per_ha);

  const options: Highcharts.Options = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 280,
      spacing: [15, 10, 15, 10],
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      categories: dates,
      labels: {
        style: { color: '#94a3b8', fontSize: '10px' },
        step: Math.max(1, Math.floor(dates.length / 6)),
      },
      lineColor: '#1E3326',
      tickColor: '#1E3326',
    },
    yAxis: [
      {
        // Primary Axis: Cumulative Carbon
        title: {
          text: 'Cumulative Carbon (tCO₂e)',
          style: { color: '#22c55e', fontSize: '11px', fontWeight: 'bold' },
        },
        labels: {
          style: { color: '#86efac', fontSize: '10px' },
          format: '{value} t',
        },
        gridLineColor: 'rgba(30, 51, 38, 0.4)',
      },
      {
        // Secondary Axis: Annual Sequestration Rate
        title: {
          text: 'Rate (tCO₂e/ha/yr)',
          style: { color: '#38bdf8', fontSize: '11px', fontWeight: 'bold' },
        },
        labels: {
          style: { color: '#7dd3fc', fontSize: '10px' },
          format: '{value}',
        },
        opposite: true,
        gridLineWidth: 0,
      },
    ],
    tooltip: {
      shared: true,
      backgroundColor: '#121F17',
      borderColor: '#1E3326',
      borderRadius: 8,
      style: { color: '#f8fafc', fontSize: '12px' },
      valueDecimals: 2,
    },
    legend: {
      itemStyle: { color: '#cbd5e1', fontSize: '11px' },
      itemHoverStyle: { color: '#ffffff' },
    },
    plotOptions: {
      spline: {
        lineWidth: 2.5,
        marker: {
          radius: 3,
        },
      },
    },
    series: [
      {
        name: 'Cumulative Carbon (tCO₂e)',
        type: 'spline',
        yAxis: 0,
        data: cumulativeCarbon,
        color: '#22c55e',
      },
      {
        name: 'Annual Rate (tCO₂e/ha/yr)',
        type: 'spline',
        yAxis: 1,
        data: sequestrationRate,
        color: '#38bdf8',
        dashStyle: 'ShortDash',
      },
    ],
  };

  return (
    <div className="w-full bg-earth-card/80 border border-earth-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Carbon Sequestration Trajectory</h4>
          <p className="text-[11px] text-earth-muted">
            Net carbon accumulation vs. biomass run-rate over time
          </p>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">
          IPCC Tier 3 Model
        </span>
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};
