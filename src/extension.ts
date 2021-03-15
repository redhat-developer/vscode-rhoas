import axios from 'axios';
import * as vscode from 'vscode';
import { Cluster, KafkaExtensionParticipant, ClusterSettings, ConnectionOptions, KafkaConfig, ClusterProviderParticipant } from './vscodekafka-api';
​
import { getTelemetryService, TelemetryService } from "@redhat-developer/vscode-redhat-telemetry";
​
const KAFKA_API = 'https://api.stage.openshift.com/api/managed-services-api/v1/kafkas';
const LANDING_PAGE = 'https://cloud.redhat.com/beta/application-services/openshift-streams';
​
export async function activate(_context: vscode.ExtensionContext): Promise<KafkaExtensionParticipant> {
	let telemetryService: TelemetryService = await getTelemetryService("redhat.vscode-rhoas");
	telemetryService.sendStartupEvent();
	return getRHOSAKClusterProvider(telemetryService);
}
​
const RHOSAK_CLUSTER_PROVIDER_ID = "rhosak";
const RHOSAK_LABEL = "Red Hat OpenShift Streams for Apache Kafka";
​
function getRHOSAKClusterProvider(telemetryService: TelemetryService): KafkaExtensionParticipant {
	return {
		getClusterProviderParticipant(clusterProviderId: string): ClusterProviderParticipant {
			return {
				configureClusters: async (clusterSettings: ClusterSettings): Promise<Cluster[] | undefined> => configureClusters(clusterSettings, telemetryService),
				createKafkaConfig: (connectionOptions: ConnectionOptions): KafkaConfig => createKafkaConfig(connectionOptions)
			} as ClusterProviderParticipant;
		}
	};
}
​
async function configureClusters(clusterSettings: ClusterSettings, telemetryService: TelemetryService): Promise<Cluster[] | undefined> {
	const session = await vscode.authentication.getSession('redhat-account-auth', ['openid'], { createIfNone: true });
	if (!session) {
		vscode.window.showWarningMessage('You need to log into Red Hat first!');
		return [];
	}
	const start = new Date().getTime();
	const existingClusters = clusterSettings.getAll().map(cluster => cluster.bootstrap);
	let clusters = await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
	}, async (progress) => {
		progress.report({
			message: `Fetching Kafka cluster definitions from Red Hat...`,
		});
		return getRHOSAKClusters(session.accessToken);
	});
	const foundServers = clusters.length > 0;
	if (foundServers && existingClusters.length > 0) {
		clusters = clusters.filter(mk => !existingClusters.includes(mk.bootstrap));
	}
	if (clusters.length > 0) {
		// preemptively sign into MAS SSO, so the 2 sign-ins are chained, which makes things ... less awkward? really?
		await vscode.authentication.getSession('redhat-mas-account-auth', ['openid'], { createIfNone: true });
		let event = {
			name: "add_rhosak_clusters",
			properties: {
				"clusters": clusters.length
			}
		};
		telemetryService.send(event);
		return clusters;
	} else if (foundServers) {
		vscode.window.showInformationMessage(`All ${RHOSAK_LABEL} Clusters have already been added`);
	} else {
		// Should open the landing page
		vscode.window.showWarningMessage(`No ${RHOSAK_LABEL} cluster available! Visit ${LANDING_PAGE}`);
	}
	return [];
}
​
function createKafkaConfig(connectionOptions: ConnectionOptions): KafkaConfig {
	return {
		clientId: "vscode-kafka",
		brokers: connectionOptions.bootstrap.split(","),
		ssl: true,
		sasl: {
			mechanism: 'oauthbearer',
			oauthBearerProvider: async () => {
				const session = await vscode.authentication.getSession('redhat-mas-account-auth', ['openid'], { createIfNone: true });
				const token = session?.accessToken!;
				return {
					value: token
				};
			}
		}
	};
}
​
async function getRHOSAKClusters(token: string): Promise<Cluster[]> {
	let requestConfig = {
		params: {
			orderBy: 'name asc'
		},
		headers: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Authorization': `Bearer ${token}`,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'Accept': 'application/json'
		}
	};
	const clusters: Cluster[] = [];
	try {
		const response = await axios.get(KAFKA_API, requestConfig);
		const kafkas = response.data;
		if (kafkas && kafkas.items && kafkas.items.length > 0) {
			kafkas.items.forEach((cluster: { id: string; status: string; name: string; bootstrapServerHost: any; }) => {
				if (cluster?.status === 'ready') {
					clusters.push({
						id: cluster.id,
						name: cluster.name,
						bootstrap: cluster.bootstrapServerHost,
						clusterProviderId: RHOSAK_CLUSTER_PROVIDER_ID,
					});
				}
			});
		}
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to load ${RHOSAK_LABEL} clusters: ${err.message}`);
		throw err;
	}
	return clusters;
}
​
// this method is called when your extension is deactivated
export function deactivate() { }