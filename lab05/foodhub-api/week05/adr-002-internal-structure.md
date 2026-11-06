# ADR-002: Internal structure of the FoodHub backend

Status: accepted · 2026-11-06 · decided by the project team

## Context
FoodHub is built by a team of 3 to 4 students and runs as one NestJS application. The backend covers identity, catalog, ordering, payment, delivery and notification. In week 4 the code was flat: controllers held business rules (idempotency, allowed status changes) and read and wrote shared Maps in `data.ts`, so storage was tied to the logic. Week 10 adds PostgreSQL, so ordering must be able to change its storage without changing its rules. Three structures were considered:
1. Layered (controller, service, repository across the whole app).
2. Modular monolith (one NestJS module per business area, with explicit imports and exports).
3. Hexagonal (ports and adapters around the business logic).

## Decision
Build a **modular monolith** with one NestJS module per business area, and use **ports and adapters** at the storage boundary of the ordering module. A module shares only its service (`exports: [CatalogService]`) and keeps its repository private. `OrdersService` depends on the `OrderRepository` port, and `OrderingModule` binds that port to `InMemoryOrderRepository` in one line. Controllers handle HTTP only; business rules live in services. Pure layering was rejected because it does not stop one area from reaching into another. Full hexagonal for every module was rejected because it adds interfaces we do not need yet.

## Consequences
Positive:
- Clear ownership: each module owns its data, and other modules can only use its exported service.
- Nest enforces the boundary at start-up: injecting `CatalogRepository` into `OrdersService` fails because it is not exported.
- Week 10 can add a PostgreSQL adapter by changing one provider line, with no change to the ordering rules.
- Services can be tested without HTTP or a database.
- One deployable app is simple for a small team, and a module can later become a service if needed.

Negative:
- The boundary is checked when the app starts, not when it compiles, so we also keep the grep check in the checklist.
- A port and an adapter add files and indirection for a small codebase.
- One process means one scaling unit and one failure domain.
- Data is lost on restart until the PostgreSQL adapter exists in week 10.
