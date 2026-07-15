# SpaceX Event Gateway

A modern **event-driven platform** built with **NestJS** and an **Nx monorepo**, demonstrating a complete migration from a legacy Node.js/Express application to a modular, strongly-typed architecture.

The project integrates **RabbitMQ**, **Redis**, **MongoDB**, **OpenTelemetry**, **Prometheus**, and **Server-Sent Events (SSE)** to provide a scalable backend consumed by **React**, **Vue**, and **Angular** applications.

---

## Migration

This project originally started as a traditional **Node.js/Express** application.

The original implementation has been preserved in the **`legacy`** branch for historical reference and comparison.

The current implementation on the **`main`** branch is a complete architectural migration to **NestJS**, featuring:

* Modular NestJS architecture
* Strongly typed shared contracts
* Event-driven communication
* Improved observability
* Shared models across backend and frontend applications

---

# Features

* ✅ NestJS backend
* ✅ Nx monorepo
* ✅ Event-driven architecture
* ✅ RabbitMQ messaging
* ✅ Redis caching
* ✅ MongoDB persistence
* ✅ Server-Sent Events (SSE)
* ✅ OpenTelemetry distributed tracing
* ✅ Prometheus metrics
* ✅ Shared TypeScript contracts
* ✅ React frontend
* ✅ Vue frontend
* ✅ Angular frontend
* ✅ Mock provider and real SpaceX API provider

---

# Architecture

```
                    SpaceX API / Mock Provider
                               │
                               ▼
                    ┌────────────────────┐
                    │   NestJS Gateway   │
                    └────────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
             RabbitMQ       MongoDB       Redis
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
                        Server-Sent Events
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
           React              Vue             Angular
```

---

# Tech Stack

## Backend

* NestJS
* TypeScript
* RabbitMQ
* Redis
* MongoDB
* OpenTelemetry
* Prometheus
* Server-Sent Events (SSE)
* Docker

## Frontend

* React
* Vue
* Angular

## Workspace

* Nx Monorepo

---

# Design Principles

* SOLID principles
* Dependency Injection
* Domain-driven modular architecture
* Event-driven communication
* Shared contracts between backend and frontend
* Strong TypeScript typing
* Separation of concerns (SRP)

---

# Repository Structure

```text
apps/
├── gateway         # NestJS backend
├── react-app       # React client
├── vue-app         # Vue client
└── ang-app         # Angular client

libs/
├── gateway-contracts
├── shared-types
├── shared-ui
├── shared-utils
└── spacex-types
```

---

# Observability

The gateway includes built-in observability using:

* OpenTelemetry tracing
* Prometheus metrics
* Correlation IDs
* Structured logging (Pino)
* Health endpoints

---

# Future Improvements

* Jaeger integration
* Grafana dashboards
* Kubernetes deployment
* Authentication & Authorization
* CI/CD pipeline
* Docker Compose production profile

---

# License

MIT
