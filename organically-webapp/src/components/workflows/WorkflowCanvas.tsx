"use client";

import { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { WorkflowSidebar } from './WorkflowSidebar';
import { 
  WorkflowNode, 
  WorkflowEdge, 
  TriggerNodeData,
} from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface WorkflowCanvasProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  onSave?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onChange?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onActivate?: (active: boolean) => void;
  isActive?: boolean;
  isSaving?: boolean;
  readOnly?: boolean;
  workflowName?: string;
}

// Default edge options - using smoothstep for cleaner lines
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { 
    strokeWidth: 2,
    stroke: '#64748b',
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#64748b',
  },
};

function WorkflowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  onChange,
  readOnly = false,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(nodes as WorkflowNode[], edges as WorkflowEdge[]);
  }, [nodes, edges, onChange]);

  // Validation state
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const triggers = nodes.filter((n) => n.type === 'trigger');
    const actions = nodes.filter((n) => n.type === 'action');
    
    if (triggers.length === 0) {
      errors.push('Add at least one trigger');
    }
    if (actions.length === 0) {
      errors.push('Add at least one action');
    }
    
    // Check for disconnected non-trigger nodes
    const connectedIds = new Set<string>();
    edges.forEach((e) => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });
    
    nodes.forEach((n) => {
      if (n.type !== 'trigger' && !connectedIds.has(n.id)) {
        errors.push(`"${n.data.label}" is not connected`);
      }
    });
    
    return errors;
  }, [nodes, edges]);

  const isValid = validationErrors.length === 0;

  // Get current trigger info for sidebar filtering
  const { currentTriggerType, hasTrigger } = useMemo(() => {
    const trigger = nodes.find((n) => n.type === 'trigger');
    if (trigger && trigger.data) {
      return {
        currentTriggerType: (trigger.data as TriggerNodeData).type,
        hasTrigger: true,
      };
    }
    return { currentTriggerType: null, hasTrigger: false };
  }, [nodes]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          { 
            ...params, 
            ...defaultEdgeOptions,
          }, 
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle drag-and-drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const dataStr = event.dataTransfer.getData('application/reactflow/data');

      if (!type || !dataStr) return;

      const data = JSON.parse(dataStr);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: `${type}-${Date.now()}`,
        type: type as WorkflowNode['type'],
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  // Custom minimap node colors
  const nodeColor = (node: Node) => {
    switch (node.type) {
      case 'trigger':
        return '#3b82f6'; // blue
      case 'action':
        return '#a855f7'; // purple
      case 'delay':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      {!readOnly && (
        <WorkflowSidebar 
          currentTriggerType={currentTriggerType} 
          hasTrigger={hasTrigger} 
        />
      )}

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          className="bg-muted/20"
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Control', 'Meta']}
          panOnDrag={true}
          selectionOnDrag={false}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
        >
          {/* Background pattern */}
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="hsl(var(--border))"
          />
          
          {/* Controls */}
          <Controls 
            showInteractive={false}
            className="bg-card border rounded-lg shadow-md"
          />
          
          {/* MiniMap */}
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-card border rounded-lg shadow-md !top-4 !right-4 !bottom-auto"
            style={{ width: 150, height: 100 }}
          />
          
          {/* Top Panel - Workflow Status */}
          <Panel position="top-left" className="flex items-center gap-2">
            {/* Validation Status */}
            {isValid ? (
              <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/30">
                <CheckCircle className="w-3 h-3" />
                Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 bg-red-500/10 text-red-600 border-red-500/30">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''}
              </Badge>
            )}
          </Panel>

          {/* Bottom Panel - Validation Errors */}
          {!readOnly && validationErrors.length > 0 && (
            <Panel position="bottom-left" className="max-w-sm">
              <div className="p-3 bg-card border rounded-lg shadow-md space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Fix these issues to activate:
                </p>
                {validationErrors.slice(0, 3).map((error, i) => (
                  <p key={i} className="text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                  </p>
                ))}
                {validationErrors.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{validationErrors.length - 3} more...
                  </p>
                )}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
