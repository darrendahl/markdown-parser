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
  MdNode,
  NODE_TYPE,
  ParagraphNode,
  TextNode,
} from "./md-node";

interface MarkdownParser {
  lex(md: string): MdNode[];
  parse(md: string): string;
}

const BLOCK_NODES = [
  HeadingNode,
  HorizontalRule,
  CodeBlock,
  ListBlock,
  ListItemNode,
];

const NODE_TYPES_REGISTRY = [
  HeadingNode,
  InlineCode,
  BoldNode,
  ItalicNode,
  ImageNode,
  LinkNode,
  HorizontalRule,
  CodeBlock,
  // ParagraphNode is the default node that doesnt have a regex matcher
  // ParagraphNode,
];

export class MdParser implements MarkdownParser {
  constructor() {}
  parse(md: string): string {
    throw new Error("Method not implemented.");
  }

  parseInlineTokens(str: string) {
    let inlineNodes: (typeof BoldNode | typeof LinkNode | typeof ImageNode)[] =
      [BoldNode, ItalicNode, InlineCode, LinkNode, ImageNode];
    const tokens = [];
    let inlineRegex = new RegExp(
      `${inlineNodes.map((n) => `${n.regex.source}`).join("|")}`,
      "g"
    );

    let match: RegExpMatchArray;
    while ((match = inlineRegex.exec(str)) !== null) {
      inlineRegex.lastIndex = 0;
      let fullMatch = match[0];
      let start = match.index;

      // start by adding the text
      if (start > 0) {
        const text = str.slice(0, start);
        tokens.push(new TextNode(text, text));
        str = str.slice(start, str.length);
        start = 0;
      }

      // then add match if found
      let i = 0;
      let content = "";
      let url = "";

      for (let m of match.slice(1)) {
        if (m) {
          content = m;

          // ridiculous lines of code that will break
          // basically we assume that inlineNodes and match array perfectly
          // match indexes when thats not the case with LinkNode and ImageNode
          if (inlineNodes[i] === LinkNode) {
            let j = i + 1;
            url = match.slice(1)[j];
          }

          if (inlineNodes[i - 1] === ImageNode) {
            let j = i + 1;
            url = match.slice(1)[j];
            i--;
          }
          break;
        }
        i++;
      }
      if (
        url !== "" &&
        (inlineNodes[i] === ImageNode || inlineNodes[i] === LinkNode)
      ) {
        tokens.push(new inlineNodes[i](fullMatch, content, content, url));
      } else {
        tokens.push(new inlineNodes[i](fullMatch, content));
      }
      str = str.slice(fullMatch.length, str.length);
    }

    // add text if no more match found
    if (str) {
      tokens.push(new TextNode(str, str));
    }

    return tokens;
  }

  lex(md: string, indentation: number = 0): MdNode[] {
    const lines = md.split("\n");
    const tokens: MdNode[] = [];

    let i = 0;
    while (i < lines.length) {
      let line = lines[i];
      if (line.trim() === "") {
        i++;
        continue;
      }

      let node: MdNode;
      for (const NodeType of BLOCK_NODES) {
        node = NodeType.fromString(line);

        // how we are going to parse the inline tokens will probably differ
        // depending on the block node type
        if (node instanceof CodeBlock) {
          let lns = [node.raw];
          let match: RegExpExecArray;
          i++;
          while (CodeBlock.regex.exec(lines[i]) === null) {
            lns.push(lines[i]);
            i++;
          }
          lns.push(lines[i]);
          node.raw = lns.join("\n");
          node.content = lns.join("\n");
          tokens.push(node);

          break;
        } else if (node instanceof ListBlock) {
          let lns = [];
          let match: RegExpExecArray;

          // indentation level matters here for listblock
          while ((match = ListBlock.regex.exec(lines[i]?.trim())) !== null) {
            let indentationLevel = lines[i].match(/^\s+/g)?.[0]?.length || 0;
            if(indentationLevel > indentation){
              let curIndentation = indentationLevel
              let j = i
              while(curIndentation > indentation && j < lines.length){
                curIndentation = lines[j].match(/^\s+/g)?.[0]?.length || 0;
                j++
              }
              const childTokens = this.lex(lines.slice(i, j - 1).join("\n"), indentationLevel)
              node.children = childTokens;
              i = j
              break
            }
            lns.push([lines[i], match[1]]);
            i++;
          }

          lns.forEach(l => {
            node.children.push(new ListItemNode(l[0], l[1], this.parseInlineTokens(l[1])))
          })

          node.raw = lns.map((l) => l[0]).join("\n");
          node.content = lns.map((l) => l[0]).join("\n");
          tokens.push(node);
          // we went out of bounds to find last one but need to dec because we inc at end
          // also kinda ridiculous code
          i--;
          break;
        } else if (node) {
          node.children = this.parseInlineTokens(node.content);
          tokens.push(node);
          break;
        }
      }

      if (!node) {
        node = new ParagraphNode(line.trim(), line.trim());
        node.children = this.parseInlineTokens(node.content);
        tokens.push(node);
      }
      i++;
    }

    return tokens;
  }
}

