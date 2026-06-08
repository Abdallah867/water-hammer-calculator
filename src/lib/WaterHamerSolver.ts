import type {
  IWaterHammerSolver,
  NodeState,
  SimulationStep,
} from './simulation'

export class WaterHammerSolver implements IWaterHammerSolver {
  private readonly L = 600
  private readonly a = 300
  private readonly D = 0.05
  private readonly f = 0.04
  private readonly k = 0.1
  private readonly H_res_initial = 2 // Rename to keep track of initial height
  private readonly Q0 = 0.01 // 10 L/s = 0.01 m³/s
  private readonly g = 9.81
  private readonly n = 6

  //   private readonly L = 3750
  //   private readonly a = 1250
  //   private readonly D = 0.4
  //   private readonly f = 0.05
  //   private readonly k = 0.5
  //   private readonly H_res = 80
  //   private readonly Q0 = 0.176
  //   private readonly g = 9.81
  //   private readonly n = 3

  // Reservoir parameters
  private readonly D_res = 0.8
  private readonly A_res = (Math.PI * Math.pow(0.8, 2)) / 4

  // Valve parameters
  private readonly t_closure = 10.0 // tf = 10s
  private readonly tau_final = 0.3 // Drops down to 0.3

  private readonly dx: number
  private readonly dt: number
  private readonly A: number
  private readonly Ca: number
  private readonly R: number

  // Steady state valve values needed for your handwritten Cv formula
  private readonly H0_valve: number

  constructor() {
    this.dx = this.L / this.n
    this.dt = this.dx / this.a
    this.A = (Math.PI * Math.pow(this.D, 2)) / 4
    this.Ca = (this.g * this.A) / this.a
    this.R = this.f / (2 * this.D * this.A)

    // Calculate initial head at the valve (node n) to use as H0 in your Cv equation
    const initialNodes = this.getInitialState(this.H_res_initial)
    this.H0_valve = initialNodes[this.n].H
  }

  private getInitialState(currentHRes: number): NodeState[] {
    const kineticTerm =
      Math.pow(this.Q0, 2) / (2 * this.g * Math.pow(this.A, 2))
    const nodes: NodeState[] = []
    for (let i = 0; i <= this.n; i++) {
      const x = i * this.dx
      const H = currentHRes - (1 + this.k + (this.f * x) / this.D) * kineticTerm
      nodes.push({ x, H, Q: this.Q0, Cp: null, Cn: null })
    }
    return nodes
  }

  public simulate(maxSteps: number): SimulationStep[] {
    // Track the moving reservoir height dynamically
    const currentH_res = this.H_res_initial

    let currentNodes = this.getInitialState(currentH_res)
    const history: SimulationStep[] = [
      { time: 0, H_res: currentH_res, nodes: currentNodes },
    ]

    for (let step = 1; step <= maxSteps; step++) {
      const t = step * this.dt

      const nextNodes: NodeState[] = new Array(this.n + 1)
      const cpArray = new Array(this.n + 1).fill(null)
      const cnArray = new Array(this.n + 1).fill(null)

      // 1. Calculate Characteristics (Cp and Cn)
      for (let i = 0; i <= this.n; i++) {
        if (i > 0) {
          const prevL = currentNodes[i - 1]
          cpArray[i] =
            prevL.Q +
            this.Ca * prevL.H -
            this.R * this.dt * prevL.Q * Math.abs(prevL.Q)
        }
        if (i < this.n) {
          const prevR = currentNodes[i + 1]
          cnArray[i] =
            prevR.Q -
            this.Ca * prevR.H +
            this.R * this.dt * prevR.Q * Math.abs(prevR.Q)
        }
      }

      // 2. Calculate current tau according to your sketch's linear profile
      let tau = 0
      if (t <= this.t_closure) {
        // Linear drop from 1.0 down to 0.3
        tau = 1.0 - (1.0 - this.tau_final) * (t / this.t_closure)
      } else {
        tau = this.tau_final
      }

      // 4. Solve nodes
      for (let i = 0; i <= this.n; i++) {
        let H_new = 0,
          Q_new = 0

        if (i === 0) {
          // Reservoir Boundary Node (Uses updated currentH_res)
          const isInverse = currentNodes[0].Q < 0
          const lossCoeff = isInverse ? -this.k : this.k
          const k1 =
            (this.Ca * (1 + lossCoeff)) / (2 * this.g * Math.pow(this.A, 2))
          Q_new =
            (-1 +
              Math.sqrt(1 + 4 * k1 * (cnArray[0] + this.Ca * currentH_res))) /
            (2 * k1)
          H_new =
            currentH_res -
            (1 + lossCoeff) *
              (Math.pow(Q_new, 2) / (2 * this.g * Math.pow(this.A, 2)))
        } else if (i === this.n) {
          // Valve Boundary Node (Matches your handwritten notes exactly)
          const cp = cpArray[this.n]

          // Calculate your handwriting's intermediate Cv variable
          const Cv_step =
            (Math.pow(tau, 2) * Math.pow(this.Q0, 2)) /
            (this.Ca * this.H0_valve)

          // Implementation of your exact handwritten Qp quadratic equation formula
          Q_new =
            -0.5 *
            (Cv_step - Math.sqrt(Math.pow(Cv_step, 2) + 4 * Cv_step * cp))
          H_new = (cp - Q_new) / this.Ca
        } else {
          // Interior Nodes
          H_new = (cpArray[i] - cnArray[i]) / (2 * this.Ca)
          Q_new = (cpArray[i] + cnArray[i]) / 2
        }

        nextNodes[i] = {
          x: i * this.dx,
          H: H_new,
          Q: Q_new,
          Cp: cpArray[i],
          Cn: cnArray[i],
        }
      }

      currentNodes = nextNodes
      history.push({ time: t, H_res: currentH_res, nodes: currentNodes })
    }
    return history
  }
}
