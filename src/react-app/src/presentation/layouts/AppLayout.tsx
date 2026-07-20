import { PropsWithChildren } from "react";

export function AppLayout({ children }: PropsWithChildren) {

    return (

        <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">

            <header className="bg-gray-900 text-white shadow-md ">

                <div className="mx-auto max-w-7xl px-6 py-6">

                    <h1 className="text-4xl font-bold">

                        SpaceX Event Dashboard

                    </h1>

                    <p className="mt-2 text-gray-300">

                        Live launch telemetry powered by Server-Sent Events

                    </p>

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