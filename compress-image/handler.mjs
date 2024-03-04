import compress_images from "compress-images";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import mime from "mime";

const PATH_UNCOMPRESS_IMAGE = "/tmp/original/";
const PATH_COMPRESS_IMAGE = "/tmp/compressed/";
var bucket_name = "";
var file_path = "";

const createFolders = async () => {
  if (!fs.existsSync(PATH_COMPRESS_IMAGE)) {
    fs.mkdirSync(PATH_COMPRESS_IMAGE, { recursive: true });
    console.log("createFolders:", "Folder CReated 1");
  }

  if (!fs.existsSync(PATH_UNCOMPRESS_IMAGE)) {
    fs.mkdirSync(PATH_UNCOMPRESS_IMAGE, { recursive: true });
    console.log("createFolders:", "Folder CReated 2");
  }
};

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
    await fs.writeFileSync(PATH_UNCOMPRESS_IMAGE + file_name, data);
    console.log("File has been saved.");
  } catch (error) {
    console.log("error saveImageToLocalFormS3Event:", error);
    console.error(error);
  }

  return PATH_UNCOMPRESS_IMAGE + file_name;
};
const saveCompressImageToS3 = async (bucket, upload_path, local_path) => {
  console.log("saveCompressImageToS3:", "Started");

  try {
    let s3 = new AWS.S3();
    console.log("saveCompressImageToS3:", "Started0");
    let file_content = fs.readFileSync(local_path);
    console.log("saveCompressImageToS3:", "Started1");
    let content_type = mime.getType(local_path);
    console.log("saveCompressImageToS3:", "Started2" + content_type);
    let obj = s3
      .upload({
        Bucket: bucket,
        Key: "compressed_images/" + path.basename(upload_path),
        Body: file_content,
        ContentType: content_type,
      })
      .promise();
    console.log("saveCompressImageToS3:", "Started3");
    console.log("Put Object:", obj);
    let status = fs.unlinkSync(local_path);
    console.log("File Delete Status:", status);
    return true;
  } catch (err) {
    console.log("error:", err);
    return false;
  }
};
const compressImageAtPath = async (image_path) => {
  try {
    console.log("compressImageAtPath:", "01");
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
        console.log("compressImageAtPath:", "02");

        if (completed === true) {
          //Doing something.
          console.log("compressImageAtPath:", "03");

          fs.unlinkSync(image_path);
          console.log("compressImageAtPath:", "03.1");

          saveCompressImageToS3(
            bucket_name,
            file_path,
            PATH_COMPRESS_IMAGE + path.basename(image_path)
          );
          console.log("compressImageAtPath:", "03.2");
          console.log("Status:", completed);
        } else {
          console.log("compressImageAtPath:", "04");

          console.log("Error:", err);
        }
      }
    );
  } catch (error) {
    console.log("compressImageAtPath:", "05");

    console.log("Catch Error:", error);
  }
  console.log("compressImageAtPath:", "06");
};

export const imagecompress = async (event) => {
  console.log("Event:", event);
  createFolders();

  //When running on lambda
  file_path = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  console.log("File Path From Bucket:", file_path);
  bucket_name = event.Records[0].s3.bucket.name;
  console.log("Bucket:", bucket_name);
  //When running on local
  // file_path = "images/test-file-1.jpg";
  // bucket_name = "tetris-testbucket-v1";

  let image_path = await saveImageToLocalFormS3Event(bucket_name, file_path);
  let compressImagePath = await compressImageAtPath(image_path);
};

export default imagecompress;
