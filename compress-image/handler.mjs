import compress_images from "compress-images";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import mime from "mime";

const PATH_UNCOMPRESS_IMAGE = "original_image/";
const PATH_COMPRESS_IMAGE = "compress_image/";
var bucket_name = "";
var file_path = "";

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
const saveCompressImageToS3 = async (bucket, upload_path, local_path) => {
  let s3 = new AWS.S3();

  let file_content = await fs.readFileSync(local_path);
  let content_type = await mime.getType(local_path);
  try {
    let obj = await s3
      .putObject({
        Bucket: bucket,
        Key: upload_path,
        Body: file_content,
        ContentType: content_type,
      })
      .promise();
    console.log("File Put Success");
    let status = fs.unlinkSync(local_path);
    console.log("File Delete Status:", status);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
const compressImageAtPath = async (image_path) => {
  try {
    await compress_images(
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
          fs.unlinkSync(image_path);
          saveCompressImageToS3(
            bucket_name,
            file_path,
            PATH_COMPRESS_IMAGE + path.basename(image_path)
          );

          console.log("Status:", completed);
          return PATH_COMPRESS_IMAGE + "";
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
  file_path = "images/image-1.jpg";
  bucket_name = "tetris-testbucket-v1";
  let image_path = await saveImageToLocalFormS3Event(bucket_name, file_path);
  let compressImagePath = await compressImageAtPath(image_path);
  console.log("compressImagePath:", compressImagePath);
  console.log("Sharp Obj:", event);
};

export default imagecompress;
