import React, { useState } from 'react'

/**
 * Structural definition of the customizable simulation parameters
 */
export interface SimulationConfig {
  L: number // Pipe Length (m)
  a: number // Wave Speed (m/s)
  D: number // Pipe Diameter (m)
  f: number // Friction Factor
  k: number // Minor Loss Coefficient / Valve Parameter
  H_res: number // Reservoir Head (m)
  Q0: number // Initial Flow Rate (m³/s)
  g: number // Gravity (m/s²)
  n: number // Number of Mesh Segments
}

interface ConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirmRun: (config: SimulationConfig) => void
}

export const SimulationConfigDialog: React.FC<ConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfirmRun,
}) => {
  const [config, setConfig] = useState<SimulationConfig>({
    L: 3750,
    a: 1250,
    D: 0.4,
    f: 0.05,
    k: 0.5,
    H_res: 80,
    Q0: 0.176,
    g: 9.81,
    n: 3,
  })

  if (!isOpen) return null

  const handleInputChange = (key: keyof SimulationConfig, value: string) => {
    const numValue = parseFloat(value)

    // Controlled fallback logic during live typing:
    // Allow zero or empty state temporarily so users can delete and re-type,
    // but convert absolute values to strip immediate negative signs.
    setConfig((prev) => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : Math.abs(numValue),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Final sweep sanitization: enforce hard physical floors right before solver loop starts
    const absoluteConfig = {
      L: Math.max(0.1, config.L), // Avoid 0 length pipe
      a: Math.max(1, config.a), // Wave speed must be positive
      D: Math.max(0.001, config.D), // Prevent division by zero via diameter
      f: Math.max(0, config.f), // Friction can be 0 (ideal) but not negative
      k: Math.max(0, config.k), // Minor losses cannot be negative
      H_res: Math.max(0.1, config.H_res), // Reservoir head must be positive
      Q0: Math.max(0, config.Q0), // Steady-state flow rate floor
      g: Math.max(0.1, config.g), // Gravity field floor
      n: Math.max(1, Math.round(config.n)), // Enforce integer node segments
    }

    onConfirmRun(absoluteConfig)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm">
      {/* Container - Completely flat, shadowless, structural micro-border */}
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-800 dark:bg-zinc-950 dark:text-slate-100">
        {/* Modal Header */}
        <div className="mb-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Configure Method of Characteristics Solver
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Adjust hydraulic boundaries and grid discretization segments prior
            to execution loop initialization.
          </p>
        </div>

        {/* Input Formulation Grid */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs">
            {/* L */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Pipe Length (L - m)
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={config.L || ''}
                onChange={(e) => handleInputChange('L', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* a */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Wave Speed (a - m/s)
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={config.a || ''}
                onChange={(e) => handleInputChange('a', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* D */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Diameter (D - m)
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={config.D || ''}
                onChange={(e) => handleInputChange('D', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* f */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Friction Coefficient (f)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={config.f === 0 ? '0' : config.f || ''}
                onChange={(e) => handleInputChange('f', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* k */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Minor Loss (k)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={config.k === 0 ? '0' : config.k || ''}
                onChange={(e) => handleInputChange('k', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* H_res */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Reservoir Head (Hres - m)
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={config.H_res || ''}
                onChange={(e) => handleInputChange('H_res', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* Q0 */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                Initial Flow (Q0 - m³/s)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={config.Q0 === 0 ? '0' : config.Q0 || ''}
                onChange={(e) => handleInputChange('Q0', e.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-zinc-900/50 dark:focus:border-blue-400"
              />
            </div>

            {/* n */}
            <div className="flex flex-col gap-1">
              <label className="font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase">
                Mesh Segments (n - Spatial Nodes)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={config.n || ''}
                onChange={(e) => handleInputChange('n', e.target.value)}
                className="h-9 rounded border border-blue-200 bg-blue-50/20 px-3 font-bold text-blue-600 outline-none focus:border-blue-500 dark:border-blue-900/40 dark:bg-blue-950/10 dark:text-blue-400"
              />
            </div>
          </div>

          {/* Action Trigger Block Footer */}
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded border border-slate-200 px-4 font-sans text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 rounded border border-blue-600 bg-blue-600 px-4 font-sans text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Compute Transients
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
