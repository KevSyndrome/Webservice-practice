# Webservice practice

Monorepo para practicar distintos tipos de webservices y sus contratos.

| App | Stack | Puerto | Descripción |
|---|---|---|---|
| `apps/api` | Java 25 + Spring Boot 4.1 + SQLite | 8090 (HTTP), 9095 (gRPC) | WS propios REST, SOAP, GraphQL y gRPC, y cliente de WS externos |
| `apps/portal` | React + Vite + Tailwind 4 + daisyUI 5 | 5173 | Catálogo para probar cada WS (vía proxy a la API) |

Los productos se guardan en `apps/api/api.db` (SQLite, ignorado en git). Bórralo para volver a los datos iniciales.

## Arrancar

```bash
# API
cd apps/api && ./mvnw spring-boot:run

# Portal (en otra terminal)
cd apps/portal && npm install && npm run dev
```

## Deploy en Railway

En producción es **un solo servicio**: el `Dockerfile` de la raíz compila el portal, lo mete en `static/` del jar y Spring Boot sirve todo desde el mismo dominio. `railway.json` le dice a Railway que use ese Dockerfile y revise `/api/v1/products` como healthcheck.

1. En Railway: **New Project → Deploy from GitHub repo →** `KevSyndrome/Webservice-practice`.
2. En el servicio: **Settings → Source → Branch**: `main` (cada push a `main` despliega).
3. **Volumen** para que SQLite sobreviva a los deploys: clic derecho en el servicio → **Attach volume**, mount path `/data`.
4. **Dominio**: **Settings → Networking → Generate Domain**, y edita el nombre (por ejemplo `webservice-practice.up.railway.app`).

No hace falta definir variables: Railway inyecta `PORT` y el Dockerfile fija `DATABASE_PATH=/data/api.db`. Para ajustar memoria, define `JAVA_TOOL_OPTIONS` (por defecto `-Xmx320m -XX:+UseSerialGC`).

El servidor gRPC (9095) queda interno: el portal lo usa a través del puente `/api/v1/grpc-bridge`. Para llamarlo desde fuera haría falta un TCP Proxy de Railway.

Probar la imagen en local:

```bash
docker build -t webservice-practice .
docker run --rm -p 8090:8090 -v webservice-data:/data webservice-practice
# http://localhost:8090
```

## APIs propias: productos

| Tipo | Contrato | Endpoint | Operaciones |
|---|---|---|---|
| REST | OpenAPI 3: http://localhost:8090/swagger-ui.html | `/api/v1/products` | `GET`, `GET /{id}`, `POST` |
| SOAP | WSDL + XSD: http://localhost:8090/ws/products.wsdl | `POST /ws` | `listProducts`, `getProduct`, `createProduct` |
| GraphQL | `apps/api/src/main/resources/graphql/products.graphqls` · GraphiQL: http://localhost:8090/graphiql | `POST /graphql` | `products`, `product(id)`, `createProduct` |
| gRPC | `apps/api/src/main/protobuf/products/v1/products.proto` | `localhost:9095` | `ListProducts`, `GetProduct`, `CreateProduct` |

El navegador no habla gRPC nativo; el portal usa el puente `/api/v1/grpc-bridge/products`, que hace la llamada gRPC real.

## APIs externas (consumidas por nuestra API, patrón BFF)

| Proveedor | Tipo | Contrato | Lo expone nuestra API en |
|---|---|---|---|
| Open-Meteo | REST | JSON sin contrato formal | `GET /api/v1/weather?lat=&lon=` |
| CountryInfo (oorsprong) | SOAP | `apps/api/src/main/resources/wsdl/countryinfo.wsdl` (copia local) | `GET /api/v1/countries/{iso}` |
| Countries (trevorblades) | GraphQL | Esquema público, consulta en `CountriesGraphqlClient` | `GET /api/v1/graphql-countries/{iso}` |
| grpcb.in | gRPC (TLS, 9001) | `apps/api/src/main/protobuf/grpcbin/hello.proto` (copia mínima) | `GET /api/v1/greeting?name=` |

## Flujo de trabajo y versionado

**Ramas (trunk-based):** `main` siempre estable. Todo cambio entra por una rama corta + Pull Request.

```
feat/<algo>    nueva funcionalidad
fix/<algo>     corrección
chore/<algo>   tooling, CI, dependencias
docs/<algo>    documentación
```

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/es/) con el scope de la app:

```
feat(api): agrega endpoint SOAP de productos
fix(portal): corrige manejo de errores
chore(ci): ...
```

Un `feat` sube MINOR, un `fix` sube PATCH, un `!` o `BREAKING CHANGE:` sube MAJOR.

**Releases:** SemVer con tag por app, para versionarlas por separado:

```bash
git tag -a api-v0.1.0 -m "api 0.1.0" && git push origin api-v0.1.0
git tag -a portal-v0.1.0 -m "portal 0.1.0" && git push origin portal-v0.1.0
```

**Versión del contrato (distinta a la del código):**
- REST: en la URL (`/api/v1/...`). Solo se crea `/v2` ante un cambio que rompe (quitar/renombrar campos, cambiar tipos). Agregar campos opcionales no rompe.
- SOAP: en el namespace del XSD (`http://practice.com/products/v1`). Mismo criterio.
