import React from 'react';
import { Clock, Calendar, Flame, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { ListeningStats } from '../types';

interface Props {
  stats: ListeningStats;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function formatHour(hr: number): string {
  if (hr === 0) return '12 AM';
  if (hr === 12) return '12 PM';
  return hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
}

export const ActivityCharts: React.FC<Props> = ({ stats }) => {
  const maxHourMin = Math.max(1, ...stats.hourlyMinutes);
  const maxWeekMin = Math.max(1, ...stats.weekdayMinutes);
  const maxMonthMin = Math.max(1, ...stats.monthlyTimeline.map((m) => m.minutes));

  // Build 140-day (20-week) heatmap grid ending at the last active date in dataset
  const heatmapDays = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const d of stats.dailyActivity) {
      map.set(d.date, d.minutes);
    }
    const lastDateStr =
      stats.dailyActivity.length > 0
        ? stats.dailyActivity[stats.dailyActivity.length - 1].date
        : new Date().toISOString().slice(0, 10);
    const end = new Date(`${lastDateStr}T12:00:00Z`);
    const cells: { date: string; minutes: number }[] = [];
    for (let i = 139; i >= 0; i--) {
      const dt = new Date(end.getTime() - i * 86_400_000);
      const key = dt.toISOString().slice(0, 10);
      cells.push({ date: key, minutes: map.get(key) || 0 });
    }
    return cells;
  }, [stats.dailyActivity]);

  const maxDailyMin = Math.max(1, ...heatmapDays.map((c) => c.minutes));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Asymmetric Row 1 (7 cols / 5 cols): Monthly Listening Volume + Sonic Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
        {/* Monthly Timeline (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#111111] mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FF0000]">
                <TrendingUp className="w-4 h-4" />
                <span>[GRID 01] TEMPORAL VOLUME</span>
              </div>
              <h3 className="text-xl font-bold text-[#111111] mt-1">Monthly Minutes Listened</h3>
            </div>
            <span className="font-mono text-xs bg-[#FFFF00] text-[#111111] border border-[#111111] px-2.5 py-1 font-bold">
              AVG: {stats.dailyAverageMinutes} MIN/DAY
            </span>
          </div>

          {stats.monthlyTimeline.length > 0 ? (
            <div className="h-56 flex items-end gap-2 pt-8 pb-2">
              {stats.monthlyTimeline.slice(-14).map((m, i) => {
                const heightPct = Math.max(8, Math.round((m.minutes / maxMonthMin) * 100));
                const barColor =
                  i % 3 === 0 ? 'bg-[#FF0000]' : i % 3 === 1 ? 'bg-[#0000FF]' : 'bg-[#111111]';
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 absolute -top-9 z-10 whitespace-nowrap bg-[#111111] text-[#FFFFFF] border border-[#111111] px-2 py-1 text-[11px] font-mono">
                      {m.label}: {m.minutes.toLocaleString()}m ({m.plays}x)
                    </div>
                    <div className="w-full flex-1 flex items-end border-b border-[#111111]">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full border border-[#111111] ${barColor} transition-transform duration-200 group-hover:-translate-y-0.5`}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[#111111] font-bold mt-2 truncate max-w-full uppercase">
                      {m.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center font-mono text-xs text-[#808080] border border-[#111111] p-4">
              Import Extended Streaming History (.ZIP / .JSON) to populate multi-month timeline blocks.
            </div>
          )}
        </div>

        {/* Sonic Structure & Vibe Index (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#111111]">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#0000FF]">
                <Sparkles className="w-4 h-4" />
                <span>[GRID 02] SONIC RATIO</span>
              </div>
              <span className="w-4 h-4 bg-[#0000FF] border border-[#111111] inline-block" />
            </div>

            <h3 className="text-2xl font-bold text-[#111111] mt-4">{stats.vibe.personaTitle}</h3>
            <p className="text-sm text-[#808080] mt-1 leading-relaxed">
              {stats.vibe.personaSubtitle}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {stats.vibe.personaTags.map((tag, idx) => (
                <span
                  key={tag}
                  className={`font-mono text-xs font-bold px-2.5 py-1 border border-[#111111] ${
                    idx === 0
                      ? 'bg-[#FFFF00] text-[#111111]'
                      : idx === 1
                      ? 'bg-[#FF0000] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#111111]'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3 pt-4 border-t border-[#111111]">
            {[
              { label: 'ENERGY & DRIVE', val: stats.vibe.energy, color: 'bg-[#FF0000]' },
              { label: 'RHYTHMIC CADENCE', val: stats.vibe.danceability, color: 'bg-[#0000FF]' },
              { label: 'TONAL VALENCE', val: stats.vibe.valence, color: 'bg-[#FFFF00]' },
              { label: 'ALBUM STRUCTURE', val: stats.vibe.albumCompleteness, color: 'bg-[#111111]' },
              { label: 'CATALOG BREADTH', val: stats.vibe.exploratoryScore, color: 'bg-[#FF0000]' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-[#111111] font-bold">{metric.label}</span>
                  <span className="text-[#111111] font-bold">{metric.val}%</span>
                </div>
                <div className="h-3 w-full border border-[#111111] bg-[#FFFFFF]">
                  <div
                    className={`h-full ${metric.color} border-r border-[#111111]`}
                    style={{ width: `${metric.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asymmetric Row 2 (8 cols / 4 cols): 24-Hour Clock + Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
        {/* 24-Hour Clock (8 cols) */}
        <div className="lg:col-span-8 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#111111] mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#111111]">
                <Clock className="w-4 h-4 text-[#FF0000]" />
                <span>[GRID 03] CIRCADIAN AXIS (24H)</span>
              </div>
              <h3 className="text-xl font-bold text-[#111111] mt-1">Listening by Hour of Day</h3>
            </div>
            <div className="font-mono text-xs bg-[#FF0000] text-[#FFFFFF] border border-[#111111] px-3 py-1 font-bold">
              PEAK: {formatHour(stats.peakHour)} ({stats.hourlyMinutes[stats.peakHour]?.toLocaleString() || 0}M)
            </div>
          </div>

          <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 pb-1">
            {stats.hourlyMinutes.map((min, hr) => {
              const pct = Math.max(6, Math.round((min / maxHourMin) * 100));
              const isPeak = hr === stats.peakHour;
              return (
                <div
                  key={hr}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 absolute -top-8 z-10 whitespace-nowrap bg-[#111111] text-[#FFFFFF] px-2 py-0.5 text-[10px] font-mono">
                    {formatHour(hr)}: {min.toLocaleString()}m
                  </div>
                  <div className="w-full flex-1 flex items-end border-b border-[#111111]">
                    <div
                      style={{ height: `${pct}%` }}
                      className={`w-full border border-[#111111] transition-colors duration-200 ${
                        isPeak
                          ? 'bg-[#FF0000]'
                          : 'bg-[#0000FF] group-hover:bg-[#FFFF00]'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-[#111111] font-bold mt-1.5">
                    {hr % 3 === 0 ? `${String(hr).padStart(2, '0')}H` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day of Week (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-[#FFFFFF]">
          <div className="flex items-center justify-between pb-4 border-b border-[#111111] mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#0000FF]">
                <Calendar className="w-4 h-4" />
                <span>[GRID 04] 7-DAY CADENCE</span>
              </div>
              <h3 className="text-xl font-bold text-[#111111] mt-1">Day of Week</h3>
            </div>
            <span className="font-mono text-xs bg-[#0000FF] text-[#FFFFFF] border border-[#111111] px-2.5 py-1 font-bold">
              {WEEKDAYS[stats.peakWeekday]}
            </span>
          </div>

          <div className="space-y-3">
            {WEEKDAYS.map((day, idx) => {
              const min = stats.weekdayMinutes[idx] || 0;
              const pct = Math.max(6, Math.round((min / maxWeekMin) * 100));
              const isPeak = idx === stats.peakWeekday;
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-10 font-mono text-xs font-bold text-[#111111]">{day}</span>
                  <div className="flex-1 h-4 border border-[#111111] bg-[#FFFFFF]">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full border-r border-[#111111] ${
                        isPeak ? 'bg-[#FF0000]' : 'bg-[#FFFF00]'
                      }`}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs font-bold text-[#111111]">
                    {min.toLocaleString()}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: 20-Week Mondrian Daily Consistency Matrix */}
      <div className="border-2 border-[#111111] bg-[#FFFFFF] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-[#111111] mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FF0000]">
              <Flame className="w-4 h-4" />
              <span>[GRID 05] DAILY LISTENING STREAK MATRIX</span>
            </div>
            <h3 className="text-xl font-bold text-[#111111] mt-1">
              Daily Listening Grid (140 Days)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="border-2 border-[#111111] bg-[#FFFF00] px-4 py-2">
              <span className="font-mono text-[10px] font-bold uppercase text-[#111111] block">
                ACTIVE STREAK
              </span>
              <span className="font-mono text-lg font-bold text-[#111111]">
                {stats.currentStreakDays} DAYS
              </span>
            </div>
            <div className="border-2 border-[#111111] bg-[#FF0000] text-[#FFFFFF] px-4 py-2">
              <span className="font-mono text-[10px] font-bold uppercase block">
                PEAK STREAK ({stats.longestStreakRange})
              </span>
              <span className="font-mono text-lg font-bold">
                {stats.longestStreakDays} DAYS
              </span>
            </div>
          </div>
        </div>

        {stats.dailyActivity.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[660px]">
              {heatmapDays.map((cell) => {
                const ratio = cell.minutes / maxDailyMin;
                const colorClass =
                  cell.minutes === 0
                    ? 'bg-[#FFFFFF]'
                    : ratio < 0.3
                    ? 'bg-[#FFFF00]'
                    : ratio < 0.65
                    ? 'bg-[#0000FF]'
                    : 'bg-[#FF0000]';
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.minutes} minutes listened`}
                    className={`w-4 h-4 border border-[#111111] ${colorClass} transition-transform duration-200 hover:scale-125`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-[#808080] mt-4 pt-3 border-t border-[#111111]">
              <span className="inline-flex items-center gap-1.5 text-[#111111]">
                <Activity className="w-3.5 h-3.5 text-[#FF0000]" />
                Inspect any rectangle for daily minutes
              </span>
              <div className="flex items-center gap-2 text-[#111111] font-bold">
                <span>0M</span>
                <span className="w-3.5 h-3.5 border border-[#111111] bg-[#FFFFFF] inline-block" />
                <span className="w-3.5 h-3.5 border border-[#111111] bg-[#FFFF00] inline-block" />
                <span className="w-3.5 h-3.5 border border-[#111111] bg-[#0000FF] inline-block" />
                <span className="w-3.5 h-3.5 border border-[#111111] bg-[#FF0000] inline-block" />
                <span>PEAK</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center font-mono text-xs text-[#808080] border border-[#111111]">
            Import your Spotify Streaming History JSON/ZIP to populate the 140-day activity matrix.
          </div>
        )}
      </div>
    </div>
  );
};
