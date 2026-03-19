import * as k8s from '@kubernetes/client-node';
const kc = new k8s.KubeConfig();
const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);
customObjectsApi.listClusterCustomObject({ group: 'g', version: 'v', plural: 'p' });
