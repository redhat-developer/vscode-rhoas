/* eslint-disable @typescript-eslint/naming-convention */
import { getRedHatService, TelemetryService } from "@redhat-developer/vscode-redhat-telemetry";
import NodeCache = require("node-cache");
import { authentication, commands, ExtensionContext, ProgressLocation, window } from 'vscode';
import { CREATE_RHOSAK_CLUSTER_CMD, openRHOSAKDashboard, registerCommands } from './commands';
import { rhosakService } from './rhosakService';
import { convertAll } from './utils';
import { Cluster, ClusterProviderParticipant, ClusterSettings, ConnectionOptions, KafkaConfig, KafkaExtensionParticipant } from './vscodekafka-api';

const RHOSAK_LABEL = "Red Hat OpenShift Streams for Apache Kafka";
const OPEN_DASHBOARD = 'Open Dashboard';
const CREATE_CLUSTER = 'Create a new remote cluster';

export async function activate(context: ExtensionContext): Promise<KafkaExtensionParticipant> {
	let telemetryService: TelemetryService = await (await getRedHatService(context)).getTelemetryService();
	telemetryService.sendStartupEvent();
	registerCommands(context, telemetryService);
	return getRHOSAKClusterProvider(telemetryService);
}

function getRHOSAKClusterProvider(telemetryService: TelemetryService): KafkaExtensionParticipant {
	return {
		getClusterProviderParticipant(_clusterProviderId: string): ClusterProviderParticipant {
			return {
				configureClusters: async (clusterSettings: ClusterSettings): Promise<Cluster[] | undefined> => configureClusters(clusterSettings, telemetryService),
				createKafkaConfig: (connectionOptions: ConnectionOptions): KafkaConfig => createKafkaConfig(connectionOptions)
			} as ClusterProviderParticipant;
		}
	};
}

async function configureClusters(clusterSettings: ClusterSettings, telemetryService: TelemetryService): Promise<Cluster[] | undefined> {
	const session = await authentication.getSession('redhat-account-auth', ['openid'], { createIfNone: true });
	if (!session) {
		window.showWarningMessage('You need to log into Red Hat first!');
		return [];
	}
	//console.log(`token:${session.accessToken}`);
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
			const rhosaks = (await rhosakService.listKafkas(session.accessToken)).filter(c => c.status === 'ready');
			return convertAll(rhosaks, existingNames);
		});
	} catch (error: any) {
		let event = {
			name: "rhoas.add.rhosak.clusters",
			properties: {
				"error": `${error}`
			}
		};
		telemetryService.send(event);
		if (error.response && error.response.status === 403) {
			//Apparently this is not supposed to happen once we go in prod
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
		const ssoProvider = await getKafkaSSOProvider();
		if (ssoProvider !== 'redhat-account-auth') {
			// preemptively sign into MAS SSO, so the 2 sign-ins are chained, which makes things ... less awkward? really?
			await authentication.getSession(ssoProvider, ['openid'], { createIfNone: true });
		}
		let event = {
			name: "rhoas.add.rhosak.clusters",
			properties: {
				"clusters": clusters.length
			}
		};
		telemetryService.send(event);
		return clusters;
	} else if (foundServers) {
		window.showInformationMessage(`All ${RHOSAK_LABEL} clusters have already been added`);
	} else {
		// Should open the landing page
		const action = await window.showWarningMessage(`No ${RHOSAK_LABEL} cluster available!`, CREATE_CLUSTER, OPEN_DASHBOARD);
		if (action === CREATE_CLUSTER) {
			commands.executeCommand(CREATE_RHOSAK_CLUSTER_CMD);
		} else if (action === OPEN_DASHBOARD) {
			openRHOSAKDashboard(telemetryService, "No clusters");
		}
	}
	return [];
}

const SSL_CONFIG = process.env.ALLOW_INSECURE_SSL ? { rejectUnauthorized: false } : true;

function createKafkaConfig(connectionOptions: ConnectionOptions): KafkaConfig {
	return {
		clientId: "vscode-kafka",
		brokers: connectionOptions.bootstrap.split(","),
		ssl: SSL_CONFIG,
		sasl: {
			mechanism: 'oauthbearer',
			oauthBearerProvider: async () => {
				const ssoProvider = await getKafkaSSOProvider();
				const session = await authentication.getSession(ssoProvider, ['openid'], { createIfNone: true });
				const token = session?.accessToken!;
				return {
					value: token
				};
			}
		}
	};
}

const SSO_PROVIDER_CACHE_TTL = 60; // 1 minute
const SSO_PROVIDER_CACHE = new NodeCache({ stdTTL: SSO_PROVIDER_CACHE_TTL, checkperiod: SSO_PROVIDER_CACHE_TTL + 1, maxKeys: 1 });
SSO_PROVIDER_CACHE.on("expired", function (key, value) {
	console.log("Expired key: " + key + ", value: " + value);
});

async function getKafkaSSOProvider(): Promise<string> {
	let sso = SSO_PROVIDER_CACHE.get<string>('ssoProvider');
	if (!sso) {
		const ssoProvider = await rhosakService.getSSOProvider();
		sso = ssoProvider?.name === 'mas_sso' ? 'redhat-mas-account-auth' : 'redhat-account-auth';
		SSO_PROVIDER_CACHE.set('ssoProvider', sso);
	}
	return sso;
}

// this method is called when your extension is deactivated
export function deactivate() { }



