# GlasCluster

GlasCluster is a modern, lightweight Kubernetes cluster visualization tool. It acts as an interactive geographical map for your Kubernetes resources, scanning your clusters and automatically rendering their complex relationships in an intuitive, highly visual web-based graph.

By running as a backend API and dynamic frontend interface, GlasCluster connects to your currently active Kubernetes cluster (via your local `kubeconfig`) and discovers physical relationships, networking routes, and ownership chains.

## Features

- **Real-time Kubernetes Data Collection:** Uses the official `@kubernetes/client-node` to securely inspect your currently active K8s context.
- **Resource Discovery:** Automatically maps:
  - `Clusters`, `Namespaces`, `Nodes` (Worker Nodes)
  - `Deployments`, `ReplicaSets`, `Pods`
  - `Services`, `Ingress`
- **Gateway API Support:** Natively discovers and maps modern Kubernetes Gateway API custom resources:
  - `GatewayClasses`
  - `Gateways`
  - `HTTPRoutes`
- **Dynamic Graph Rendering:** Visualizes entities using a force-directed layout via `Cytoscape.js`.
- **Advanced Filtering:** Interactively drill down your view:
  - Filter by a specific **Namespace** to see isolated environments.
  - Filter down to a specific **Deployment** to see exactly which Worker Nodes it runs on, which Services expose its pods, and which Gateways/HTTPRoutes handle its external traffic.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Active Kubernetes cluster and configured `~/.kube/config`.

### Installation

1. Clone this repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

GlasCluster automatically uses your active `kubectl` context to inspect your cluster.

**Development Mode (Hot Reloading):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

Once running, navigate to `http://localhost:3000` in your web browser to view the graph.

## Architecture

- **Backend (Express + TypeScript):** The `K8sCollector` continuously polls the Kubernetes API on a configurable interval (default: 30s) and builds an in-memory graph of nodes and edges (using `CONTAINS`, `OWNS`, `ROUTES_TO`, `RUNS_ON` relationships).
- **Frontend (Vanilla JS + Cytoscape):** A lightweight static web application served by the backend that fetches the `/api/graph` payload, applies user-selected filters, and renders the topological map.

## Configuration
You can configure the backend behavior via a `.env` file in the root directory:
- `PORT` (default: 3000): The HTTP server port.
- `POLL_INTERVAL_MS` (default: 30000): Background polling frequency in milliseconds.
- `LOG_LEVEL` (default: info): Logging verbosity (debug, info, warn, error).