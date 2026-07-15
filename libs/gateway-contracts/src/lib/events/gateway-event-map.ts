import { Rocket, Ship, Payload, EnrichedLaunchPayload } from "../gateway-payloads";

// SpaceXEventMap
export interface GatewayEventMap {
  LOAD_ROCKETS: Rocket[];
  LOAD_SHIPS: Ship[];
  LOAD_PAYLOADS: Payload[];
  ENRICH_LAUNCH: EnrichedLaunchPayload;
  OTHER_EVENT: unknown;
}