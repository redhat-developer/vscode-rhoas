export interface ConnectionOptions {
    clusterProviderId?: string;
    bootstrap: string;
}

export interface ClusterIdentifier {
    clusterProviderId?: string;
    id: string;
    name: string;
}

export interface Cluster extends ClusterIdentifier, ConnectionOptions {
}

export interface ClusterSettings {
    getAll(): { bootstrap: string, name: string }[]
}

export interface KafkaExtensionParticipant {

    getClusterProviderParticipant(clusterProviderId: string): ClusterProviderParticipant;

}

/**
 * The kafka extension participant.
 */
export interface ClusterProviderParticipant {

    /**
     * Returns the Kafka clusters managed by this participant.
     *
     * @param clusterSettings the current cluster settings.
     */
    configureClusters(clusterSettings: ClusterSettings): Promise<Cluster[] | undefined>;

    /**
     * Create the KafkaJS client configuration from the given connection options.
     * When the participant doesn't implement this method, the KafkaJS client
     * configuration is created with the default client configuration factory from vscode-kafka.
     *
     * @param connectionOptions the Kafka connection options.
     */
    createKafkaConfig?(connectionOptions: ConnectionOptions): KafkaConfig;
}

// Simplified for RHOSAK, from https://github.com/tulios/kafkajs/blob/0ed42b17bdc8786f8676f43b5ac5a79a7f0e42b7/types/index.d.ts#L19-L33
export interface KafkaConfig {
    brokers: string[]
    ssl?: any
    sasl?: SASLOptions
    clientId?: string
    connectionTimeout?: number
    authenticationTimeout?: number
    reauthenticationThreshold?: number
    requestTimeout?: number
    enforceRequestTimeout?: boolean
}

export type SASLMechanismOptionsMap = {
    'plain': { username: string, password: string },
    'scram-sha-256': { username: string, password: string },
    'scram-sha-512': { username: string, password: string },
    'aws': { authorizationIdentity: string, accessKeyId: string, secretAccessKey: string, sessionToken?: string },
    'oauthbearer': { oauthBearerProvider: () => Promise<OauthbearerProviderResponse> }
};

export type SASLMechanism = keyof SASLMechanismOptionsMap;
type SASLMechanismOptions<T> = T extends SASLMechanism ? { mechanism: T } & SASLMechanismOptionsMap[T] : never;
export type SASLOptions = SASLMechanismOptions<SASLMechanism>;

export interface OauthbearerProviderResponse {
    value: string
}
