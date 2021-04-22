import axios from 'axios';
import {authentication, commands, ExtensionContext, ProgressLocation, Uri, window } from 'vscode';
import { Cluster, KafkaExtensionParticipant, ClusterSettings, ConnectionOptions, KafkaConfig, ClusterProviderParticipant } from './vscodekafka-api';
​
import { getTelemetryService, TelemetryService } from "@redhat-developer/vscode-redhat-telemetry";
​
const KAFKA_API = 'https://api.openshift.com/api/managed-services-api/v1/kafkas';
const LANDING_PAGE = 'https://cloud.redhat.com/beta/application-services/streams';
​const OPEN_RHOSAK_DASHBOARD_COMMAND = 'rhoas.open.RHOSAKDashboard';

export async function activate(context: ExtensionContext): Promise<KafkaExtensionParticipant> {
	let telemetryService: TelemetryService = await getTelemetryService("redhat.vscode-rhoas");
	telemetryService.sendStartupEvent();
	context.subscriptions.push(
		commands.registerCommand(OPEN_RHOSAK_DASHBOARD_COMMAND, (clusterItem?: any) => {
			let clusterId:string|undefined;
			if (clusterItem?.cluster?.id) {
				clusterId = clusterItem.cluster.id;
			} else if (clusterItem.id) {
				clusterId = clusterItem.id;
			}
			openRHOSAKDashboard(telemetryService, "Manual invocation", clusterId);
		})
	);
	return getRHOSAKClusterProvider(telemetryService);
}

const RHOSAK_CLUSTER_PROVIDER_ID = "rhosak";
const RHOSAK_LABEL = "Red Hat OpenShift Streams for Apache Kafka";
​const OPEN_DASHBOARD = 'Open Dashboard';

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
	const session = await authentication.getSession('redhat-account-auth', ['openid'], { createIfNone: true });
	if (!session) {
		window.showWarningMessage('You need to log into Red Hat first!');
		return [];
	}
	const existingClusterUrls = clusterSettings.getAll().map(cluster => cluster.bootstrap);
	const existingNames = clusterSettings.getAll().map(cluster => cluster.name);
	let clusters = [] as Cluster[];
	try {
		clusters = await window.withProgress({
			location: ProgressLocation.Notification,
		}, async (progress) => {
			progress.report({
				message: `Fetching Kafka cluster definitions from Red Hat...`,
			});
			return getRHOSAKClusters(session.accessToken, existingNames);
		});
	} catch (error) {
		let event = {	
			name: "rhoas.add.rhosak.clusters.failure",
			properties: {
				"error": `${error}`
			}
		};
		telemetryService.send(event);
		if (error.response && error.response.status === 403) {
			//Apparently this is not supposed to happened once we go in prod
			const signUp = 'Sign Up';
			const action = await window.showErrorMessage(`You have no ${RHOSAK_LABEL} account`, signUp);
			if (action === signUp) {
				openRHOSAKDashboard(telemetryService, "Sign-up");
			}
			return;
		}
		throw error;
	}
	const foundServers = clusters.length > 0;
	if (foundServers && existingClusterUrls.length > 0) {
		clusters = clusters.filter(mk => !existingClusterUrls.includes(mk.bootstrap));
	}
	if (clusters.length > 0) {
		// preemptively sign into MAS SSO, so the 2 sign-ins are chained, which makes things ... less awkward? really?
		await authentication.getSession('redhat-mas-account-auth', ['openid'], { createIfNone: true });
		let event = {
			name: "rhoas.add.rhosak.clusters",
			properties: {
				"clusters": clusters.length
			}
		};
		telemetryService.send(event);
		return clusters;
	} else if (foundServers) {
		window.showInformationMessage(`All ${RHOSAK_LABEL} Clusters have already been added`);
	} else {
		// Should open the landing page
		const action = await window.showWarningMessage(`No ${RHOSAK_LABEL} cluster available!`, OPEN_DASHBOARD);
		if (action === OPEN_DASHBOARD) {
			openRHOSAKDashboard(telemetryService, "No clusters");
		}
	}
	return [];
}

async function openRHOSAKDashboard(telemetryService:TelemetryService, reason: string, clusterId?:string) {
	let event = {
		name: "rhoas.open.rhosak.dashboard",
		properties: {
			"reason": reason
		}
	};
	let page = LANDING_PAGE;
	if (clusterId) {
		page = `${page}/kafkas/${clusterId}`;
	}
	telemetryService.send(event);
	return commands.executeCommand('vscode.open', Uri.parse(page));
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
				const session = await authentication.getSession('redhat-mas-account-auth', ['openid'], { createIfNone: true });
				const token = session?.accessToken!;
				return {
					value: token
				};
			}
		}
	};
}
​
async function getRHOSAKClusters(token: string, existingNames: string[]): Promise<Cluster[]> {
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
	const response = await axios.get(KAFKA_API, requestConfig);
	const kafkas = response.data;
	if (kafkas && kafkas.items && kafkas.items.length > 0) {
		kafkas.items.forEach((cluster: { id: string; status: string; name: string; bootstrapServerHost: any; }) => {
			if (cluster?.status === 'ready') {
				clusters.push({
					id: cluster.id,
					name: uniquify(cluster.name, existingNames),
					bootstrap: cluster.bootstrapServerHost,
					clusterProviderId: RHOSAK_CLUSTER_PROVIDER_ID,
				});
			}
		});
	}
	return clusters;
}
​
// this method is called when your extension is deactivated
export function deactivate() { }

function uniquify(name: string, existingNames: string[]): string {
	if (!existingNames || existingNames.length === 0) {
		return name;
	}
	let uniqueName = name;
	let i = 1;
	while(existingNames.includes(uniqueName)) {
		i++;
		uniqueName = `${name} ${i}`;
	}
	return uniqueName;
}
