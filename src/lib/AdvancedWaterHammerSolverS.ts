// import type {
//   IWaterHammerSolver,
//   NodeState,
//   SimulationStep,
// } from './simulation'

// export class AdvancedWaterHammerSolver implements IWaterHammerSolver {
//   private readonly L = 600
//   private readonly a = 300
//   private readonly D_pipe = 0.05
//   private readonly f = 0.04
//   private readonly k = 0.5
//   private readonly Q0 = 0.01
//   private readonly g = 9.81
//   private readonly n = 6

//   // Reservoir parameters
//   private readonly D_res = 0.8
//   private readonly A_res = (Math.PI * 0.8 ** 2) / 4
//   private readonly H_res_init = 2.0

//   // Valve parameters
//   private readonly tau_final = 0.3
//   private readonly t_closure = 10.0

//   // Derived constants
//   private readonly dx: number
//   private readonly dt: number
//   private readonly A_pipe: number
//   private readonly Ca: number
//   private readonly R: number

//   constructor() {
//     this.dx = this.L / this.n
//     this.dt = this.dx / this.a
//     this.A_pipe = (Math.PI * Math.pow(this.D_pipe, 2)) / 4
//     this.Ca = (this.g * this.A_pipe) / this.a
//     this.R = this.f / (2 * this.D_pipe * this.A_pipe)
//   }

//   private getInitialState(): NodeState[] {
//     const kineticTerm =
//       Math.pow(this.Q0, 2) / (2 * this.g * Math.pow(this.A_pipe, 2))
//     const nodes: NodeState[] = []
//     for (let i = 0; i <= this.n; i++) {
//       const x = i * this.dx
//       const H =
//         this.H_res_init -
//         (1 + this.k + (this.f * x) / this.D_pipe) * kineticTerm
//       nodes.push({ x, H, Q: this.Q0, Cp: null, Cn: null })
//     }
//     return nodes
//   }

//   private getValveOpeningRatio(t: number): number {
//     if (t >= this.t_closure) return this.tau_final
//     return 1.0 - (1.0 - this.tau_final) * (t / this.t_closure)
//   }

//   public simulate(maxSteps: number): SimulationStep[] {
//     let currentNodes = this.getInitialState()
//     let currentH_res = this.H_res_init
//     const H0_valve = Math.max(0.01, currentNodes[this.n].H)

//     const history: SimulationStep[] = [
//       { time: 0, H_res: currentH_res, nodes: currentNodes },
//     ]

//     for (let step = 1; step <= maxSteps; step++) {
//       const t = step * this.dt
//       const nextNodes: NodeState[] = new Array(this.n + 1)

//       const cpArray = new Array(this.n + 1).fill(0)
//       const cnArray = new Array(this.n + 1).fill(0)

//       // 1. Calculate Compatibility Equations (C+ and C-)
//       for (let i = 0; i <= this.n; i++) {
//         if (i > 0) {
//           const prevL = currentNodes[i - 1]
//           cpArray[i] =
//             prevL.Q +
//             this.Ca * prevL.H -
//             this.R * this.dt * prevL.Q * Math.abs(prevL.Q)
//         }
//         if (i < this.n) {
//           const prevR = currentNodes[i + 1]
//           cnArray[i] =
//             prevR.Q -
//             this.Ca * prevR.H +
//             this.R * this.dt * prevR.Q * Math.abs(prevR.Q)
//         }
//       }

//       // 2. Solve boundaries and interior nodes
//       for (let i = 0; i <= this.n; i++) {
//         let H_new = 0
//         let Q_new = 0

//         // ── UPSTREAM BOUNDARY: RESERVOIR INLET (i = 0) ──
//         if (i === 0) {
//           const Cn = cnArray[0]
//           if (currentNodes[0].Q >= 0) {
//             const K_ent = (this.k + 1) / (2 * this.g * Math.pow(this.A_pipe, 2))
//             const radical = Math.max(
//               0,
//               Math.pow(this.Ca, 2) +
//                 4 * K_ent * this.Ca * (Cn + this.Ca * currentH_res),
//             )
//             Q_new = (-this.Ca + Math.sqrt(radical)) / (2 * K_ent)
//             H_new = currentH_res - K_ent * Math.pow(Q_new, 2)
//           } else {
//             const K_out =
//               Math.abs(this.k - 1) / (2 * this.g * Math.pow(this.A_pipe, 2))
//             const radical = Math.max(
//               0,
//               Math.pow(this.Ca, 2) +
//                 4 * K_out * this.Ca * (Cn + this.Ca * currentH_res),
//             )
//             Q_new = -((-this.Ca + Math.sqrt(radical)) / (2 * K_out))
//             H_new = currentH_res + K_out * Math.pow(Q_new, 2)
//           }
//         }
//         // ── DOWNSTREAM BOUNDARY: VALVE ORIFICE (i = n) ──
//         else if (i === this.n) {
//           const Cp = cpArray[this.n]
//           const tau = this.getValveOpeningRatio(t)

//           if (tau <= 0) {
//             Q_new = 0
//             H_new = Cp / this.Ca
//           } else {
//             // Bulletproof Flow-first Orifice formulation
//             // Formula: Q_new = -V_factor + Math.sqrt(V_factor^2 + 2 * V_factor * Cp)
//             const V_factor =
//               (Math.pow(tau * this.Q0, 2) * this.Ca) / (2 * H0_valve)
//             const radical = Math.max(
//               0,
//               Math.pow(V_factor, 2) + 2 * V_factor * Cp,
//             )

//             Q_new = -V_factor + Math.sqrt(radical)
//             H_new = (Cp - Q_new) / this.Ca
//           }
//         }
//         // ── INTERIOR NODES ──
//         else {
//           H_new = (cpArray[i] - cnArray[i]) / (2 * this.Ca)
//           Q_new = (cpArray[i] + cnArray[i]) / 2
//         }

//         nextNodes[i] = {
//           x: i * this.dx,
//           H: H_new,
//           Q: Q_new,
//           Cp: cpArray[i],
//           Cn: cnArray[i],
//         }
//       }

//       // 3. Update Finite Volume Reservoir Head
//       const Q_boundary = nextNodes[0].Q
//       currentH_res -= (Q_boundary * this.dt) / this.A_res
//       if (currentH_res < 0) currentH_res = 0

//       currentNodes = nextNodes
//       history.push({ time: t, H_res: currentH_res, nodes: currentNodes })
//     }
//     return history
//   }
// }
