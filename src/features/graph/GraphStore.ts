export type NodeLabel =
  | 'Cluster'
  | 'Namespace'
  | 'Deployment'
  | 'ReplicaSet'
  | 'Pod'
  | 'Service'
  | 'Ingress'
  | 'Node'
  | 'GatewayClass'
  | 'Gateway'
  | 'HTTPRoute';

export interface GraphNode {
  id: string; // Unique identifier (e.g., "cluster1_default_pod_nginx")
  label: NodeLabel;
  name: string;
  properties: Record<string, any>;
}

export type EdgeType = 'CONTAINS' | 'OWNS' | 'ROUTES_TO' | 'RUNS_ON' | 'EXPOSES';

export interface GraphEdge {
  id: string; // Unique edge identifier (e.g., "cluster1_default_CONTAINS_pod1")
  sourceId: string;
  targetId: string;
  type: EdgeType;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();

  /**
   * Upserts a node into the graph.
   */
  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Retrieves a node from the graph.
   */
  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Upserts an edge into the graph.
   */
  public addEdge(edge: Omit<GraphEdge, 'id'>): void {
    const id = `${edge.sourceId}_${edge.type}_${edge.targetId}`;
    this.edges.set(id, { ...edge, id });
  }

  /**
   * Get all nodes and edges to be consumed by the API.
   * Filters out any edges that point to non-existent nodes.
   */
  public getGraph(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).filter(edge => {
        return this.nodes.has(edge.sourceId) && this.nodes.has(edge.targetId);
      }),
    };
  }

  /**
   * Remove all nodes and edges.
   */
  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  /**
   * Remove entities associated with a specific cluster to refresh the data.
   */
  public clearCluster(clusterId: string): void {
    // Delete edges belonging to the cluster (source or target)
    for (const [key, edge] of this.edges.entries()) {
      // Assuming node IDs are prefixed with the clusterId, e.g. "cluster1_..."
      if (edge.sourceId.startsWith(`${clusterId}_`) || edge.targetId.startsWith(`${clusterId}_`)) {
        this.edges.delete(key);
      }
    }

    // Delete nodes belonging to the cluster
    for (const [key, _] of this.nodes.entries()) {
      if (key.startsWith(`${clusterId}_`)) {
        this.nodes.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const graphStore = new GraphStore();
