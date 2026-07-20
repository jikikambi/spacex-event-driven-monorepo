import { PayloadViewModel } from "../../application/launches/view-models/PayloadViewModel";

interface Props {

    payloads: readonly PayloadViewModel[];

}

export function PayloadList({ payloads }: Props) {

    if (!payloads.length) {

        return null;

    }

    return (

        <section className="mb-5">

            <h4 className="mb-2 font-semibold">

                Payloads

            </h4>

            <ul className="space-y-2">

                {payloads.map(payload => (

                    <li key={payload.id}
                        className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">

                        <div>

                            <div className="font-medium">

                                {payload.name}

                            </div>

                            <div className="text-sm text-gray-500">

                                {payload.type}

                            </div>

                        </div>

                        <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">

                            {payload.massKg ?? "N/A"} kg

                        </span>

                    </li>

                ))}

            </ul>

        </section>

    );

}