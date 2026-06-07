export interface NodeState {
  x: number
  H: number
  Q: number
  Cp: number | null
  Cn: number | null
}

export interface SimulationStep {
  time: number
  H_res: number // Tracks reservoir level (constant for basic, dynamic for advanced)
  nodes: NodeState[]
}

// The core contract your React components will interact with
export interface IWaterHammerSolver {
  simulate(maxSteps: number): SimulationStep[]
}
