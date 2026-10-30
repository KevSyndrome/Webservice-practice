# Webservice practice

Monorepo para practicar distintos tipos de webservices y sus contratos.

| App | Stack | Puerto | Descripción |
|---|---|---|---|
| `apps/api` | Java 25 + Spring Boot 4 | 8090 | WS expuestos (REST, SOAP; luego GraphQL y gRPC) |
| `apps/portal` | React + Vite | 5173 | Portal que consume los WS (vía proxy a la API) |

## Arrancar

```bash
# API
cd apps/api && ./mvnw spring-boot:run

# Portal (en otra terminal)
cd apps/portal && npm install && npm run dev
```

## Contratos

| Tipo | Contrato | URL local |
|---|---|---|
| REST | OpenAPI 3 | http://localhost:8090/v3/api-docs · UI: http://localhost:8090/swagger-ui.html |
| SOAP | WSDL + XSD | http://localhost:8090/ws/products.wsdl |

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
