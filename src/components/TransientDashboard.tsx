import type { SimulationStep } from '#/lib/simulation'
import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TransientDashboardProps {
  simulationHistory: SimulationStep[]
  totalNodes: number
}

export const TransientDashboard: React.FC<TransientDashboardProps> = ({
  simulationHistory,
  totalNodes,
}) => {
  // Track which physical spatial node index to view on the timeline graphs
  const [selectedNode, setSelectedNode] = useState<number>(totalNodes) // Defaults to the Valve end

  if (!simulationHistory || simulationHistory.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed border-slate-200 text-xs font-mono text-slate-400 dark:border-slate-800">
        No tracking history loaded. Trigger the MOC solver to generate plots.
      </div>
    )
  }

  const chartData = simulationHistory.map((step) => {
    const activeNode = step.nodes[selectedNode]
    return {
      time: parseFloat(step.time.toFixed(3)),
      head: activeNode ? parseFloat(activeNode.H.toFixed(2)) : 0,
      flow: activeNode ? parseFloat((activeNode.Q * 1000).toFixed(2)) : 0, // Convert m³/s to L/s for readable scale
      hRes: parseFloat(step.H_res.toFixed(3)),
    }
  })

  return (
    <div className="w-full bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-100 mt-6 rounded-xl border border-slate-200 p-4 shadow-sm">
      {/* Dynamic Spatial Node Selection Bar - Flat Border Profile */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs dark:border-slate-800 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-slate-400">
            Target Station:
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalNodes + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedNode(idx)}
                className={`h-7 rounded border px-3 font-bold transition-colors ${
                  selectedNode === idx
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-zinc-900 dark:text-slate-400 dark:hover:bg-zinc-800'
                }`}
              >
                {idx === 0
                  ? '0 (Res)'
                  : idx === totalNodes
                    ? `${idx} (Valve)`
                    : idx}
              </button>
            ))}
          </div>
        </div>

        {/* Global Structural Metrics Box */}
        <div className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            RESERVOIR HEAD:{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {chartData[chartData.length - 1]?.hRes} m
            </span>
          </div>
          <div>
            TIME STEPS:{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {simulationHistory.length} frames
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* GRAPH 1: PIEZOMETRIC HEAD PROFILE (H vs t) */}
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-zinc-950">
          <div className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Piezometric Head ($H$) over Time
          </div>
          <div className="h-72 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  className="dark:hidden"
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e1e2f"
                  className="hidden dark:block"
                />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tickLine={false}
                  label={{
                    value: 'Time (s)',
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend verticalAlign="top" height={36} iconType="square" />
                <Line
                  type="monotone"
                  dataKey="head"
                  name="Pressure Head (m)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 2: DISCHARGE VELOCITY PROFILE (Q vs t) */}
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-zinc-950">
          <div className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Pipeline Discharge ($Q$) over Time
          </div>
          <div className="h-72 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  className="dark:hidden"
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e1e2f"
                  className="hidden dark:block"
                />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tickLine={false}
                  label={{
                    value: 'Time (s)',
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend verticalAlign="top" height={36} iconType="square" />
                <Line
                  type="monotone"
                  dataKey="flow"
                  name="Discharge Flow (L/s)"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
