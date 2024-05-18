# Stage 1: Download dependencies
FROM maven:3.9.6-eclipse-temurin-21-jammy AS dependencies

WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:resolve dependency:resolve-plugins
RUN wget https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v1.33.2/opentelemetry-javaagent.jar

# Stage 2: Build application
FROM dependencies AS build
COPY src ./src
RUN mvn -B package -DskipTests

# Stage 3: Final image
FROM eclipse-temurin:21-jdk-jammy

RUN apt-get update
RUN apt-get install -y imagemagick
# Create a directory for custom fonts
RUN mkdir -p /usr/share/fonts/truetype
# Copy font files from host to container
COPY ./Angkor/*.ttf /usr/share/fonts/truetype/
# Refresh font cache
RUN fc-cache -f -v

WORKDIR /app

COPY --from=build /app/target/meminator-0.0.1-SNAPSHOT.jar ./meminator.jar
COPY --from=dependencies /app/opentelemetry-javaagent.jar .
EXPOSE 8080
CMD ["java", "-javaagent:./opentelemetry-javaagent.jar", "-jar", "meminator.jar"]
