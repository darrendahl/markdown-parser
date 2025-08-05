import { expect, test } from "bun:test";
import { MdParser } from "./parser";
import {
  BoldNode,
  CodeBlock,
  HeadingNode,
  HorizontalRule,
  ImageNode,
  InlineCode,
  ItalicNode,
  LinkNode,
  ListBlock,
  ListItemNode,
  ParagraphNode,
  TextNode,
} from "./md-node";

const SAMPLE = `# Main Title

This is a simple paragraph with some *italic text*, some **bold text**, and a [link](https://example.com).

## Subheading

Another paragraph with **bold**, *italic*, and a [different link](https://openai.com).
`;

test("Lexes Header Correctly", () => {
  const parser = new MdParser();
  const h1 = parser.lex("# Header")[0] as HeadingNode;
  expect(h1.level).toBe(1);
  expect(h1.raw).toBe("# Header");
  expect(h1.content).toBe("Header");
  const h2 = parser.lex("## Header")[0] as HeadingNode;
  expect(h2.level).toBe(2);
  expect(h2.raw).toBe("## Header");
  expect(h2.content).toBe("Header");
  const h3 = parser.lex("### Header")[0] as HeadingNode;
  expect(h3.level).toBe(3);
  expect(h3.raw).toBe("### Header");
  expect(h3.content).toBe("Header");
  const h4 = parser.lex("#### Header")[0] as HeadingNode;
  expect(h4.level).toBe(4);
  expect(h4.raw).toBe("#### Header");
  expect(h4.content).toBe("Header");
  const h5 = parser.lex("##### Header")[0] as HeadingNode;
  expect(h5.level).toBe(5);
  expect(h5.raw).toBe("##### Header");
  expect(h5.content).toBe("Header");
  const h6 = parser.lex("###### Header")[0] as HeadingNode;
  expect(h6.level).toBe(6);
  expect(h6.raw).toBe("###### Header");
  expect(h6.content).toBe("Header");
});

test("Lexes Paragraph Correctly", () => {
  const parser = new MdParser();
  const p = parser.lex("");
  expect(p).toEqual([]);

  const p1 = parser.lex("asdf");
  expect(p1).toEqual([
    new ParagraphNode("asdf", "asdf", [new TextNode("asdf")]),
  ]);
});

test("Lexes Bold Correctly", () => {
  const parser = new MdParser();
  const b = parser.lex("**asdf**");

  expect(b).toEqual([
    new ParagraphNode("**asdf**", "**asdf**", [
      new BoldNode("**asdf**", "asdf"),
    ]),
  ]);

  const b2 = parser.lex("**foo** **bar**") as BoldNode[];
  expect(b2).toEqual([
    new ParagraphNode("**foo** **bar**", "**foo** **bar**", [
      new BoldNode("**foo**", "foo"),
      new TextNode(" "),
      new BoldNode("**bar**", "bar"),
    ]),
  ]);

  const nonmatch = parser.lex("** asdf**");
  expect(nonmatch).toEqual([
    new ParagraphNode("** asdf**", "** asdf**", [new TextNode("** asdf**")]),
  ]);
});

test("Lexes Italic Correctly", () => {
  const parser = new MdParser();
  const i = parser.lex("*asdf*")[0] as ParagraphNode;
  expect(i.children[0].raw).toBe("*asdf*");
  expect(i.children[0].content).toBe("asdf");

  // spaces dont currently work with the regex
  //   const spaces = parser.lex("*asdf foo bar*")[0];
  //   expect(spaces.content).toBe('asdf foo bar');
});

test("Lexes Inline Code Correctly", () => {
  const parser = new MdParser();
  const i = parser.lex("`console.log`");
  expect(i).toEqual([
    new ParagraphNode("`console.log`", "`console.log`", [
      new InlineCode("`console.log`", "console.log"),
    ]),
  ]);
});

test("Lexes horizontal rule correctly", () => {
  const parser = new MdParser();
  const hr = parser.lex("---")[0] as HorizontalRule;
  expect(hr.raw).toBe("---");
  expect(hr.content).toBe("---");

  const nonmatch = parser.lex("--- asdf")[0];
  const isP = nonmatch instanceof ParagraphNode;
  expect(isP).toBe(true);
});

test("Lexes Link Correctly", () => {
  const parser = new MdParser();
  let t = "[google](https://google.com)";
  const l = parser.lex(t);

  expect(l).toEqual([
    new ParagraphNode(
      "[google](https://google.com)",
      "[google](https://google.com)",
      [
        new LinkNode(
          "[google](https://google.com)",
          "google",
          "google",
          "https://google.com"
        ),
      ]
    ),
  ]);
});

test("Lexes image correctly", () => {
  const parser = new MdParser();
  let t = "![meh](https://google.com/img.png)";
  const l = parser.lex(t);
  expect(l).toEqual([
    new ParagraphNode(
      "![meh](https://google.com/img.png)",
      "![meh](https://google.com/img.png)",
      [
        new ImageNode(
          "![meh](https://google.com/img.png)",
          "meh",
          "meh",
          "https://google.com/img.png"
        ),
      ]
    ),
  ]);
});

test("Lexes Paragraph Correctly", () => {
  const parser = new MdParser();
  let t = "lkjasldk jfaj dkfja lksdf jaldsjf";
  const p = parser.lex(t)[0] as ParagraphNode;
  expect(p.raw).toBe(t);
  expect(p.content).toBe(t);
});

