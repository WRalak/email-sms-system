import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { ArrowTrendingUpIcon, EnvelopeOpenIcon, CursorArrowRaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
  },
  responsive: true,
  maintainAspectRatio: false,
};

export default function AnalyticsPage() {
  const [overview, setOverview]     = useState(null);
  const [chartData, setChartData]   = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [period, setPeriod]         = useState('30');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/analytics/overview?period=${period}`),
      api.get(`/api/analytics/messages-over-time?days=${period}`),
      api.get('/api/analytics/top-campaigns'),
    ]).then(([ovRes, chartRes, topRes]) => {
      setOverview(ovRes.data.data);
      setChartData(chartRes.data.data || []);
      setTopCampaigns(topRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  // Build daily chart data
  const days = parseInt(period);
  const dateLabels = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const emailData = dateLabels.map(date => chartData.find(d => d._id.date === date && d._id.type === 'email')?.sent || 0);
  const smsData   = dateLabels.map(date => chartData.find(d => d._id.date === date && d._id.type === 'sms')?.sent   || 0);
  const fmtLabel  = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const barData = {
    labels: dateLabels.map(fmtLabel),
    datasets: [
      { label: 'Email', data: emailData, backgroundColor: 'rgba(111,77,255,.7)', borderRadius: 4 },
      { label: 'SMS',   data: smsData,   backgroundColor: 'rgba(6,182,212,.6)',  borderRadius: 4 },
    ],
  };
  const barOpts = { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: true, labels: { color: '#94a3b8', font: { size: 12 } } } } };

  const donutData = {
    labels: ['Delivered', 'Opened', 'Clicked', 'Failed', 'Bounced'],
    datasets: [{
      data: [
        overview?.period?.delivered || 0,
        overview?.period?.opened    || 0,
        overview?.period?.clicked   || 0,
        overview?.period?.failed    || 0,
        0,
      ],
      backgroundColor: ['#6f4dff','#06b6d4','#10b981','#ef4444','#f59e0b'],
      borderColor: '#0f0f1e', borderWidth: 3,
    }],
  };
  const donutOpts = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 14, font: { size: 12 } } } } };

  const kpis = [
    { label: 'Delivery Rate', value: `${overview?.rates?.deliveryRate ?? 0}%`, icon: ArrowTrendingUpIcon, color: 'text-brand-400',   bg: 'bg-brand-600/10',   border: 'border-brand-600/20' },
    { label: 'Open Rate',     value: `${overview?.rates?.openRate     ?? 0}%`, icon: EnvelopeOpenIcon,  color: 'text-cyan-400',    bg: 'bg-cyan-600/10',    border: 'border-cyan-600/20' },
    { label: 'Click Rate',    value: `${overview?.rates?.clickRate    ?? 0}%`, icon: CursorArrowRaysIcon, color: 'text-emerald-400', bg: 'bg-emerald-600/10', border: 'border-emerald-600/20' },
    { label: 'Failure Rate',  value: overview?.period?.sent > 0 ? `${((overview.period.failed / overview.period.sent) * 100).toFixed(1)}%` : '0%', icon: ExclamationTriangleIcon, color: 'text-red-400', bg: 'bg-red-600/10', border: 'border-red-600/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Message delivery and engagement statistics</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {[['7','7d'],['30','30d'],['90','90d']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${period === v ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`card p-5 border ${border}`}>
                <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Volume + Totals row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sent',      value: overview?.period?.sent?.toLocaleString()      || '0' },
              { label: 'Delivered',       value: overview?.period?.delivered?.toLocaleString() || '0' },
              { label: 'Opened',          value: overview?.period?.opened?.toLocaleString()    || '0' },
              { label: 'Failed',          value: overview?.period?.failed?.toLocaleString()    || '0' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label} (last {period}d)</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="text-base font-semibold text-white mb-6">Messages Sent by Day</h2>
              <div className="h-56">
                <Bar data={barData} options={barOpts} />
              </div>
            </div>

            {/* Donut */}
            <div className="card p-6">
              <h2 className="text-base font-semibold text-white mb-4">Status Breakdown</h2>
              <div className="h-56">
                <Doughnut data={donutData} options={donutOpts} />
              </div>
            </div>
          </div>

          {/* Top Campaigns */}
          {topCampaigns.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-white mb-4">Top Campaigns by Opens</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Type</th>
                      <th>Sent</th>
                      <th>Delivered</th>
                      <th>Opened</th>
                      <th>Open Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCampaigns.map(c => {
                      const openRate = c.stats?.sent > 0 ? ((c.stats.opened / c.stats.sent) * 100).toFixed(1) : '0';
                      return (
                        <tr key={c._id}>
                          <td className="font-medium text-slate-200">{c.name}</td>
                          <td><span className={c.type === 'email' ? 'badge-purple' : 'badge-blue'} style={{textTransform:'capitalize'}}>{c.type}</span></td>
                          <td className="text-slate-400">{c.stats?.sent || 0}</td>
                          <td className="text-slate-400">{c.stats?.delivered || 0}</td>
                          <td className="text-slate-400">{c.stats?.opened || 0}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-slate-700">
                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(openRate, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-300">{openRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
