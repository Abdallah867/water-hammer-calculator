import type { SimulationStep } from '#/lib/simulation'
import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SimulationChartsProps {
  currentStep: SimulationStep
  solverType: 'basic' | 'advanced'
}

export const SimulationCharts: React.FC<SimulationChartsProps> = ({
  currentStep,
  solverType,
}) => {
  // Format data for the chart: mapping the nodes array directly
  const chartData = currentStep.nodes.map((node) => ({
    distance: `${node.x}m`,
    Head: parseFloat(node.H.toFixed(2)),
    Flow: parseFloat((node.Q * 1000).toFixed(2)), // Convert m³/s to L/s for readable scales
  }))

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mt-6">
      {/* --- HEAD PROFILE GRAPH --- */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
            Piezometric Head Profile
          </h3>
          <p className="text-xs text-slate-400">
            Total energy gradient along the pipe at t ={' '}
            {currentStep.time.toFixed(2)}s
          </p>
        </div>

        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="distance" stroke="#94a3b8" tickLine={false} />
              <YAxis
                stroke="#dc2626"
                tickLine={false}
                domain={solverType === 'basic' ? [0, 250] : [0, 10]} // Adapts scale beautifully based on physics exercise
                label={{
                  value: 'Head (m)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#dc2626',
                  offset: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                }}
                labelClassName="font-semibold text-slate-700"
              />
              <Line
                type="monotone"
                dataKey="Head"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- FLOW RATE PROFILE GRAPH --- */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
            Discharge Profile
          </h3>
          <p className="text-xs text-slate-400">
            Flow rate dynamics along the pipe segments at t ={' '}
            {currentStep.time.toFixed(2)}s
          </p>
        </div>

        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="distance" stroke="#94a3b8" tickLine={false} />
              <YAxis
                stroke="#2563eb"
                tickLine={false}
                label={{
                  value: 'Flow (L/s)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#2563eb',
                  offset: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                }}
                labelClassName="font-semibold text-slate-700"
              />
              <Line
                type="monotone"
                dataKey="Flow"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
