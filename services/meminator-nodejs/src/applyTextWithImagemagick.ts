import { generateRandomFilename } from "./download";
import { trace } from "@opentelemetry/api";
import { spawnProcess } from "./shellOut";
import { bunyanLogger } from "./logger";
import { inSpanAsync } from "./o11yday-lib";

const IMAGE_MAX_HEIGHT_PX = 1000;
const IMAGE_MAX_WIDTH_PX = 1000;

export async function applyTextWithImagemagick(
  phrase: string,
  inputImagePath: string
) {
  const outputImagePath = `/tmp/${generateRandomFilename("png")}`;
  //   bunyanLogger.info(
  //     {
  //       "app.inputImagePath": inputImagePath,
  //       "app.outputImagePath": outputImagePath,
  //     },
  //     "meminating now"
  //   );
  trace.getActiveSpan()?.setAttributes({
    "app.phrase": phrase,
    "app.inputImagePath": inputImagePath,
    "app.outputImagePath": outputImagePath,
    "app.maxHeightPx": IMAGE_MAX_HEIGHT_PX,
    "app.maxWidthPx": IMAGE_MAX_WIDTH_PX,
  });

  const pointsize = 48;
  const DEFAULT_FONT = "Angkor-Regular";
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

  const processResult = await spawnProcess("convert", args);

  // Notice how often it happens that the text does not fit
  // checkWhetherTextFits(pointsize, DEFAULT_FONT, phrase, outputImagePath);

  return outputImagePath;
}

async function checkWhetherTextFits(
  pointsize: number,
  font: string,
  text: string,
  imageFilename: string
) {
  return inSpanAsync(
    "check text width",
    {
      attributes: {
        "text.pointsize": pointsize,
        "text.font": font,
        "text.content": text,
        "text.length": text.length,
      },
    },
    async (span) => {
      const { width: imageWidth } = await measureImageWidth(imageFilename);
      const { width: textWidth } = await measureTextWidth(
        pointsize,
        font,
        text
      );
      if (textWidth > imageWidth) {
        bunyanLogger.warn(
          {
            "text.width": textWidth,
            "image.width": imageWidth,
            "text.content": text,
            "text.length": text.length,
          },
          `Text width is greater than image width: ${textWidth} > ${imageWidth}`
        );
      }
      span.setAttributes({
        "text.width": textWidth,
        "image.width": imageWidth,
        "text.doesItFit": textWidth <= imageWidth,
      });
      return { textWidth, imageWidth };
    }
  ).then(({ textWidth, imageWidth }) =>
    bunyanLogger.info(
      { "app.textWidth": textWidth, "app.imageWidth": imageWidth },
      "Text width check complete"
    )
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
    throw new Error(
      `Could not parse width from ImageMagick output: ${result.stdout}`
    );
  }
  return { width };
}

async function measureImageWidth(filepath: string) {
  return await spawnProcess("identify", ["-format", "%w %x", filepath]).then(
    (result) => {
      const [width, density] = result.stdout.split(" ").map((s) => parseInt(s));
      bunyanLogger.debug(
        {
          "identify.filepath": filepath,
          "identify.width": width,
          "identify.density": density,
          "identify.error": result.stderr,
        },
        `Identify on output file: ${result.stdout}`
      );
      return { width, density };
    }
  );
}
