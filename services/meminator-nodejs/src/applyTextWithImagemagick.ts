import { generateRandomFilename } from "./download";
import { trace } from "@opentelemetry/api";
import { spawnProcess } from "./shellOut";
import { inSpanAsync } from "./o11yday-lib";

const IMAGE_MAX_HEIGHT_PX = 1000;
const IMAGE_MAX_WIDTH_PX = 1000;
const DEFAULT_FONT = "Angkor-Regular";
const DEFAULT_POINTSIZE = 48;

export async function applyTextWithImagemagick(phrase: string, inputImagePath: string) {
  const outputImagePath = `/tmp/${generateRandomFilename("png")}`;
  const span = trace.getActiveSpan();

  span?.setAttributes({
    "app.phrase": phrase,
    "app.meminate.inputImagePath": inputImagePath,
    "app.meminate.outputImagePath": outputImagePath,
    "app.meminate.maxHeightPx": IMAGE_MAX_HEIGHT_PX,
    "app.meminate.maxWidthPx": IMAGE_MAX_WIDTH_PX,
  });

  // Step 2: see if we can predict the width of the image
  reportPredictedWidth(inputImagePath);

  //  Step 3: implement the text fitting
  const pointsize = await reducePointsizeToFit(inputImagePath, phrase, DEFAULT_POINTSIZE);
  span?.setAttribute("text.pointsize", pointsize);

  // const pointsize = DEFAULT_POINTSIZE;
  const args = [
    inputImagePath,
    "-resize",
    `${IMAGE_MAX_WIDTH_PX}x${IMAGE_MAX_HEIGHT_PX}\>`,
    "-gravity",
    "North",
    "-pointsize",
    `${pointsize}`,
    "-fill",
    "white",
    "-undercolor",
    "#00000080",
    "-font",
    DEFAULT_FONT,
    "-annotate",
    "0",
    `${phrase}`,
    outputImagePath,
  ];

  await spawnProcess("convert", args);

  // Step 1: Notice how often it happens that the text does not fit
  checkWhetherTextFits(pointsize, DEFAULT_FONT, phrase, outputImagePath);

  return outputImagePath;
}

// If the text does not fit, log a warning
async function checkWhetherTextFits(pointsize: number, font: string, text: string, imageFilename: string) {
  return inSpanAsync(
    "check text width",
    { attributes: { "text.pointsize": pointsize, "text.font": font, "text.content": text, "text.length": text.length } },
    async (span) => {
      const { width: imageWidth } = await measureImageWidth(imageFilename);
      const { width: textWidth } = await measureTextWidth(pointsize, font, text);
      if (textWidth > imageWidth) {
        span.addEvent(`warning`, {
          "text.width": textWidth,
          "image.width": imageWidth,
          "text.content": text,
          "text.length": text.length,
          message: `Text width is greater than image width: ${textWidth} > ${imageWidth}`,
        });
      }
      span.setAttributes({ "text.width": textWidth, "image.width": imageWidth, "text.doesItFit": textWidth <= imageWidth });
    }
  );
}

async function measureTextWidth(pointsize: number, font: string, text: string) {
  const result = await spawnProcess("convert", [
    "-pointsize",
    `${pointsize}`,
    "-font",
    `${font}`,
    "-format",
    "%w",
    //   '-density', `${imageDensity}`,
    `label:${text}`,
    "info:",
  ]);
  // convert stdout to int
  const width = parseInt(result.stdout);
  if (Number.isNaN(width)) {
    throw new Error(`Could not parse width from ImageMagick output: ${result.stdout}`);
  }
  return { width };
}

async function measureImageWidth(filepath: string) {
  return await spawnProcess("identify", ["-format", "%w %x", filepath]).then((result) => {
    const [width, density] = result.stdout.split(" ").map((s) => parseInt(s));
    trace.getActiveSpan()?.addEvent("debug", {
      "identify.filepath": filepath,
      "identify.width": width,
      "identify.density": density,
      "identify.error": result.stderr,
      message: `Identify on output file: ${result.stdout}`,
    });
    return { width, density };
  });
}

// only create a span with the predicted image size on it. Is it the same as what we actually get?
async function reportPredictedWidth(imageFilename: string) {
  inSpanAsync("predict image width", { attributes: { "image.filename": imageFilename } }, async (span) => {
    const width = await predictImageWidth(imageFilename);
    span.setAttribute("image.predictedWidth", width);
  });
}

// based on what we're going to scale to, and the image we're starting with, what will the width be in pixels?
async function predictImageWidth(imageFilename: string) {
  const result = await spawnProcess("identify", ["-format", "%wx%h", imageFilename]);
  if (result.code !== 0) {
    throw new Error(`Could not get image dimensions from ImageMagick: ${result.stderr}`);
  }
  const [width, height] = result.stdout.split("x").map((s) => parseInt(s));

  // we are going to resize the image to  IMAGE_MAX_WIDTH_PX x IMAGE_MAX_HEIGHT_PX
  const ratioForHeightLimitation = Math.min(IMAGE_MAX_HEIGHT_PX / height, 1); // I had a bug here, it was max instead of min
  const widthLimitedByHeight = width * ratioForHeightLimitation;
  const finalWidth = Math.min(width, IMAGE_MAX_WIDTH_PX, widthLimitedByHeight);

  trace.getActiveSpan()?.setAttributes({
    "image.width": width,
    "image.height": height,
    "image.ratioForHeightLimitation": ratioForHeightLimitation,
    "image.widthLimitedByHeight": widthLimitedByHeight,
    "image.maxWidth": IMAGE_MAX_WIDTH_PX,
    "image.maxHeight": IMAGE_MAX_HEIGHT_PX,
    "image.predictedWidth": finalWidth,
  });
  return finalWidth;
}

/**
 * return the pointsize that will make the text fit in the image
 */
async function reducePointsizeToFit(inputImagePath: string, phrase: string, startingPointsize: number): Promise<number> {
  var pointsize = startingPointsize;
  return inSpanAsync("reduce pointsize to fit text", { attributes: { "text.content": phrase, "text.startingPointsize": startingPointsize } }, async (span) => {
    const predictedImageWidth = await predictImageWidth(inputImagePath);
    var tries = 0;
    while ((await measureTextWidth(pointsize, DEFAULT_FONT, phrase)).width > (await predictedImageWidth)) {
      pointsize--;
      tries++;
      span.addEvent("Reducing pointsize to fit text in image", {
        "text.pointsize": pointsize,
        "text.content": phrase,
        "text.targetWidth": predictedImageWidth,
      });
    }
    span.setAttributes({
      "text.pointsize": pointsize,
      "text.triesToGetItToFit": tries,
      "text.startingPointsize": startingPointsize,
      "image.predictedWidth": predictedImageWidth,
    });
    return pointsize;
  });
}