// const astToHTML = (node: ASTNode): string => {
//   if (node.type !== "root" && node.text.trim() === "") {
//     return "";
//   }

//   switch (node.type) {
//     case "root":
//       return (node.tokens || []).map(astToHTML).join("");
//     case "paragraph":
//       return `<p>${(node.tokens || []).map(astToHTML).join("")}</p>`;
//     case "bold":
//       return `<strong>${node.text}</strong>`;
//     case "text":
//       return node.text;
//     // TODO: li ul ol
//     // case "list_item":
//     //     return <li>${node.text}</li>;
//     case "heading":
//       return `<h${node.level}>${node.text}</h${node.level}>`;
//     case "emphasis":
//       return `<em>${node.text}</em>`;
//     default:
//       return "";
//   }
// };

// const getInlineTokens = (line: string): ASTNode[] => {
//   const tokens: ASTNode[] = [];

//   // function | **bold** or __bold__ | _emphasis_ or *emphasis*
//   const regex =
//     /<% function\s+([a-zA-Z0-9_-]+)\s*%>|(?:\*\*|__)(.+?)(?:\*\*|__)|(?:\*|_)(.+?)(?:\*|_)/g;

//   let lastIndex = 0;
//   let match: RegExpExecArray | null;

//   while ((match = regex.exec(line)) !== null) {
//     const [fullMatch, fnName, boldText, emphasisText] = match;
//     // Add any text before this match
//     if (match.index > lastIndex) {
//       tokens.push({
//         type: "text",
//         text: line.slice(lastIndex, match.index),
//       });
//     }

//     if (fnName) {
//       tokens.push({
//         type: "function_tag",
//         text: fnName,
//       });
//     } else if (boldText) {
//       tokens.push({ type: "bold", text: fullMatch });
//     } else if (emphasisText) {
//       tokens.push({ type: "emphasis", text: fullMatch });
//     }

//     lastIndex = regex.lastIndex;
//   }

//   if (lastIndex < line.length) {
//     tokens.push({ type: "text", text: line.slice(lastIndex) });
//   }

//   return tokens;
// };

// const mdToAST = (md: string): ASTNode => {
//   const lines = md.split("\n");
//   const root: ASTNode = {
//     type: "root",
//     text: "",
//     tokens: [],
//   };

//   const tokens = root.tokens as ASTNode[];

//   let i = 0;
//   while (i < lines.length) {
//     const cur = lines[i];
//     if (cur.trim() === "") {
//       i++;
//       continue;
//     }

//     // headings
//     const headingMatch = cur.match(/^(#{1,6})\s+(.*)/);
//     if (headingMatch) {
//       tokens.push({
//         type: "heading",
//         level: headingMatch[1].length,
//         text: headingMatch[0],
//       });
//       i++;
//       continue;
//     }
//     tokens.push({
//       type: "paragraph",
//       text: cur,
//       tokens: getInlineTokens(cur),
//     });
//     i++;
//   }
//   return root;
// };

// export { mdToAST, astToHTML };
