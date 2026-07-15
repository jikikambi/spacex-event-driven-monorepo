export class GatewayClient {

    constructor( private readonly baseUrl = "http://localhost:3001/api") {}

    async requestLaunch(id: string): Promise<void> {

        await fetch(`${this.baseUrl}/launch/${id}`);
    }
}