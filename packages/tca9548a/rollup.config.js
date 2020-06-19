import typescript from "@rollup/plugin-typescript";
import { main as outputFile } from "./package.json";

export default {
  input: "src/index.ts",
  output: {
    file: outputFile,
    format: "umd",
    name: "TCA9548A",
    exports: "named",
  },
  plugins: [typescript()],
};
