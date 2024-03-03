import compress_images from "compress-images";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const PATH_UNCOMPRESS_IMAGE = "original_image/";
const PATH_COMPRESS_IMAGE = "compress_image/";

const saveImageToLocalFormS3Event = async (bucket, image_path) => {
  let s3 = new AWS.S3();
  let obj = await s3
    .getObject({
      Bucket: bucket,
      Key: image_path,
    })
    .promise();

  let file_name = await path.basename(image_path);
  let data = await obj.Body;

  try {
    fs.writeFileSync(PATH_UNCOMPRESS_IMAGE + file_name, data);
    console.log("File has been saved.");
  } catch (error) {
    console.error(error);
  }

  return PATH_UNCOMPRESS_IMAGE + file_name;
};

const compressImageAtPath = async (image_path) => {
  try {
    compress_images(
      image_path,
      PATH_COMPRESS_IMAGE,
      { compress_force: false, statistic: true, autoupdate: true },
      false,
      { jpg: { engine: "mozjpeg", command: ["-quality", "30"] } },
      { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
      { svg: { engine: "svgo", command: "--multipass" } },
      {
        gif: {
          engine: "gifsicle",
          command: ["--colors", "64", "--use-col=web"],
        },
      },
      function (err, completed) {
        if (completed === true) {
          // Doing something.
          console.log("Status:", completed);
        } else {
          console.log("Error:", err);
        }
      }
    );
  } catch (error) {
    console.log("Catch Error:", error);
  }
};

export const imagecompress = async (event) => {
  console.log("Event:", event);
  let input_path = "image-1.jpeg";
  let output_path = "";
  let image_path = await saveImageToLocalFormS3Event(
    "tetris-testbucket-v1",
    "images/image-1.jpg"
  );
  await compressImageAtPath(image_path);

  console.log("Sharp Obj:", event);
};

export default imagecompress;
