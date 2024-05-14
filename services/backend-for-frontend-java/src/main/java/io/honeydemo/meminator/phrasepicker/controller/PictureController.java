package io.honeydemo.meminator.backendForFrontend.controller;

import java.lang.reflect.Array;
import java.net.MalformedURLException;
import java.nio.charset.MalformedInputException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import io.opentelemetry.api.trace.Span; // INSTRUMENTATION
import reactor.core.publisher.Mono;

@RestController
public class PictureController {


    private final WebClient webClient;

    @Autowired
    public PictureController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://phrase-picker:10114/phrase").build();
    }

    @PostMapping("/createPicture")
    public Mono<ResponseEntity<Resource>> createPicture() throws MalformedURLException {
        // choose a random phrase from the list
        String imagePath = "static/rug.png";
        Span span = Span.current(); // INSTRUMENTATION
        span.setAttribute("app.imagePath", imagePath); // INSTRUMENTATION
        Resource resource = new ClassPathResource(imagePath);

        var phraseResult = webClient.get().retrieve().bodyToMono(String.class);
        phraseResult.doOnNext(value -> span.setAttribute("app.phrase", value));

        // Check if the file exists
        if (!resource.exists()) {
            span.setAttribute("error.message", "the image does not exist");
            return phraseResult.map(v -> ResponseEntity.notFound().build());
        }

        // Set content type header
        MediaType mediaType = MediaType.IMAGE_PNG;

        // Return the image file as a ResponseEntity
        return phraseResult.map(v -> {
            Span.current().setAttribute("app.where_am_i", "in the map");
            span.setAttribute("app.where_am_i", "in the map, but using the first span");
            return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + resource.getFilename())
                .body(resource);
            });
    }

    public static class PhraseResult {
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
