package io.honeydemo.meminator.phrasepicker.controller;

import java.util.Arrays;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.opentelemetry.api.trace.Span;

@RestController
public class PhraseController {

     private static final Logger logger = LogManager.getLogger("io.honeydemo.meminator.phrasepicker");

    private static List<String> PhraseList = Arrays.asList(
            "you're muted",
            "not dead yet",
            "Let them.",
            "Boiling Loves Company!",
            "Must we?",
            "SRE not-sorry",
            "Honeycomb at home",
            "There is no cloud",
            "This is fine",
            "It's a trap!",
            "Not Today",
            "You had one job",
            "bruh",
            "have you tried restarting?",
            "try again after coffee",
            "deploy != release",
            "oh, just the crimes",
            "not a bug, it's a feature",
            "test in prod",
            "who broke the build?",
            "it could be worse",
            "Hold on, pausing for GC", // JAVA
            "AbstractSingletonProxyFactoryBean", // JAVA
            "Generics were a mistake", // JAVA
            "give my kids a completablefuture",
            "I'm a software engineer, I have feelings",
            "Hello Wrold"
            );

    @GetMapping("/phrase")
    public PhraseResult hello() {
        // choose a random phrase from the list
        int choice = (int) (Math.random() * PhraseList.size());
        
        logger.info("app.listSize=" + PhraseList.size() + ", app.choice=" + choice);
        
        String chosenPhrase = PhraseList.get(choice);
        
        logger.info("app.phrase=" + chosenPhrase);
        Span span = Span.current();
        span.setAttribute("app.listSize", PhraseList.size());
        span.setAttribute("app.choice", choice);
        span.setAttribute("app.phrase", chosenPhrase);
        return new PhraseResult(chosenPhrase);
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
