package io.honeydemo.meminator.backendforfrontend.controller;

import java.net.MalformedURLException;
import java.util.HashMap;
import java.util.Map;

import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.message.ObjectMessage;
import org.apache.logging.log4j.LogManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@RestController
public class PictureController {

    private final WebClient webClient;

    @Autowired
    public PictureController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://phrase-picker:10114").build();
    }

    @PostMapping("/createPicture")
    public Mono<ResponseEntity<Resource>> createPicture() throws MalformedURLException {
        // choose a random phrase from the list
        String imagePath = "static/rug.png";
        Mono<String> phraseResult;

        Map<String, String> mapMessage = new HashMap<>();
        mapMessage.put("app.message", "Something interesting happened");

        Resource resource = new ClassPathResource(imagePath);

        phraseResult = webClient.get().uri("/phrase").retrieve().bodyToMono(String.class);

        // Check if the file exists
        if (!resource.exists()) {
            return phraseResult.map(v -> ResponseEntity.notFound().build());
        }

        // Set content type header
        MediaType mediaType = MediaType.IMAGE_PNG;

        // Return the image file as a ResponseEntity
        return phraseResult.map(v -> {
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + resource.getFilename())
                    .body(resource);
        });
    }

    static class PhraseResult {
        private String phrase;

        public PhraseResult(String phrase) {
            this.phrase = phrase;
        }

        public String getPhrase() {
            return phrase;
        }

        public void setPhrase(String phrase) {
            this.phrase = phrase;
        }
    }
}
