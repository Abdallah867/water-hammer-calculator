import { createFileRoute } from '@tanstack/react-router'

import { SystemSchematic } from '#/components/SystemSchematic'
import { AdvancedWaterHammerSolver } from '#/lib/AdvancedWaterHammerSolver'
import type { IWaterHammerSolver } from '#/lib/simulation'
import { WaterHammerSolver } from '#/lib/WaterHamerSolver'
import {
  Activity,
  AlertTriangle,
  Droplet,
  Play,
  RefreshCw,
  Wind,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  SimulationConfigDialog,
  type SimulationConfig,
} from '#/components/ConfigurationDialog'
import { SimulationCharts } from '#/components/SimulationCharts'
import { TransientDashboard } from '#/components/TransientDashboard'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [solverType, setSolverType] = useState<'basic' | 'advanced'>('basic')
  const [timeStepIndex, setTimeStepIndex] = useState(0)
  const [dynamicConfig, setDynamicConfig] = useState<SimulationConfig | null>(
    null,
  )

  // Swapping engine objects dynamically via the interface
  const currentSolver: IWaterHammerSolver = useMemo(() => {
    return solverType === 'basic'
      ? new WaterHammerSolver()
      : new AdvancedWaterHammerSolver()
  }, [solverType])

  // Inside your primary control layout component:
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  const handleStartSimulation = (dynamicConfig: SimulationConfig) => {
    // Construct your MOC class instance instantly with dynamic parameters
    const runner = new AdvancedWaterHammerSolver()
    const results = runner.simulate(5000)
    setTimeStepIndex(0)
  }

  // Triggers recalculation on switch automatically
  const results = useMemo(() => currentSolver.simulate(1999), [currentSolver])
  const currentStep = results[timeStepIndex] || results[0]

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      {/* --- HEADER --- */}
      <header className="mb-8 flex items-center justify-between">
        <SimulationConfigDialog
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfirmRun={handleStartSimulation}
        />

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Transient Hydraulic Simulation
          </h1>
          <p className="text-slate-500 text-sm">
            Method of Characteristics (MOC) Solver
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setTimeStepIndex(0)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} /> Reset
          </button>

          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all">
            <Play size={16} /> Run Simulation
          </button>
        </div>
      </header>

      {/* --- METRIC CARDS --- */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard
          icon={<Droplet className="text-blue-500" />}
          label="Initial Flow"
          value={currentStep.nodes[0].Q.toFixed(4)}
          unit="m³/s"
        />
        <MetricCard
          icon={<Wind className="text-indigo-500" />}
          label="Wave Speed"
          value={300}
          unit="m/s"
        />
        <MetricCard
          icon={<Activity className="text-red-500" />}
          label="Max Pressure"
          value={Math.max(...currentStep.nodes.map((n) => n.H)).toFixed(1)}
          unit="m"
          highlight
        />
        <MetricCard
          icon={<AlertTriangle className="text-amber-500" />}
          label="Current Time"
          value={currentStep.time.toFixed(2)}
          unit="sec"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- MAIN CALCULATION TABLE --- */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="font-semibold text-slate-700">
              Detailed Node Analysis
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Node (x)</th>
                  <th className="px-6 py-3">Cp</th>
                  <th className="px-6 py-3">Cn</th>
                  <th className="px-6 py-3 text-right">Flow (Q)</th>
                  <th className="px-6 py-3 text-right">Head (H)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentStep.nodes.map((node, i) => {
                  const isShock = node.H > 150
                  return (
                    <tr
                      key={i}
                      className={`group hover:bg-blue-50/30 transition-colors ${isShock ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {node.x}m
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {node.Cp ? node.Cp.toFixed(4) : '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {node.Cn ? node.Cn.toFixed(4) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-blue-600">
                        {node.Q.toFixed(4)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-mono font-bold ${isShock ? 'text-red-600' : 'text-slate-800'}`}
                      >
                        {node.H.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CONTROLS & INFO --- */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-700">
              Simulation Timeline
            </h3>
            <input
              type="range"
              min="0"
              max={results.length - 1}
              value={timeStepIndex}
              onChange={(e) => setTimeStepIndex(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Steady State</span>
              <span>Reflected</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-700">
              Reservoir Head Mode
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => setSolverType('basic')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                  solverType === 'basic'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Constant
              </button>

              <button
                onClick={() => setSolverType('advanced')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                  solverType === 'advanced'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Variable
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Controls reservoir boundary condition behavior
            </p>
          </div>
        </div>
      </div>
      {/* <SimulationCharts currentStep={currentStep} solverType={solverType} /> */}
      <SystemSchematic
        currentStep={currentStep}
        allSteps={results}
        solverType={solverType}
      />

      {/* <SimulationCharts
        currentStep={currentStep}
        allSteps={results}
        solverType={solverType}
      /> */}
      <TransientDashboard
        simulationHistory={results}
        totalNodes={currentStep.nodes.length - 1}
      />
    </div>
  )
}

const MetricCard = ({ icon, label, value, unit, highlight = false }) => (
  <div
    className={`rounded-xl border p-5 shadow-sm transition-all ${highlight ? 'border-red-100 bg-red-50/30' : 'border-slate-200 bg-white'}`}
  >
    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
      {icon} {label}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-black text-slate-800">{value}</span>
      <span className="text-xs font-medium text-slate-500">{unit}</span>
    </div>
  </div>
)

export default RouteComponent
