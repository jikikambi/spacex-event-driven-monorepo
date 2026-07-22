import { EventConnectionState } from "../../infrastructure/events/connection/EventConnectionState";
import { useConnectionStatus } from "../hooks/useConnectionStatus";

export function ConnectionStatus() {

    const health = useConnectionStatus();

    const status = {

        [EventConnectionState.CONNECTED]: {

            text: "Connected",

            color: "bg-green-500"
        },

        [EventConnectionState.CONNECTING]: {

            text: "Connecting...",

            color: "bg-yellow-500"
        },

        [EventConnectionState.RECONNECTING]: {

            text: "Reconnecting...",

            color: "bg-yellow-500"
        },

        [EventConnectionState.OFFLINE]: {

            text: "Gateway Offline",

            color: "bg-red-500"
        }

    }[health.state];

    return (

        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2">

            <span
                className={`h-3 w-3 rounded-full ${status.color}`}
            />

            <div className="flex flex-col">

                <span className="text-sm font-medium">

                    {status.text}

                </span>

                {
                    health.state === EventConnectionState.RECONNECTING && (

                        <span className="text-xs text-gray-300">

                            Attempt #{health.reconnectAttempts}

                        </span>

                    )
                }

            </div>

        </div>

    );
}