# markdown-parser

- Simple markdown parser that adds the html tags needed to render the formatting but keeps original symbols.

- This way the user can add/remove markdown formatting without the need of a toolbar or unintuitive UX, as well as the user seeing what markdown symbols are causing the formatting.

```bash

bun run main.ts
# output
# <h1># Main Title</h1><p>This is a simple paragraph with some <em>*italic text*</ em>, some <strong>**bold text**</strong>, and a [link](https://example.com).</p><h2>## Subheading</h2><p>Another paragraph with <strong>**bold**</strong>, <em>*italic*</em>, and a [different link](https://openai.com).</p>
```

Inspiration: [stackedit](https://stackedit.io/app#)