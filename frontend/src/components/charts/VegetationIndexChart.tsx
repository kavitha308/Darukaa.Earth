import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SiteMetric } from '../../types';

interface VegetationIndexChartProps {
  metrics: SiteMetric[];
}

export const VegetationIndexChart: React.FC<VegetationIndexChartProps> = ({ metrics }) => {
  const dates = metrics.map((m) => {
    const d = new Date(m.recorded_at);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const ndvi = metrics.map((m) => m.ndvi);
  const canopy = metrics.map((m) => m.canopy_cover_percentage);

  const options: Highcharts.Options = {
    chart: {
      type: 'spline',
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
          text: 'Sentinel-2 NDVI (0.0 - 1.0)',
          style: { color: '#10b981', fontSize: '11px', fontWeight: 'bold' },
        },
        labels: {
          style: { color: '#6ee7b7', fontSize: '10px' },
        },
        min: 0.2,
        max: 1.0,
        gridLineColor: 'rgba(30, 51, 38, 0.4)',
      },
      {
        title: {
          text: 'Canopy Cover (%)',
          style: { color: '#14b8a6', fontSize: '11px', fontWeight: 'bold' },
        },
        labels: {
          style: { color: '#5eead4', fontSize: '10px' },
          format: '{value}%',
        },
        min: 0,
        max: 100,
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
      valueDecimals: 3,
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
        name: 'NDVI Vegetation Index',
        type: 'spline',
        yAxis: 0,
        data: ndvi,
        color: '#10b981',
      },
      {
        name: 'Canopy Cover %',
        type: 'spline',
        yAxis: 1,
        data: canopy,
        color: '#14b8a6',
      },
    ],
  };

  return (
    <div className="w-full bg-earth-card/80 border border-earth-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Canopy Density & Multispectral NDVI</h4>
          <p className="text-[11px] text-earth-muted">
            Chlorophyll absorption and forest crown canopy recovery over time
          </p>
        </div>
        <span className="text-[10px] font-semibold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/50">
          GEDI LiDAR + Sentinel-2
        </span>
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};
