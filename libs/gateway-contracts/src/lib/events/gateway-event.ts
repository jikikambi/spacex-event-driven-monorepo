import { EnrichLaunchEvent } from "./types/enrich-launch-event";
import { LoadPayloadsEvent } from "./types/load-payloads-event";
import { LoadRocketsEvent } from "./types/load-rockets-event";
import { LoadShipsEvent } from "./types/load-ships-event";
import { OtherEvent } from "./types/other-event";

// -------------------------------
// Union of all events
// -------------------------------

// SpaceXEvent
export type GatewayEvent =
  | LoadRocketsEvent
  | LoadShipsEvent
  | LoadPayloadsEvent
  | EnrichLaunchEvent
  | OtherEvent;