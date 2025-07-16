import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { Node, FlowNode, FlowEdge, NodeType } from "../types";
import { nodesApi } from "../lib/api";

interface NodeState {
  nodes: Node[];
  flowNodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface NodeContextType extends NodeState {
  // Node management
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  cloneNode: (id: string) => void;

  // Flow management
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;

  // API operations
  loadNodes: (projectId: string) => Promise<void>;
  saveNodes: () => Promise<void>;

  // Utility
  clearError: () => void;
}

type NodeAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_NODES"; payload: Node[] }
  | { type: "ADD_NODE"; payload: Node }
  | { type: "UPDATE_NODE"; payload: { id: string; updates: Partial<Node> } }
  | { type: "DELETE_NODE"; payload: string }
  | { type: "SELECT_NODE"; payload: string | null }
  | {
      type: "UPDATE_NODE_POSITION";
      payload: { id: string; position: { x: number; y: number } };
    }
  | { type: "ADD_EDGE"; payload: FlowEdge }
  | { type: "REMOVE_EDGE"; payload: string }
  | { type: "CLEAR_ERROR" };

const initialState: NodeState = {
  nodes: [],
  flowNodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,
};

function createFlowNode(
  node: Node,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onClone: (id: string) => void
): FlowNode {
  return {
    id: node.id,
    type: "custom",
    position: node.position || { x: 0, y: 0 },
    data: {
      node,
      onEdit,
      onDelete,
      onClone,
    },
  };
}

function nodeReducer(state: NodeState, action: NodeAction): NodeState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_NODES": {
      const nodes = action.payload;
      return {
        ...state,
        nodes,
        isLoading: false,
        error: null,
      };
    }

    case "ADD_NODE": {
      const newNode = action.payload;
      const updatedNodes = [...state.nodes, newNode];
      return {
        ...state,
        nodes: updatedNodes,
      };
    }

    case "UPDATE_NODE": {
      const { id, updates } = action.payload;
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      );
      return {
        ...state,
        nodes: updatedNodes,
      };
    }

    case "DELETE_NODE": {
      const nodeId = action.payload;
      const updatedNodes = state.nodes.filter((node) => node.id !== nodeId);
      const updatedEdges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      return {
        ...state,
        nodes: updatedNodes,
        edges: updatedEdges,
        selectedNodeId:
          state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      };
    }

    case "SELECT_NODE":
      return { ...state, selectedNodeId: action.payload };

    case "UPDATE_NODE_POSITION": {
      const { id, position } = action.payload;
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node
      );
      return {
        ...state,
        nodes: updatedNodes,
      };
    }

    case "ADD_EDGE": {
      const newEdge = action.payload;
      const updatedEdges = [...state.edges, newEdge];
      return {
        ...state,
        edges: updatedEdges,
      };
    }

    case "REMOVE_EDGE": {
      const edgeId = action.payload;
      const updatedEdges = state.edges.filter((edge) => edge.id !== edgeId);
      return {
        ...state,
        edges: updatedEdges,
      };
    }

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export function NodeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(nodeReducer, initialState);

  const addNode = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        name: `New ${type} Node`,
        type,
        template: "",
        properties: {},
        validations: [],
        metadata: {
          category: "development",
          description: "",
          tags: [],
          version: "1.0.0",
          author: "",
          icon: "",
        },
        projectId: "", // Will be set when saving
        position,
        isTemplate: false,
        createdBy: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_NODE", payload: newNode });
    },
    []
  );

  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    dispatch({
      type: "UPDATE_NODE",
      payload: {
        id,
        updates: { ...updates, updatedAt: new Date().toISOString() },
      },
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: "DELETE_NODE", payload: id });
  }, []);

  const selectNode = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_NODE", payload: id });
  }, []);

  const cloneNode = useCallback(
    (id: string) => {
      const originalNode = state.nodes.find((node) => node.id === id);
      if (originalNode) {
        const clonedNode: Node = {
          ...originalNode,
          id: `node-${Date.now()}`,
          name: `${originalNode.name} (Copy)`,
          position: {
            x: (originalNode.position?.x || 0) + 50,
            y: (originalNode.position?.y || 0) + 50,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "ADD_NODE", payload: clonedNode });
      }
    },
    [state.nodes]
  );

  const updateNodePosition = useCallback(
    (id: string, position: { x: number; y: number }) => {
      dispatch({ type: "UPDATE_NODE_POSITION", payload: { id, position } });
    },
    []
  );

  const addEdge = useCallback((source: string, target: string) => {
    const newEdge: FlowEdge = {
      id: `edge-${source}-${target}`,
      source,
      target,
    };
    dispatch({ type: "ADD_EDGE", payload: newEdge });
  }, []);

  const removeEdge = useCallback((id: string) => {
    dispatch({ type: "REMOVE_EDGE", payload: id });
  }, []);

  const loadNodes = useCallback(async (projectId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = (await nodesApi.getNodes()) as any;
      // Filter nodes by project ID
      const projectNodes =
        response.data?.filter((node: Node) => node.projectId === projectId) ||
        [];
      dispatch({ type: "SET_NODES", payload: projectNodes });
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Failed to load nodes",
      });
    }
  }, []);

  const saveNodes = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      // Implementation would save all modified nodes
      // For now, just clear loading state
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Failed to save nodes",
      });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Create flow nodes from regular nodes
  const flowNodes = state.nodes.map((node) =>
    createFlowNode(node, selectNode, deleteNode, cloneNode)
  );

  const value: NodeContextType = {
    ...state,
    flowNodes,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    cloneNode,
    updateNodePosition,
    addEdge,
    removeEdge,
    loadNodes,
    saveNodes,
    clearError,
  };

  return <NodeContext.Provider value={value}>{children}</NodeContext.Provider>;
}

export function useNodes() {
  const context = useContext(NodeContext);
  if (context === undefined) {
    throw new Error("useNodes must be used within a NodeProvider");
  }
  return context;
}
