package io.honeydemo.meminator.phrasepicker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import io.opentelemetry.api.trace.Span; // INSTRUMENTATION

@RestController
public class PhraseController {

    @GetMapping("/phrase")
    public PhraseResult hello() {
        String phrase = "It could be worse";
        // INSTRUMENTATION: add a useful attribute
        // Span.current().setAttribute("app.phrase", phrase);
        return new PhraseResult(phrase);
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
