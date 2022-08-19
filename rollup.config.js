import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";

const name = require("./package.json").name.replace(/\.js$/, "");

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [esbuild({
      minify: true,
      target: "esnext",
      format: "esm",
      platform: "neutral"
    })],
    output: [
      {
        file: `./dist/${name}.js`,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: `./dist/${name}.mjs`,
        format: "es",
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `dist/${name}.d.ts`,
      format: "es",
    },
  }),
];
