import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  EnvelopeIcon, DevicePhoneMobileIcon, UsersIcon, MegaphoneIcon,
  PaperAirplaneIcon, ArrowTrendingUpIcon, CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-15`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

const RateBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-300 font-medium">{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(value,100)}%` }} />
    </div>
  </div>
);

export default function DashboardPage() {
  const { user }    = useAuth();
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentMsgs, setRecentMsgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/overview?period=30'),
      api.get('/api/analytics/messages-over-time?days=14'),
      api.get('/api/messages?limit=5'),
    ]).then(([ovRes, chartRes, msgsRes]) => {
      setOverview(ovRes.data.data);
      setChartData(chartRes.data.data);
      setRecentMsgs(msgsRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Process chart data
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const emailCounts = last14.map((date) => {
    const found = chartData.find((d) => d._id.date === date && d._id.type === 'email');
    return found?.sent || 0;
  });
  const smsCounts = last14.map((date) => {
    const found = chartData.find((d) => d._id.date === date && d._id.type === 'sms');
    return found?.sent || 0;
  });

  const lineData = {
    labels: last14.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Email',
        data: emailCounts,
        borderColor: '#6f4dff',
        backgroundColor: 'rgba(111,77,255,.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#6f4dff',
      },
      {
        label: 'SMS',
        data: smsCounts,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,.07)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#06b6d4',
      },
    ],
  };

  const donutData = {
    labels: ['Delivered', 'Opened', 'Clicked', 'Failed'],
    datasets: [{
      data: [
        overview?.period?.delivered || 0,
        overview?.period?.opened    || 0,
        overview?.period?.clicked   || 0,
        overview?.period?.failed    || 0,
      ],
      backgroundColor: ['#6f4dff', '#06b6d4', '#10b981', '#ef4444'],
      borderColor: '#0f0f1e',
      borderWidth: 3,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    },
  };

  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } } },
    cutout: '72%',
  };

  const statusBadge = (status) => {
    const map = { sent: 'badge-green', failed: 'badge-red', scheduled: 'badge-yellow', draft: 'badge-gray', sending: 'badge-blue' };
    return <span className={map[status] || 'badge-gray'}>{status}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            {' '}<span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">Here's what's happening with your messages today.</p>
        </div>
        <Link to="/compose" className="btn-primary btn-md">
          <PaperAirplaneIcon className="w-4 h-4" />
          New Message
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon}            label="Total Contacts"  value={overview?.totals?.contacts?.toLocaleString()}  color="bg-brand-500"   sub="All time" />
        <StatCard icon={EnvelopeIcon}         label="Messages Sent"   value={overview?.period?.sent?.toLocaleString()}      color="bg-cyan-500"    sub="Last 30 days" />
        <StatCard icon={MegaphoneIcon}        label="Campaigns"       value={overview?.totals?.campaigns?.toLocaleString()} color="bg-emerald-500" sub="All time" />
        <StatCard icon={ArrowTrendingUpIcon}  label="Delivery Rate"   value={`${overview?.rates?.deliveryRate ?? 0}%`}      color="bg-amber-500"   sub="Last 30 days" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Line chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Messages Over Time</h2>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />Email</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />SMS</span>
            </div>
          </div>
          <div className="h-52">
            <Line data={lineData} options={chartOpts} />
          </div>
        </div>

        {/* Donut + rates */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Delivery Breakdown</h2>
          <div className="h-44 mb-4">
            <Doughnut data={donutData} options={donutOpts} />
          </div>
          <div className="space-y-3 mt-2">
            <RateBar label="Delivery Rate" value={overview?.rates?.deliveryRate || 0} color="bg-brand-500" />
            <RateBar label="Open Rate"     value={overview?.rates?.openRate     || 0} color="bg-cyan-500" />
            <RateBar label="Click Rate"    value={overview?.rates?.clickRate    || 0} color="bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Recent messages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Messages</h2>
          <Link to="/messages" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject / Body</th>
                <th>Type</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentMsgs.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-slate-500 py-8">No messages yet</td></tr>
              ) : recentMsgs.map((m) => (
                <tr key={m._id}>
                  <td className="font-medium text-slate-200 max-w-[200px] truncate">
                    {m.subject || m.body?.slice(0, 50)}
                  </td>
                  <td>
                    <span className={m.type === 'email' ? 'badge-purple' : 'badge-blue'}>
                      {m.type === 'email'
                        ? <><EnvelopeIcon className="w-3 h-3" /> Email</>
                        : <><DevicePhoneMobileIcon className="w-3 h-3" /> SMS</>
                      }
                    </span>
                  </td>
                  <td className="text-slate-400">{m.stats?.total || 0}</td>
                  <td>{statusBadge(m.status)}</td>
                  <td className="text-slate-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/compose',   label: 'Send Email',     icon: EnvelopeIcon,          color: 'from-brand-600/20 to-brand-700/10 border-brand-600/25 text-brand-300' },
          { to: '/compose',   label: 'Send SMS',       icon: DevicePhoneMobileIcon, color: 'from-cyan-600/20 to-cyan-700/10 border-cyan-600/25 text-cyan-300' },
          { to: '/campaigns', label: 'New Campaign',   icon: MegaphoneIcon,         color: 'from-emerald-600/20 to-emerald-700/10 border-emerald-600/25 text-emerald-300' },
          { to: '/contacts',  label: 'Add Contact',    icon: UsersIcon,             color: 'from-amber-600/20 to-amber-700/10 border-amber-600/25 text-amber-300' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link key={label} to={to}
            className={`card-hover p-4 text-center bg-gradient-to-br ${color} border group cursor-pointer`}>
            <Icon className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
