import { TriggerNode } from './TriggerNode';
import { ActionNode } from './ActionNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';

// Re-export components
export { TriggerNode, ActionNode, ConditionNode, DelayNode };

// Node types registry for React Flow
export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};
