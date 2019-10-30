import { module as input, main as outputFile } from "./package.json";

export default {
  input,
  output: {
    file: outputFile,
    format: "umd",
    name: "PCA9685_PWM"
  }
};