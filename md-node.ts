export enum NODE_TYPE {
  INLINE = "inline",
  BLOCK = "block",
}

export abstract class MdNode {
  static regex: RegExp;
  raw: string;
  content: string;
  children: MdNode[];
  static type: NODE_TYPE;

  constructor(raw: string, content?: string, children?: MdNode[]) {
    this.raw = raw;
    this.content = content || raw;
    this.children = children || [];
  }

  static fromString(line: string): MdNode | null {
    const match = line.match((this as any).regex);
    if (!match) return null;
    return new (this as any)(match[0], match[1]);
  }

  // TODO render to HTML
  // abstract render(): string
}

export class ParagraphNode extends MdNode {}

export class ItalicNode extends MdNode {
  // this is also italic (?<!_)_(?!_)(\S(?:.*?\S)?)_(?!_)/
  // but to make inline parsing simpler we're just gonna do this
  static regex = /(?<!\*)\*(?!\*)(\S(?:.*?\S)?)\*(?!\*)/;
  static type = NODE_TYPE.INLINE;
}

export class BoldNode extends MdNode {
  static regex = /\*\*(?!\s)([^\s](?:.*?[^\s])?)\*\*/;
  static type = NODE_TYPE.INLINE;
}

export class InlineCode extends MdNode {
  static regex =  /`([^`\n]+?)`/;
  static type = NODE_TYPE.INLINE;
}

export class HorizontalRule extends MdNode {
  static regex = /(^\-\-\-$)/;
  static type = NODE_TYPE.INLINE;
}

export class TextNode extends MdNode {
  static regex = /(.+)/;
  static type = NODE_TYPE.INLINE;
}

export class HeadingNode extends MdNode {
  static regex: RegExp = /^(#{1,6})\s+(.+)/;
  public level: number;
  static type = NODE_TYPE.INLINE;

  constructor(
    raw: string,
    level: number,
    content: string,
    children?: MdNode[]
  ) {
    super(raw, content, children);
    this.level = level;
  }

  static override fromString(line: string): HeadingNode | null {
    const match = line.match(this.regex);
    if (!match) {
      return null;
    }
    const [raw, symbols, content] = match;
    return new HeadingNode(raw, symbols.length, content);
  }
}

export class LinkNode extends MdNode {
  static regex = /\[(.+)\]\((.+)\)/;
  linkUrl: string;
  linkText: string;
  static type = NODE_TYPE.INLINE;

  constructor(raw: string, content: string, linkText: string, linkUrl: string) {
    super(raw, content);
    this.linkText = linkText;
    this.linkUrl = linkUrl;
  }

  static override fromString(line: string): LinkNode | null {
    const match = line.match(this.regex);
    if (!match) {
      return null;
    }
    const [raw, linkText, linkUrl] = match;
    return new LinkNode(raw, raw, linkText, linkUrl);
  }
}

export class ImageNode extends MdNode {
  static regex = /\!\[(.+)\]\((.+)\)/;
  static type: NODE_TYPE = NODE_TYPE.INLINE;

  imageUrl: string;
  imageText: string;

  constructor(
    raw: string,
    content: string,
    imageText: string,
    imageUrl: string
  ) {
    super(raw, content);
    this.imageText = imageText;
    this.imageUrl = imageUrl;
  }

  static override fromString(line: string): ImageNode | null {
    const match = line.match(this.regex);
    if (!match) {
      return null;
    }
    const [raw, imageText, imageUrl] = match;
    return new ImageNode(raw, raw, imageText, imageUrl);
  }
}

export class CodeBlock extends MdNode {
  static regex = /\`\`\`/;
  static type: NODE_TYPE = NODE_TYPE.BLOCK;

  static override fromString(line: string): CodeBlock | null {
    const match = line.match(this.regex);
    if (!match) {
      return null;
    }
    const [raw] = match;
    return new CodeBlock(raw, raw);
  }
}

export class ListBlock extends MdNode {
  static regex = /^ *[-*+] +(.*)$/
  static type: NODE_TYPE = NODE_TYPE.BLOCK;

  static override fromString(line: string): ListBlock | null {
    const match = line.match(this.regex);
    if (!match) {
      return null;
    }
    const [raw] = match;
    return new ListBlock(raw, raw);
  }
}

export class ListItemNode extends MdNode {
  static regex = /^ *[-*+] +(.*)$/
  static type: NODE_TYPE = NODE_TYPE.BLOCK

  static override fromString(line: string): ListItemNode | null {
    const match = line.match(this.regex);
    if (!match) {
      return null;
    }
    const [raw] = match;
    return new ListItemNode(raw, raw);
  }
}