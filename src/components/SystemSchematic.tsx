import React, { useMemo, useState } from 'react'
import type { SimulationStep } from './simulation'

const PIPE_X0 = 120
const PIPE_X1 = 504
const PIPE_Y_TOP = 148
const PIPE_Y_BTM = 178
const PIPE_CY = 163

const TANK_X = 40
const TANK_Y = 60
const TANK_W = 76
const TANK_H = 168
const TANK_BTM = TANK_Y + TANK_H

const PROFILE_Y_HI = 60
const PROFILE_Y_LO = 135

const VALVE_X = 506
const VALVE_Y = 148

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function mapHeadToY(H: number, maxH: number): number {
  const norm = clamp(H / Math.max(maxH, 0.01), 0, 1)
  return PROFILE_Y_LO - norm * (PROFILE_Y_LO - PROFILE_Y_HI)
}

interface SystemSchematicProps {
  currentStep: SimulationStep
  allSteps: SimulationStep[] // Pass the full history array to extract dynamic initial boundaries
  solverType?: 'basic' | 'advanced'
}

export const SystemSchematic: React.FC<SystemSchematicProps> = ({
  currentStep,
  allSteps = [],
  solverType = 'advanced',
}) => {
  const { time, H_res, nodes } = currentStep
  const isAdvanced = solverType === 'advanced'

  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null)

  // ── DYNAMIC BOUNDARY VALUE COUPLING ──────────────────────────────────────
  // Extract parameters straight out of the runtime step history to match the current solver exactly
  const initialStep = allSteps[0] || currentStep

  const H_res_initial = initialStep.H_res
  const valveNodeInitial = initialStep.nodes[initialStep.nodes.length - 1]
  const H_valve_initial = valveNodeInitial ? valveNodeInitial.H : 0.01

  const valveNode = nodes[nodes.length - 1]

  // Calculate dynamic tau based on the closing valve configuration values in the actual step arrays
  const tau = useMemo(() => {
    if (!valveNode || H_valve_initial === 0) return 1.0
    // Real-time calculation derived purely from the current discharge characteristics relative to starting point
    if (Math.abs(initialStep.nodes[initialStep.nodes.length - 1].Q) < 1e-6)
      return 1.0

    // Using the hydraulic system's boundary relation: Q_t = tau * Q_0 * sqrt(H_t / H_0)
    const currentQ = valveNode.Q
    const initialQ = initialStep.nodes[initialStep.nodes.length - 1].Q
    const headRatio = Math.sqrt(Math.max(0, valveNode.H / H_valve_initial))

    if (headRatio < 1e-4) return currentQ > 1e-5 ? 1.0 : 0.3
    return clamp(currentQ / (initialQ * headRatio), 0.3, 1.0)
  }, [valveNode, initialStep, H_valve_initial])

  // Set alert thresholds safely based on scale profiles
  const surgeThreshold = isAdvanced ? 4.5 : H_res_initial * 1.5
  const isSurge = valveNode ? valveNode.H > surgeThreshold : false
  const isEmpty = H_res <= 0.005

  // Enforce global peak context mapping for layout aspect calculation boundaries
  const maxGlobalHead = useMemo(() => {
    if (allSteps.length === 0) return Math.max(...nodes.map((n) => n.H), 0.01)
    return Math.max(
      ...allSteps.flatMap((step) => step.nodes.map((n) => n.H)),
      0.01,
    )
  }, [allSteps, nodes])

  // Reservoir structural fill parameters
  const fillPct = clamp(H_res / Math.max(H_res_initial, 0.01), 0, 1)
  const waterHeight = fillPct * TANK_H
  const waterY = TANK_BTM - waterHeight

  // Node position translations
  const nodeCount = nodes.length
  const nodeXs = nodes.map(
    (_, i) => PIPE_X0 + (i * (PIPE_X1 - PIPE_X0)) / (nodeCount - 1),
  )

  const profilePoints = nodes
    .map((n, i) => `${nodeXs[i]},${mapHeadToY(n.H, maxGlobalHead)}`)
    .join(' ')

  const stemY2 = -14 + (1 - tau) * 10
  const wheelY = -22 + (1 - tau) * 10

  const upstreamQ = nodes[0]?.Q ?? 0
  const flowAlpha = Math.abs(upstreamQ) > 0.0001 ? 0.75 : 0.1

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-800 dark:bg-zinc-950 dark:text-slate-100">
      {/* ── Header Area ────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            System Operational Schematic
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive system boundaries extracted directly from the calculator
            engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSurge && (
            <span className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Transient Peak Active
            </span>
          )}
          <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <span className="text-slate-400 mr-1 text-[10px]">TIME:</span>
              <span className="font-bold">{time.toFixed(3)}s</span>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400 mr-1 text-[10px]">VALVE τ:</span>
              <span className="font-bold">{tau.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SVG Graphic Canvas ────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden rounded border border-slate-200 bg-slate-50/30 dark:border-slate-800 dark:bg-zinc-900/20">
        {/* Dynamic Tooltip Popover */}
        {activeNodeIndex !== null && nodes[activeNodeIndex] && (
          <div
            className="absolute z-10 pointer-events-none rounded border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-zinc-900 dark:text-slate-300"
            style={{
              left: `${(nodeXs[activeNodeIndex] / 680) * 100}%`,
              top: `${(PIPE_Y_TOP / 340) * 100 - 22}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold text-slate-400 uppercase text-[9px] mb-0.5">
              Section Node {activeNodeIndex}
            </div>
            <div className="flex justify-between gap-4">
              <span>Piezometric Head (H):</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {nodes[activeNodeIndex].H.toFixed(3)} m
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Discharge (Q):</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {(nodes[activeNodeIndex].Q * 1000).toFixed(2)} L/s
              </span>
            </div>
            <div className="absolute left-1/2 bottom-0 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-zinc-900" />
          </div>
        )}

        <svg
          viewBox="0 0 680 340"
          width="100%"
          style={{ display: 'block' }}
          className="text-slate-300 dark:text-slate-700"
        >
          <defs>
            <marker
              id="sc-arr"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path
                d="M2 1L8 5L2 9"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>

          {/* Reference Ground Plane */}
          <line
            x1="20"
            y1="234"
            x2="660"
            y2="234"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* ══ RESERVOIR MODULE ═════════════════════════════════════════ */}
          <rect
            x={TANK_X}
            y={TANK_Y}
            width={TANK_W}
            height={TANK_H}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {waterHeight > 0 && (
            <rect
              x={TANK_X + 1.5}
              y={waterY}
              width={TANK_W - 3}
              height={waterHeight - 1.5}
              fill="#3b82f6"
              opacity="0.12"
            />
          )}
          {waterHeight > 2 && (
            <line
              x1={TANK_X}
              y1={waterY}
              x2={TANK_X + TANK_W}
              y2={waterY}
              stroke="#2563eb"
              strokeWidth="1.5"
            />
          )}
          <text
            x={TANK_X + TANK_W / 2}
            y={TANK_Y - 10}
            textAnchor="middle"
            fontSize="11"
            className="font-mono font-bold fill-slate-700 dark:fill-slate-300"
          >
            {H_res.toFixed(3)} m
          </text>
          <text
            x={TANK_X + TANK_W / 2}
            y={TANK_BTM + 16}
            textAnchor="middle"
            fontSize="10"
            className="font-medium fill-slate-400"
          >
            Reservoir
          </text>

          {/* ══ PIPE CONDUIT ASSEMBLY ═══════════════════════════════════ */}
          <rect
            x={PIPE_X0}
            y={PIPE_Y_TOP}
            width={PIPE_X1 - PIPE_X0}
            height={PIPE_Y_BTM - PIPE_Y_TOP}
            fill="none"
            stroke={isSurge ? '#ef4444' : 'currentColor'}
            strokeWidth="1.5"
          />

          {/* Flow Vector Indicators */}
          <style>{`
            @keyframes flowAnim { to { stroke-dashoffset: -20; } }
            .vector-flow-line {
              stroke-dasharray: 6 6;
              animation: flowAnim 1.2s linear infinite;
            }
          `}</style>
          {[160, 280, 400].map((x, i) => (
            <line
              key={i}
              className="vector-flow-line"
              x1={x}
              y1={PIPE_CY}
              x2={x + 60}
              y2={PIPE_CY}
              stroke="#2563eb"
              strokeWidth="1.2"
              opacity={flowAlpha}
              markerEnd="url(#sc-arr)"
            />
          ))}

          {/* ── Discretization Nodes ── */}
          {nodes.map((n, i) => {
            const px = nodeXs[i]
            const norm = clamp(n.H / maxGlobalHead, 0, 1)

            // Dynamic check: node pops bright engineering red if its local step head spikes
            const isNodeSpiked = n.H > surgeThreshold
            const dotFill = isNodeSpiked ? '#ef4444' : '#3b82f6'
            const dotRadius = isNodeSpiked ? 5.5 : 3 + norm * 2

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setActiveNodeIndex(i)}
                onMouseLeave={() => setActiveNodeIndex(null)}
              >
                <circle cx={px} cy={PIPE_CY} r="14" fill="transparent" />
                <line
                  x1={px}
                  y1={PIPE_Y_TOP}
                  x2={px}
                  y2={PIPE_Y_TOP - 4}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-800"
                />
                <circle
                  cx={px}
                  cy={PIPE_CY}
                  r={dotRadius}
                  fill={dotFill}
                  opacity={isNodeSpiked ? 0.95 : 0.3 + norm * 0.6}
                  className="transition-all duration-150"
                />
              </g>
            )
          })}

          <text
            x={312}
            y={196}
            textAnchor="middle"
            fontSize="10"
            className="font-mono font-medium fill-slate-400"
          >
            L = {isAdvanced ? '600m' : '3750m'} | Mesh Nodes = {nodeCount}
          </text>

          {/* ══ TRANSIENT PROFILE Sparkline ══════════════════════════════ */}
          <line
            x1={PIPE_X0}
            y1={PROFILE_Y_LO}
            x2={PIPE_X1}
            y2={PROFILE_Y_LO}
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2 2"
            className="text-slate-200 dark:text-slate-800"
          />
          <polyline
            points={profilePoints}
            fill="none"
            stroke={isSurge ? '#ef4444' : '#2563eb'}
            strokeWidth="1.5"
          />
          <text
            x={PIPE_X0}
            y={PROFILE_Y_HI - 6}
            fontSize="10"
            className="font-semibold fill-slate-400"
          >
            H(x) Transient Piezometric Profile
          </text>

          {/* ══ VALVE MECHANISM ══════════════════════════════════════════ */}
          <g transform={`translate(${VALVE_X}, ${VALVE_Y})`}>
            <rect
              x="0"
              y="0"
              width="44"
              height="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <polygon
              points="2,2 2,28 20,15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-slate-500"
            />
            <polygon
              points="42,2 42,28 24,15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-slate-500"
            />

            <line
              x1="22"
              y1="0"
              x2="22"
              y2={stemY2}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-slate-500"
            />
            <line
              x1="12"
              y1={wheelY}
              x2="32"
              y2={wheelY}
              stroke={isSurge ? '#ef4444' : '#2563eb'}
              strokeWidth="2"
            />

            <text
              x="22"
              y="-30"
              textAnchor="middle"
              fontSize="10"
              className="font-medium fill-slate-400"
            >
              Valve
            </text>
          </g>
        </svg>
      </div>

      {/* ── Data Metrics Foot Grid ────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-zinc-900/50">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Reservoir Head
          </span>
          <span className="mt-1 block font-mono text-base font-bold text-slate-800 dark:text-slate-200">
            {H_res.toFixed(3)} m
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-zinc-900/50">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Discharge at Valve
          </span>
          <span className="mt-1 block font-mono text-base font-bold text-slate-800 dark:text-slate-200">
            {valveNode ? (valveNode.Q * 1000).toFixed(2) : '—'} L/s
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-zinc-900/50">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Piezometric Head at Valve
          </span>
          <span
            className={`mt-1 block font-mono text-base font-bold ${isSurge ? 'text-red-500 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}
          >
            {valveNode ? valveNode.H.toFixed(3) : '—'} m
          </span>
        </div>
      </div>
    </div>
  )
}
