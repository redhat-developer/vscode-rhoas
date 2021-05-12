import { KafkaRequest } from "@rhoas/kafka-management-sdk";
import { Cluster } from "./vscodekafka-api";

export const RHOSAK_CLUSTER_PROVIDER_ID = "rhosak";

export function uniquify(name: string, existingNames: string[]): string {
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

export function convertAll(rhosaks: KafkaRequest[], existingNames: string[]): Cluster[] {
	const clusters:Cluster[] = [];
	if (rhosaks && rhosaks.length> 0) {
		rhosaks.forEach(cluster => {
			clusters.push(convert(cluster, existingNames));
		});
	}
	return clusters;
}

export function convert(rhosak: KafkaRequest, existingNames: string[]): Cluster {
	return {
        id: rhosak.id!,
        name: uniquify(rhosak.name!, existingNames),
        bootstrap: rhosak.bootstrap_server_host!,
        clusterProviderId: RHOSAK_CLUSTER_PROVIDER_ID,
    };
}