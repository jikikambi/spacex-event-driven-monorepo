import { PropsWithChildren } from "react";
import { ConnectionStatus } from "../components/ConnectionStatus";

export function AppLayout({ children }: PropsWithChildren) {

    return (

        <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">

            <header className="border-b bg-slate-900 text-white shadow">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

                    <div>

                        <h1 className="text-3xl font-bold">

                            SpaceX Event Dashboard

                        </h1>

                        <p className="mt-1 text-sm text-slate-300">

                            Live launch telemetry powered by Server-Sent Events

                        </p>

                    </div>

                    <ConnectionStatus />

                </div>

            </header>

            <main className="flex-1">

                <div className="mx-auto max-w-7xl p-6">

                    {children}

                </div>

            </main>

            <footer className="border-t bg-gray-200 py-4 text-center text-sm text-gray-600">

                © {new Date().getFullYear()} SpaceX Event-Driven Monorepo

            </footer>

        </div>
    );
}