import type { ParamDefinition, SystemModel } from './types';
import { mergeParamDefinitions } from './params';
import { balanceSystem } from '../systems/balance';
import { cardiovascularSystem } from '../systems/cardiovascular';
import { endocrineSystem } from '../systems/endocrine-raas';
import { renalSystem } from '../systems/renal';
import { drugParams } from '../interventions/drugs';

/**
 * The registered body systems.
 *
 * Adding a system — lung, acid-base, muscle — means writing one file under
 * `src/systems/` and adding it to this array. Nothing else in the core changes
 * (Definition of Done Nr. 6). The order below does not affect the result, because every
 * module reads the shared signals of the previous step (docs/adr/0003).
 */
export const SYSTEMS: readonly SystemModel[] = [
  balanceSystem as SystemModel,
  cardiovascularSystem as SystemModel,
  endocrineSystem as SystemModel,
  renalSystem as SystemModel,
];

/** Every parameter the user may change, across all systems plus the drugs. */
export const ALL_PARAMS: readonly ParamDefinition[] = mergeParamDefinitions([
  ...SYSTEMS.map((s) => s.params),
  drugParams,
]);
