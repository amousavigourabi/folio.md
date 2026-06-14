import config from "../folio.config";
import { lintVale } from "./lintVale";

lintVale(config.vale, config.contentDir);
