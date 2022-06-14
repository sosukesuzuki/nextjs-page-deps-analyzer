# nextjs-page-deps-analyzer

## CLI

```console
nextjs-page-deps-analyzer ./src/pages
```

## Usage

```js
import { analyzePages } from "nextjs-page-deps-analyzer";
import path from "node:path";

const pagesDirPath = path.join(process.cwd(), "src", "pages");

const result = await analyzePages(pagesDirPath);

console.log(JSON.stringify(result, null, 2));
```

```json
[
  {
    "name": "index.tsx",
    "graph": {
      "module": {
        "filePath": "pages/index.tsx",
        "dependencies": [
          {
            "filePath": "components/Foo.tsx",
            "dependencies": []
          }
        ]
      }
    }
  }
]
```
