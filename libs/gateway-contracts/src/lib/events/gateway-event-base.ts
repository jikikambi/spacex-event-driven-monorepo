import { GatewayEventMap } from "./gateway-event-map";
import { GatewayEventType } from "./gateway-event-type";

// SpaceXEventBase
export interface GatewayEventBase<T extends GatewayEventType = GatewayEventType> {
  event: T;
  payload: GatewayEventMap[T];
  eventId?: string; 
  timestamp: number;
  source?: string;
}