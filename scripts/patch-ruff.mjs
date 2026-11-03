import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = 'node_modules/@wasm-fmt/ruff_fmt/ruff_fmt_esm.js';
if (!existsSync(file)) process.exit(0);

const src = readFileSync(file, 'utf8');
const patched = src.replace(/^import source wasmModule from "\.\/ruff_fmt_bg\.wasm";/m, 'import wasmModule from "./ruff_fmt_bg.wasm";');
if (patched !== src) writeFileSync(file, patched);
