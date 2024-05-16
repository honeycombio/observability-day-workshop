package io.honeydemo.meminator.backendforfrontend;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendForFrontendApplication {

	public static void main(String[] args) {

		SpringApplication.run(BackendForFrontendApplication.class, args);

		Logger logger = LogManager.getLogger("backendForFrontend");
		logger.info("Startup");
	}

}
