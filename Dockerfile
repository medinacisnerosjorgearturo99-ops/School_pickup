FROM gradle:9.5.0-jdk21 AS build
WORKDIR /src
COPY deploy/fly/settings.gradle.kts settings.gradle.kts
COPY deploy/fly/build.gradle.kts build.gradle.kts
COPY gradle.properties gradle.properties
COPY gradle/libs.versions.toml gradle/libs.versions.toml
COPY server server
RUN gradle :server:installDist --no-daemon

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /src/server/build/install/server /app
ENV SCHOOLPICKUP_DB=/data/schoolpickup.db
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/bin/server"]
