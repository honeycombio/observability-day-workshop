package io.honeydemo.meminator.meminator.controller;

import java.lang.reflect.Array;
import java.lang.ProcessBuilder;
import java.lang.Process;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URL;
import javax.imageio.ImageIO;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span; // INSTRUMENTATION
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@RestController
public class MeminatorController {

    private static final int IMAGE_MAX_WIDTH_PX = 1000;
    private static final int IMAGE_MAX_HEIGHT_PX = 1000;

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        return response;
    }

    Logger logger = LogManager.getLogger("MeminatorController");

    @PostMapping("/applyPhraseToPicture")
    public ResponseEntity<byte[]> meminate(@RequestBody ImageRequest request) {
        File inputFile = null;
        File outputFile = null;

        try {
            String phrase = request.getPhrase();
            URL url = new URL(request.getImageUrl());
            
            String filename = new File(url.getPath()).getName();
            String fileExtension = getFileExtension(filename);
            // download the image using URL
            BufferedImage originalImage = ImageIO.read(url);
            inputFile = new File("/tmp/" + filename);
            ImageIO.write(originalImage, fileExtension, inputFile);

            // generate output file path
            String outputFilePath = getOutputFilePath(fileExtension);
            outputFile = new File(outputFilePath);

            // run the convert command
            Span subprocessSpan = GlobalOpenTelemetry.getTracer("pictureController").spanBuilder("convert").startSpan();
            ProcessBuilder pb = new ProcessBuilder(new String[] {
                "convert", 
                inputFile.getAbsolutePath(), 
                "-resize", 
                IMAGE_MAX_WIDTH_PX + "x" + IMAGE_MAX_HEIGHT_PX,
                "-gravity", "North",
                "-pointsize", "48",
                "-fill", "white",
                "-undercolor", "#00000080",
                "-font", "Angkor-Regular",
                "-annotate", "0",
                phrase.toUpperCase(),
                outputFilePath
            });
            subprocessSpan.setAttribute("app.subprocess.command", String.join(" ", pb.command()));
            pb.inheritIO();
            Process process = pb.start();

            InputStream stream = process.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
            StringBuilder output = new StringBuilder();
            String line = "";
            while((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            InputStream errStream = process.getErrorStream();
            BufferedReader errReader = new BufferedReader(new InputStreamReader(errStream));
            StringBuilder error = new StringBuilder();
            String errLine = "";
            while((errLine = errReader.readLine()) != null) {
                error.append(errLine).append("\n");
            }

            int exitCode = process.waitFor();
            subprocessSpan.setAttribute("app.subprocess.returncode", exitCode);
            subprocessSpan.setAttribute("app.subprocess.stdout", output.toString());
            subprocessSpan.setAttribute("app.subprocess.stderr", error.toString());
            subprocessSpan.end();

            // read the output file back into the byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            BufferedImage outputImage = ImageIO.read(new File(outputFilePath));
            ImageIO.write(outputImage, fileExtension, baos);
            byte[] imageBytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(getMediaType(fileExtension));
            headers.setContentLength(imageBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(imageBytes);

        } catch (Exception e) {
            logger.error(e.getClass() + ": " +  e.getMessage() + ": " + e.getCause(), e);
            return ResponseEntity.status(500).build();
        } finally {
            if(inputFile != null) try { inputFile.delete(); } catch (Exception ide) { ide.printStackTrace(); }
            if(outputFile != null) try { outputFile.delete(); } catch (Exception ode) { ode.printStackTrace(); }
        }
    }

    private String getOutputFilePath(String extension) {
        return "/tmp/" + UUID.randomUUID().toString() + "." + extension;
    }

    private MediaType getMediaType(String fileExtension) {
        switch (fileExtension.toLowerCase()) {
            case "jpg":
            case "jpeg":
                return MediaType.IMAGE_JPEG;
            case "png":
                return MediaType.IMAGE_PNG;
            case "gif":
                return MediaType.IMAGE_GIF;
            default:
                return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndexOfDot = fileName.lastIndexOf('.');
        return (lastIndexOfDot == -1) ? "" : fileName.substring(lastIndexOfDot + 1);
    }

    public static class ImageRequest {
        private String phrase;
        private String imageUrl;

        public ImageRequest(String phrase, String imageUrl) {
            this.phrase = phrase;
            this.imageUrl = imageUrl;
        }

        public String getPhrase() {
            return this.phrase;
        }

        public void setPhrase(String phrase) {
            this.phrase = phrase;
        }

        public String getImageUrl() {
            return this.imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }
    }
}
