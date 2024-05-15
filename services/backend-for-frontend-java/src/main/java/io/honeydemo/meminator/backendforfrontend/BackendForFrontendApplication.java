package io.honeydemo.meminator.backendforfrontend;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk;
import io.opentelemetry.instrumentation.log4j.appender.v2_17.OpenTelemetryAppender;

import io.opentelemetry.sdk.OpenTelemetrySdk;

@SpringBootApplication
public class BackendForFrontendApplication {

	public static void main(String[] args) {

		OpenTelemetrySdk sdk = AutoConfiguredOpenTelemetrySdk.initialize().getOpenTelemetrySdk();

		SpringApplication.run(BackendForFrontendApplication.class, args);

		OpenTelemetryAppender.install(sdk);

		Logger logger = LogManager.getLogger("poo");
		logger.info("everything is stupid");
	}

}
