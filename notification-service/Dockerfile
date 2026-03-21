# Multi-stage: build with Maven then run with JRE (multi-arch: amd64 + arm64/Apple Silicon)
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B || true
COPY src ./src
RUN mvn package -DskipTests -B -q

# Use non-Alpine JRE for multi-platform support (eclipse-temurin Alpine lacks arm64)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /build/target/notification-service-*.jar app.jar
EXPOSE 3004
ENTRYPOINT ["java", "-jar", "app.jar"]
