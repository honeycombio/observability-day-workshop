# Stage 1: Download dependencies
FROM maven:3.9.6-eclipse-temurin-21-jammy AS dependencies
ARG OTEL_JAVA_AGENT_VERSION
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:resolve dependency:resolve-plugins
RUN wget https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.9.0/opentelemetry-javaagent.jar

# Stage 2: Build application
FROM dependencies AS build
COPY src ./src
RUN mvn -B package -DskipTests

# Stage 3: Final image
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/phrase-picker-0.0.1-SNAPSHOT.jar ./phrase-picker.jar
COPY --from=dependencies /app/opentelemetry-javaagent.jar .
EXPOSE 10118
CMD ["java", "-javaagent:./opentelemetry-javaagent.jar", "-jar", "phrase-picker.jar"]
