import compress_images from "compress-images";
import AWS from "aws-sdk";
import fs from "fs";

const PATH_UNCOMPRESS_IMAGE = "original_image/";
const PATH_COMPRESS_IMAGE = "";

const saveImageToLocalFormS3Event = async (bucket, image_path) => {
  let s3 = new AWS.S3();
  let obj = await s3
    .getObject({
      Bucket: bucket,
      Key: image_path,
    })
    .promise();

  let data = await obj.Body;

  try {
    fs.writeFileSync(PATH_COMPRESS_IMAGE + "test.jpg", data);
    console.log("File has been saved.");
  } catch (error) {
    console.error(error);
  }

  return data;
};

export const imagecompress = async (event) => {
  console.log("Event:", event);
  let input_path = "image-1.jpeg";
  let output_path = "";
  saveImageToLocalFormS3Event("tetris-testbucket-v1", "images/image-1.jpg");

  //   try {
  //     compress_images(
  //       input_path,
  //       output_path,
  //       { compress_force: false, statistic: true, autoupdate: true },
  //       false,
  //       { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
  //       { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
  //       { svg: { engine: "svgo", command: "--multipass" } },
  //       {
  //         gif: {
  //           engine: "gifsicle",
  //           command: ["--colors", "64", "--use-col=web"],
  //         },
  //       },
  //       function (err, completed) {
  //         if (completed === true) {
  //           // Doing something.
  //           console.log("Status:", completed);
  //         } else {
  //           console.log("Error:", err);
  //         }
  //       }
  //     );
  //   } catch (error) {
  //     console.log("Catch Error:", error);
  //   }

  console.log("Sharp Obj:", event);
};

export default imagecompress;
