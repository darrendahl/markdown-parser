type ASTNode = {
  type: string;
  text: string;
  level?: number;
  tokens?: ASTNode[];
};

const astToHTML = (node: ASTNode): string => {
  if (node.type !== "root" && node.text.trim() === "") {
    return "";
  }

  switch (node.type) {
    case "root":
      return (node.tokens || []).map(astToHTML).join("");
    case "paragraph":
      return `<p>${(node.tokens || []).map(astToHTML).join("")}</p>`;
    case "bold":
      return `<strong>${node.text}</strong>`;
    case "text":
      return node.text;
    // TODO: li ul ol
    // case "list_item":
    //     return <li>${node.text}</li>;
    case "heading":
      return `<h${node.level}>${node.text}</h${node.level}>`;
    case "emphasis":
      return `<em>${node.text}</em>`;
    default:
      return "";
  }
};

const getInlineTokens = (line: string): ASTNode[] => {
  const tokens: ASTNode[] = [];

  // function | **bold** or __bold__ | _emphasis_ or *emphasis*
  const regex =
    /<% function\s+([a-zA-Z0-9_-]+)\s*%>|(?:\*\*|__)(.+?)(?:\*\*|__)|(?:\*|_)(.+?)(?:\*|_)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const [fullMatch, fnName, boldText, emphasisText] = match;
    // Add any text before this match
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        text: line.slice(lastIndex, match.index),
      });
    }

    if (fnName) {
      tokens.push({
        type: "function_tag",
        text: fnName,
      });
    } else if (boldText) {
      tokens.push({ type: "bold", text: fullMatch });
    } else if (emphasisText) {
      tokens.push({ type: "emphasis", text: fullMatch });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "text", text: line.slice(lastIndex) });
  }

  return tokens;
};

const mdToAST = (md: string): ASTNode => {
  const lines = md.split("\n");
  const root: ASTNode = {
    type: "root",
    text: "",
    tokens: [],
  };

  const tokens = root.tokens as ASTNode[];

  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    if (cur.trim() === "") {
      i++;
      continue;
    }

    // headings
    const headingMatch = cur.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      tokens.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[0],
      });
      i++;
      continue;
    }
    tokens.push({
      type: "paragraph",
      text: cur,
      tokens: getInlineTokens(cur),
    });
    i++;
  }
  return root;
};


export {
    mdToAST,
    astToHTML
}