test("Parsing inline tokens works", () => {
  const parser = new MdParser();
  const tokens = parser.parseInlineTokens("text **bold**");
  expect(tokens).toEqual([
    new TextNode("text ", "text "),
    new BoldNode("**bold**", "bold"),
  ]);

  const tokens2 = parser.parseInlineTokens("**bold** text");
  expect(tokens2).toEqual([
    new BoldNode("**bold**", "bold"),
    new TextNode(" text", " text"),
  ]);

  const tokens3 = parser.parseInlineTokens("**bold** text **bold**");
  expect(tokens3).toEqual([
    new BoldNode("**bold**", "bold"),
    new TextNode(" text ", " text "),
    new BoldNode("**bold**", "bold"),
  ]);

  const tokens4 = parser.parseInlineTokens(
    "asdf  **bold text** text adsf alksd **jf**"
  );
  expect(tokens4).toEqual([
    new TextNode("asdf  ", "asdf  "),
    new BoldNode("**bold text**", "bold text"),
    new TextNode(" text adsf alksd ", " text adsf alksd "),
    new BoldNode("**jf**", "jf"),
  ]);

  const tokens5 = parser.parseInlineTokens("asdf *italic text*");
  expect(tokens5).toEqual([
    new TextNode("asdf ", "asdf "),
    new ItalicNode("*italic text*", "italic text"),
  ]);

  const tokens6 = parser.parseInlineTokens(
    "asdf *italic text* asdf **bold** asdf"
  );
  expect(tokens6).toEqual([
    new TextNode("asdf ", "asdf "),
    new ItalicNode("*italic text*", "italic text"),
    new TextNode(" asdf ", " asdf "),
    new BoldNode("**bold**", "bold"),
    new TextNode(" asdf", " asdf"),
  ]);

  const tokens7 = parser.parseInlineTokens("asdf `code` asdf **bold** asdf");
  expect(tokens7).toEqual([
    new TextNode("asdf ", "asdf "),
    new InlineCode("`code`", "code"),
    new TextNode(" asdf ", " asdf "),
    new BoldNode("**bold**", "bold"),
    new TextNode(" asdf", " asdf"),
  ]);

  // currently broken
  // const tokens5 = parser.parseInlineTokens(
  //   "asdf **asdf **asdf**"
  // )
  // expect(tokens5).toEqual([
  //   new TextNode("asdf **asdf ", "asdf **asdf "),
  //   new BoldNode("**asdf**", "asdf"),
  // ]);
});

test("Structure of AST is correctly nested with simple example", () => {
  const parser = new MdParser();
  const md = `# This is the heading

    This is paragraph text

    This is **bold** text`;

  const ast = parser.lex(md);
  expect(ast).toEqual([
    new HeadingNode("# This is the heading", 1, "This is the heading", [
      new TextNode("This is the heading"),
    ]),
    new ParagraphNode("This is paragraph text", "This is paragraph text", [
      new TextNode("This is paragraph text"),
    ]),
    new ParagraphNode("This is **bold** text", "This is **bold** text", [
      new TextNode("This is "),
      new BoldNode("**bold**", "bold"),
      new TextNode(" text"),
    ]),
  ]);
});

test("Lexes code blocks properly", () => {
  const parser = new MdParser();
  const md = `\`\`\`
  console.log("hi")
  console.log("mom")
  \`\`\``;
  const ast = parser.lex(md);
  expect(ast).toEqual([new CodeBlock(md, md)]);
});

test("Lexes list items properly", () => {
  const parser = new MdParser();

  const md = `- asdf
- asdf`;

  const ast = parser.lex(md);

  expect(ast).toEqual([
    new ListBlock(md, md, [
      new ListItemNode("- asdf", "asdf", [new TextNode("asdf", "asdf")]),
      new ListItemNode("- asdf", "asdf", [new TextNode("asdf", "asdf")]),
    ]),
  ]);

  const md2 = `- asdf
- asdf **block**
testing 123
**block**`;

  const ul = `- asdf
- asdf **block**`;

  const ast2 = parser.lex(md2);
  expect(ast2).toEqual([
    new ListBlock(ul, ul, [
      new ListItemNode("- asdf", "asdf", [new TextNode("asdf", "asdf")]),
      new ListItemNode("- asdf **block**", "asdf **block**", [
        new TextNode("asdf ", "asdf "),
        new BoldNode("**block**", "block"),
      ]),
    ]),
    new ParagraphNode("testing 123", "testing 123", [
      new TextNode("testing 123"),
    ]),
    new ParagraphNode("**block**", "**block**", [
      new BoldNode("**block**", "block"),
    ]),
  ]);
});

test("Lexes indentation properly with list items", () => {
  const md = `- foo
  - bar
- foo
  - bar`;

  const parser = new MdParser();
  const ast = parser.lex(md);

  expect(ast).toEqual([
    new ListBlock(
      `- foo
        -bar`,
      `- foo
        -bar`,
      [
        new ListItemNode("- foo", "foo", [new TextNode("foo", "foo")]),
        new ListBlock("- bar", "- bar", [
          new ListItemNode("- bar", "bar", [new TextNode("- bar")]),
        ]),
        new ListItemNode("- foo", "foo", [
          new TextNode("foo", "foo"),
          new ListBlock("- bar", "- bar", [
            new ListItemNode("- bar", "bar", [new TextNode("bar")]),
          ]),
        ]),
      ]
    ),
  ]);
});
