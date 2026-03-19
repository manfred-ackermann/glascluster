import * as k8s from '@kubernetes/client-node';
import { logger } from '../../config';
import { graphStore, GraphNode } from '../graph/GraphStore';

/**
 * Connects to a Kubernetes cluster and collects resources,
 * mapping them into the Neo4j-like GraphStore structure.
 */
export class K8sCollector {
  private kc: k8s.KubeConfig;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;
  private customObjectsApi: k8s.CustomObjectsApi;
  private clusterId: string;

  constructor(kubeconfigPath?: string, contextName?: string) {
    this.kc = new k8s.KubeConfig();

    if (kubeconfigPath) {
      this.kc.loadFromFile(kubeconfigPath);
    } else {
      this.kc.loadFromDefault();
    }

    if (contextName) {
      this.kc.setCurrentContext(contextName);
    }

    this.clusterId = this.kc.getCurrentContext() || 'default-cluster';
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
  }

  public async collectAll(): Promise<void> {
    try {
      logger.info(`Starting collection for cluster: ${this.clusterId}`);

      // Clear existing cluster data in graph store
      graphStore.clearCluster(this.clusterId);

      // Add Cluster node
      const clusterNode: GraphNode = {
        id: `${this.clusterId}_cluster`,
        label: 'Cluster',
        name: this.clusterId,
        properties: { type: 'kubernetes' },
      };
      graphStore.addNode(clusterNode);

      // Fetch resources
      const [namespaces, nodes, pods, deployments, services] = await Promise.all([
        this.coreV1Api.listNamespace(),
        this.coreV1Api.listNode(),
        this.coreV1Api.listPodForAllNamespaces(),
        this.appsV1Api.listDeploymentForAllNamespaces(),
        this.coreV1Api.listServiceForAllNamespaces(),
      ]);

      let gateways: any = { items: [] };
      let httpRoutes: any = { items: [] };
      let gatewayClasses: any = { items: [] };

      try {
        gateways = await this.customObjectsApi.listCustomObjectForAllNamespaces({
          group: 'gateway.networking.k8s.io',
          version: 'v1',
          plural: 'gateways'
        });
      } catch (err) {
        logger.debug('Gateways CRD not found or accessible');
      }

      try {
        httpRoutes = await this.customObjectsApi.listCustomObjectForAllNamespaces({
          group: 'gateway.networking.k8s.io',
          version: 'v1',
          plural: 'httproutes'
        });
      } catch (err) {
        logger.debug('HTTPRoutes CRD not found or accessible');
      }

      try {
        gatewayClasses = await this.customObjectsApi.listClusterCustomObject({
          group: 'gateway.networking.k8s.io',
          version: 'v1',
          plural: 'gatewayclasses'
        });
      } catch (err) {
        logger.debug('GatewayClasses CRD not found or accessible');
      }

      // Map Namespaces
      for (const ns of namespaces.items) {
        const nsName = ns.metadata?.name || 'unknown';
        const nsId = `${this.clusterId}_namespace_${nsName}`;
        graphStore.addNode({
          id: nsId,
          label: 'Namespace',
          name: nsName,
          properties: { status: ns.status?.phase },
        });

        // Edge: Cluster -> CONTAINS -> Namespace
        graphStore.addEdge({
          sourceId: clusterNode.id,
          targetId: nsId,
          type: 'CONTAINS',
          properties: {},
        });
      }

      // Map Nodes
      for (const node of nodes.items) {
        const nodeName = node.metadata?.name || 'unknown';
        const nodeId = `${this.clusterId}_node_${nodeName}`;
        graphStore.addNode({
          id: nodeId,
          label: 'Node',
          name: nodeName,
          properties: {
            allocatableCPU: node.status?.allocatable?.cpu,
            allocatableMemory: node.status?.allocatable?.memory,
          },
        });

        // Edge: Cluster -> CONTAINS -> Node
        graphStore.addEdge({
          sourceId: clusterNode.id,
          targetId: nodeId,
          type: 'CONTAINS',
          properties: {},
        });
      }

      // Map GatewayClasses
      for (const gc of gatewayClasses.items || []) {
        const gcName = gc.metadata?.name || 'unknown';
        const gcId = `${this.clusterId}_gatewayclass_${gcName}`;
        graphStore.addNode({
          id: gcId,
          label: 'GatewayClass',
          name: gcName,
          properties: {
            controllerName: gc.spec?.controllerName,
          },
        });

        graphStore.addEdge({
          sourceId: clusterNode.id,
          targetId: gcId,
          type: 'CONTAINS',
          properties: {},
        });
      }

      // Map Gateways
      for (const gw of gateways.items || []) {
        const gwName = gw.metadata?.name || 'unknown';
        const nsName = gw.metadata?.namespace || 'default';
        const nsId = `${this.clusterId}_namespace_${nsName}`;
        const gwId = `${this.clusterId}_gateway_${nsName}_${gwName}`;

        graphStore.addNode({
          id: gwId,
          label: 'Gateway',
          name: gwName,
          properties: {
            gatewayClassName: gw.spec?.gatewayClassName,
            namespace: nsName,
          },
        });

        graphStore.addEdge({
          sourceId: nsId,
          targetId: gwId,
          type: 'CONTAINS',
          properties: {},
        });

        if (gw.spec?.gatewayClassName) {
          const gcId = `${this.clusterId}_gatewayclass_${gw.spec.gatewayClassName}`;
          graphStore.addEdge({
            sourceId: gcId,
            targetId: gwId,
            type: 'OWNS',
            properties: {},
          });
        }
      }

      // Map HTTPRoutes
      for (const route of httpRoutes.items || []) {
        const routeName = route.metadata?.name || 'unknown';
        const nsName = route.metadata?.namespace || 'default';
        const nsId = `${this.clusterId}_namespace_${nsName}`;
        const routeId = `${this.clusterId}_httproute_${nsName}_${routeName}`;

        graphStore.addNode({
          id: routeId,
          label: 'HTTPRoute',
          name: routeName,
          properties: {
            namespace: nsName,
          },
        });

        graphStore.addEdge({
          sourceId: nsId,
          targetId: routeId,
          type: 'CONTAINS',
          properties: {},
        });

        const parentRefs = route.spec?.parentRefs || [];
        for (const ref of parentRefs) {
          const gwNs = ref.namespace || nsName;
          const gwId = `${this.clusterId}_gateway_${gwNs}_${ref.name}`;
          graphStore.addEdge({
            sourceId: gwId,
            targetId: routeId,
            type: 'ROUTES_TO',
            properties: {},
          });
        }

        const rules = route.spec?.rules || [];
        for (const rule of rules) {
          for (const backend of rule.backendRefs || []) {
            if (backend.kind === 'Service' || !backend.kind) {
              const svcNs = backend.namespace || nsName;
              const svcId = `${this.clusterId}_service_${svcNs}_${backend.name}`;
              graphStore.addEdge({
                sourceId: routeId,
                targetId: svcId,
                type: 'ROUTES_TO',
                properties: {
                  port: backend.port,
                },
              });
            }
          }
        }
      }

      // Map Deployments
      for (const dep of deployments.items) {
        const depName = dep.metadata?.name || 'unknown';
        const nsName = dep.metadata?.namespace || 'default';
        const nsId = `${this.clusterId}_namespace_${nsName}`;
        const depId = `${this.clusterId}_deployment_${nsName}_${depName}`;

        graphStore.addNode({
          id: depId,
          label: 'Deployment',
          name: depName,
          properties: {
            replicas: dep.spec?.replicas,
            readyReplicas: dep.status?.readyReplicas,
            namespace: nsName,
          },
        });

        // Edge: Namespace -> CONTAINS -> Deployment
        graphStore.addEdge({
          sourceId: nsId,
          targetId: depId,
          type: 'CONTAINS',
          properties: {},
        });
      }

      // Map Pods
      for (const pod of pods.items) {
        const podName = pod.metadata?.name || 'unknown';
        const nsName = pod.metadata?.namespace || 'default';
        const nodeName = pod.spec?.nodeName;
        const nsId = `${this.clusterId}_namespace_${nsName}`;
        const podId = `${this.clusterId}_pod_${nsName}_${podName}`;

        graphStore.addNode({
          id: podId,
          label: 'Pod',
          name: podName,
          properties: {
            phase: pod.status?.phase,
            podIP: pod.status?.podIP,
            namespace: nsName,
          },
        });

        // Edge: Namespace -> CONTAINS -> Pod
        graphStore.addEdge({
          sourceId: nsId,
          targetId: podId,
          type: 'CONTAINS',
          properties: {},
        });

        // Edge: Node -> RUNS_ON -> Pod
        if (nodeName) {
          const nodeId = `${this.clusterId}_node_${nodeName}`;
          graphStore.addEdge({
            sourceId: podId,
            targetId: nodeId,
            type: 'RUNS_ON',
            properties: {},
          });
        }

        // Check if Pod is owned by ReplicaSet/Deployment
        const ownerRefs = pod.metadata?.ownerReferences || [];
        for (const owner of ownerRefs) {
          // Simplification: In reality Pod -> ReplicaSet -> Deployment. Here we jump or map RS if needed.
          // Assuming the pod is part of a deployment logic for simple mapping:
          if (owner.kind === 'ReplicaSet') {
            // Usually RS name format is DeploymentName-hash
            const depName = owner.name.substring(0, owner.name.lastIndexOf('-'));
            const depId = `${this.clusterId}_deployment_${nsName}_${depName}`;
            // If the deployment exists, map OWNS
            if (graphStore.getNode(depId)) {
              graphStore.addEdge({
                sourceId: depId,
                targetId: podId,
                type: 'OWNS',
                properties: { via: 'ReplicaSet', rsName: owner.name },
              });
            }
          }
        }
      }

      // Map Services
      for (const svc of services.items) {
        const svcName = svc.metadata?.name || 'unknown';
        const nsName = svc.metadata?.namespace || 'default';
        const nsId = `${this.clusterId}_namespace_${nsName}`;
        const svcId = `${this.clusterId}_service_${nsName}_${svcName}`;

        graphStore.addNode({
          id: svcId,
          label: 'Service',
          name: svcName,
          properties: {
            clusterIP: svc.spec?.clusterIP,
            type: svc.spec?.type,
            namespace: nsName,
          },
        });

        // Edge: Namespace -> CONTAINS -> Service
        graphStore.addEdge({
          sourceId: nsId,
          targetId: svcId,
          type: 'CONTAINS',
          properties: {},
        });

        // For simplicity, connect Service -> ROUTES_TO -> Pod if selector matches.
        // In a real scenario, you'd match the selector explicitly against pod labels.
        // We will mock this logic for the structural prototype:
        const selector = svc.spec?.selector;
        if (selector) {
          // Identify matching pods
          const matchingPods = pods.items.filter((pod: k8s.V1Pod) => {
            if (pod.metadata?.namespace !== nsName) return false;
            const podLabels = pod.metadata?.labels || {};
            // Check if all selector key/values match the pod's labels
            return Object.entries(selector).every(
              ([key, value]) => podLabels[key] === value
            );
          });

          for (const mPod of matchingPods) {
            const podId = `${this.clusterId}_pod_${nsName}_${mPod.metadata?.name}`;
            graphStore.addEdge({
              sourceId: svcId,
              targetId: podId,
              type: 'ROUTES_TO',
              properties: {},
            });
          }
        }
      }

      logger.info(`Successfully collected resources for cluster: ${this.clusterId}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to collect resources for cluster ${this.clusterId}`);
    }
  }
}
