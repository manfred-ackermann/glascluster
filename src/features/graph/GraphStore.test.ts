import { GraphStore, GraphNode } from './GraphStore';

describe('GraphStore', () => {
  let store: GraphStore;

  beforeEach(() => {
    store = new GraphStore();
  });

  test('should add and retrieve a node', () => {
    const node: GraphNode = {
      id: 'cluster1_node_test',
      label: 'Node',
      name: 'test-node',
      properties: {},
    };

    store.addNode(node);
    
    const retrieved = store.getNode('cluster1_node_test');
    expect(retrieved).toEqual(node);
  });

  test('should clear specific cluster data', () => {
    // Add Cluster 1 node and edge
    store.addNode({
      id: 'cluster1_pod_1',
      label: 'Pod',
      name: 'pod1',
      properties: {},
    });
    
    // Add Cluster 2 node
    store.addNode({
      id: 'cluster2_pod_1',
      label: 'Pod',
      name: 'pod1',
      properties: {},
    });

    store.addEdge({
      sourceId: 'cluster1_pod_1',
      targetId: 'cluster1_node_1',
      type: 'RUNS_ON',
      properties: {},
    });

    // Clear cluster 1
    store.clearCluster('cluster1');

    const graph = store.getGraph();
    
    expect(graph.nodes.length).toBe(1);
    expect(graph.nodes[0].id).toBe('cluster2_pod_1');
    expect(graph.edges.length).toBe(0); // The edge was related to cluster1
  });
});
