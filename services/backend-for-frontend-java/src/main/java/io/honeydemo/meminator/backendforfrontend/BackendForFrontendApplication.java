package io.honeydemo.meminator.backendforfrontend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk;
import io.opentelemetry.instrumentation.log4j.appender.v2_17.OpenTelemetryAppender;

import io.opentelemetry.sdk.OpenTelemetrySdk;

@SpringBootApplication
public class BackendForFrontendApplication {

	public static void main(String[] args) {

		OpenTelemetrySdk sdk = AutoConfiguredOpenTelemetrySdk.initialize().getOpenTelemetrySdk();

		OpenTelemetryAppender.install(sdk);

		SpringApplication.run(BackendForFrontendApplication.class, args);
	}

}
