import { mdToAST, astToHTML } from "./parser";

export const parse = (md: string) => {
  const ast = mdToAST(md);
  return astToHTML(ast);
};

const SAMPLE = `# Main Title

This is a simple paragraph with some *italic text*, some **bold text**, and a [link](https://example.com).

## Subheading

Another paragraph with **bold**, *italic*, and a [different link](https://openai.com).
`;

const EXPECTED_OUTPUT = `<h1># Main Title</h1><p>This is a simple paragraph with some <em>*italic text*</em>, some <strong>**bold text**</strong>, and a [link](https://example.com).</p><h2>## Subheading</h2><p>Another paragraph with <strong>**bold**</strong>, <em>*italic*</em>, and a [different link](https://openai.com).</p>`;
let output = parse(SAMPLE);
console.log(output);
console.log(output === EXPECTED_OUTPUT);
