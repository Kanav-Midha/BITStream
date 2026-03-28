"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyticsChartDatum } from "@/backend/analytics/types";
import { formatWatchTime } from "@/backend/analytics/utils";

interface ProfileChartsProps {
  categoryBreakdown: AnalyticsChartDatum[];
  dailyEngagement: AnalyticsChartDatum[];
}

export function ProfileCharts({ categoryBreakdown, dailyEngagement }: ProfileChartsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[2rem] border border-border/70 bg-card/45 p-5">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Engagement</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Last 7 days</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyEngagement}>
              <defs>
                <linearGradient id="watchTimeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#f0d6a8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f0d6a8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#8fa3bd" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#8fa3bd"
                tickFormatter={(value) => formatWatchTime(Number(value))}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  background: "#111c2c",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  color: "#fff",
                }}
                formatter={(value: number) => [formatWatchTime(value), "Watch time"]}
              />
              <Area dataKey="value" stroke="#f0d6a8" strokeWidth={3} fill="url(#watchTimeGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card/45 p-5">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Preferences</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Category watch time</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis
                type="number"
                stroke="#8fa3bd"
                tickFormatter={(value) => formatWatchTime(Number(value))}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#8fa3bd"
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <Tooltip
                contentStyle={{
                  background: "#111c2c",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  color: "#fff",
                }}
                formatter={(value: number) => [formatWatchTime(value), "Watch time"]}
              />
              <Bar dataKey="value" fill="#6b9cff" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
