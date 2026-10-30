# Un solo servicio: Spring Boot sirve la API y también el portal ya compilado (mismo origen, sin CORS)

# 1) Portal: React + Vite -> archivos estáticos
FROM node:24-alpine AS portal
WORKDIR /portal
COPY apps/portal/package.json apps/portal/package-lock.json ./
RUN npm ci
COPY apps/portal/ ./
RUN npm run build

# 2) API: el portal se copia a static/ antes de empaquetar el jar
FROM eclipse-temurin:25-jdk AS api
WORKDIR /api
COPY apps/api/ ./
COPY --from=portal /portal/dist src/main/resources/static
RUN ./mvnw -q -B package -DskipTests

# 3) Imagen final: solo el JRE y el jar
FROM eclipse-temurin:25-jre
WORKDIR /app
# /data es donde Railway monta el volumen; sin volumen la BD se pierde en cada deploy
RUN mkdir -p /data
COPY --from=api /api/target/*.jar app.jar
ENV DATABASE_PATH=/data/api.db \
    JAVA_TOOL_OPTIONS="-Xmx320m -XX:+UseSerialGC"
EXPOSE 8090
CMD ["java", "-jar", "app.jar"]
