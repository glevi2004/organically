import { TriggerNode } from './TriggerNode';
import { ActionNode } from './ActionNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';

export { TriggerNode } from './TriggerNode';
export { ActionNode } from './ActionNode';
export { ConditionNode } from './ConditionNode';
export { DelayNode } from './DelayNode';

// Node types registry for React Flow
export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};
