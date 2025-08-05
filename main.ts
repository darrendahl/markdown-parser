import { SAMPLE } from "./sample";
import { MdParser } from "./parser";

export const main = (md: string) => {
  const parser = new MdParser();
  return parser.lex(md);
};

// const EXPECTED_OUTPUT = `<h1># Main Title</h1><p>This is a simple paragraph with some <em>*italic text*</em>, some <strong>**bold text**</strong>, and a [link](https://example.com).</p><h2>## Subheading</h2><p>Another paragraph with <strong>**bold**</strong>, <em>*italic*</em>, and a [different link](https://openai.com).</p>`;
let output = main(SAMPLE);
console.log(output);

// console.log(output);
// console.log(output === EXPECTED_OUTPUT);
