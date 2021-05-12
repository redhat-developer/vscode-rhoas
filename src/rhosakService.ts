import { Configuration, DefaultApi, KafkaRequest, KafkaRequestPayload } from "@rhoas/kafka-management-sdk";

export namespace rhosakService {

    const BASE_API = 'https://api.openshift.com';

    export async function listKafkas(token: string):Promise<KafkaRequest[]> {
        const apisService = getApisService(token);
        const clusters: KafkaRequest[] = [];
        let page = 1;
        let response;
        let hasMore = true;
        try {
            while(hasMore) {
                response = await apisService.getKafkas( ''+page, '100', 'name asc');
                const kafkas = response.data;
                if (kafkas) {
                    clusters.push(...kafkas.items!);
                    hasMore = kafkas.total > clusters.length;
                } else {
                    hasMore = false;
                }
            }
        } catch (e) {
            console.log(e);
            throw e;
        }
        return clusters;
    }

    function getApisService(token: string) {
        const apiConfig = new Configuration({
            basePath: BASE_API,
            accessToken: token
        });
        return new DefaultApi(apiConfig);
    }
}