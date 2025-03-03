import { generatePDF } from "../../../utils/pdfGenerator";
import { ensureDirectoryExists } from "../../../utils/utils";
import fs from "fs";
import path from "path";
import os from "os";

function getRecordsPath() {
  if (process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "userData", "records");
  } else {
    return path.join(process.cwd(), "userData", "records");
  }
}

export default async function handler(req, res) {
  try {
    const data = req.body;

    const recordsPath = getRecordsPath();
    ensureDirectoryExists(recordsPath);

    const { filePath, filename } = await generatePDF(data, recordsPath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Archivo no encontrado");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("close", () => {
      fs.unlinkSync(filePath);
    });

    fileStream.on("error", (err) => {
      console.error("Error al leer el archivo:", err);
      res.status(500).send("Error al procesar el archivo");
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error al procesar la solicitud");
  }
}