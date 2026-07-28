/**
 * PhysioSim simulation core.
 *
 * Pure TypeScript: no React, no DOM, no randomness. Same parameters, same result.
 */

export * from './core/units';
export * from './core/types';
export * from './core/signals';
export * from './core/modulation';
export * from './core/params';
export * from './core/registry';
export * from './core/engine';

export { DRUGS, drugParams, buildModulators } from './interventions/drugs';
export { PATHOLOGIES } from './interventions/pathologies';
export type { DrugDefinition } from './interventions/drugs';
export type { PathologyDefinition } from './interventions/pathologies';

export { balanceSystem } from './systems/balance';
export { cardiovascularSystem } from './systems/cardiovascular';
export { endocrineSystem } from './systems/endocrine-raas';
export { renalSystem } from './systems/renal';
export type { BalanceState } from './systems/balance';
export type { CardiovascularState } from './systems/cardiovascular';
export type { EndocrineState } from './systems/endocrine-raas';
export type { RenalState } from './systems/renal';
export type { KidneyState } from './systems/renal/kidney';

export * from './scenarios';
