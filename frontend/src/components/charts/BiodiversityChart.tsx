import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SiteMetric } from '../../types';

interface BiodiversityChartProps {
  metrics: SiteMetric[];
}

export const BiodiversityChart: React.FC<BiodiversityChartProps> = ({ metrics }) => {
  const dates = metrics.map((m) => {
    const d = new Date(m.recorded_at);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const bioIndex = metrics.map((m) => m.biodiversity_index);
  const speciesRichness = metrics.map((m) => m.species_richness_count);

  const options: Highcharts.Options = {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      height: 260,
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
        title: {
          text: 'Biodiversity Score (0-100)',
          style: { color: '#eab308', fontSize: '11px', fontWeight: 'bold' },
        },
        labels: {
          style: { color: '#fde047', fontSize: '10px' },
        },
        min: 0,
        max: 100,
        gridLineColor: 'rgba(30, 51, 38, 0.4)',
      },
      {
        title: {
          text: 'Observed Species Count',
          style: { color: '#a855f7', fontSize: '11px', fontWeight: 'bold' },
        },
        labels: {
          style: { color: '#c084fc', fontSize: '10px' },
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
    },
    legend: {
      itemStyle: { color: '#cbd5e1', fontSize: '11px' },
      itemHoverStyle: { color: '#ffffff' },
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.15,
        lineWidth: 2.5,
        marker: {
          radius: 3,
        },
      },
    },
    series: [
      {
        name: 'Biodiversity Index (Shannon)',
        type: 'areaspline',
        yAxis: 0,
        data: bioIndex,
        color: '#eab308',
      },
      {
        name: 'Indicator Species Richness',
        type: 'spline',
        yAxis: 1,
        data: speciesRichness,
        color: '#a855f7',
      },
    ],
  };

  return (
    <div className="w-full bg-earth-card/80 border border-earth-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Ecological Integrity & Biodiversity</h4>
          <p className="text-[11px] text-earth-muted">
            Tracking indicator fauna and normalized Shannon ecosystem diversity
          </p>
        </div>
        <span className="text-[10px] font-semibold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">
          Bioacoustics & eDNA
        </span>
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};
