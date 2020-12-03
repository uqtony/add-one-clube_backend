import { Request, Response } from "express";
import { Rout } from "type/Rout";
import BaseController from "./BaseController";
import multer from "multer";
import fs from "fs";
function getExtension(fileName: string) {
  return fileName.substr(fileName.lastIndexOf(".") + 1);
}
function getFilenameWithoutExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf("."));
}
const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dirPath = `${__dirname}/../public/images`;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    cb(null, dirPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      getFilenameWithoutExtension(file.originalname) +
        "-" +
        Date.now() +
        `.${getExtension(file.originalname)}`
    );
  },
});
const storageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    const dirPath = `${__dirname}/../public/videos`;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    cb(null, dirPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      getFilenameWithoutExtension(file.originalname) +
        "-" +
        Date.now() +
        `.${getExtension(file.originalname)}`
    );
  },
});
const uploadImage = multer({ storage: storageImage });
const uploadVideo = multer({ storage: storageVideo });

class UploadController extends BaseController {
  public path = "/api/upload";
  initRoutes(): Rout[] {
    return [
      {
        action: "/image",
        method: "post",
        middleware: [uploadImage.single("image")],
        runner: this.uploadImage,
      },
      {
        action: "/video",
        method: "post",
        middleware: [uploadVideo.single("video")],
        runner: this.uploadVideo,
      },
    ];
  }
  private async uploadImage(req: Request, res: Response) {
    res.json({ filename: req.file.filename });
  }
  private async uploadVideo(req: Request, res: Response) {
    res.json({ filename: req.file.filename });
  }
}
export default UploadController;
