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
    getAll(): { bootstrap: string }[]
}

export interface ClusterProviderProcessor {

    /**
     * Returns the clusters managed by the processor which must be added to the kafka explorer.
     *
     * @param clusterSettings the cluster settings.
     */
    collectClusters(clusterSettings: ClusterSettings): Promise<Cluster[] | undefined>;

    /**
     * Create the Kafka JS client configuration from the given connection options.
     * When processor doesn't implement this method, the Kafka JS client
     * configuration is created with the default client configuration factory from the vscode-kafka.
     *
     * @param connectionOptions the connection options.
     */
    createKafkaConfig?(connectionOptions: ConnectionOptions): KafkaConfig;
}


// Simplified for RHOSAK, from https://github.com/tulios/kafkajs/blob/0ed42b17bdc8786f8676f43b5ac5a79a7f0e42b7/types/index.d.ts#L19-L33
export interface KafkaConfig {
    brokers: string[]
    ssl?: boolean
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
}

export type SASLMechanism = keyof SASLMechanismOptionsMap
type SASLMechanismOptions<T> = T extends SASLMechanism ? { mechanism: T } & SASLMechanismOptionsMap[T] : never
export type SASLOptions = SASLMechanismOptions<SASLMechanism>

export interface OauthbearerProviderResponse {
    value: string
}