import { TelemetryService } from '@redhat-developer/vscode-redhat-telemetry/lib';
import { commands, ExtensionContext, Uri } from 'vscode';

export const OPEN_RHOSAK_DASHBOARD_CMD = 'rhoas.open.RHOSAKDashboard';
const LANDING_PAGE = 'https://cloud.redhat.com/beta/application-services/streams';

export function registerCommands (context: ExtensionContext, telemetryService:TelemetryService ) {
    context.subscriptions.push(
		commands.registerCommand(OPEN_RHOSAK_DASHBOARD_CMD, (clusterItem?: any) => {
			let clusterId:string|undefined;
			if (clusterItem?.cluster?.id) {
				clusterId = clusterItem.cluster.id;
			} else if (clusterItem?.id) {
				clusterId = clusterItem.id;
			}
			const reason = clusterId?"Cluster page":"Manual invocation";
			openRHOSAKDashboard(telemetryService, reason, clusterId);
		})
	);
}

export async function openRHOSAKDashboard(telemetryService:TelemetryService, reason: string, clusterId?:string) {
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