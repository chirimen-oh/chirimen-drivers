import { module as input, main as outputFile } from "./package.json";

export default {
  input,
  output: {
    file: outputFile,
    format: "umd",
    name: "grove-water-level-sensor"
  }
};
