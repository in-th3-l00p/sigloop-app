# Examples

This folder contains runnable SDK integration examples:

- `card-sdk-usage`: direct `@sigloop/card` usage
- `api-sdk-usage`: direct `@sigloop/api` usage
- `langchain.js`: LangChain.js tool-calling agent wired to both SDKs

## Quick start

Each example is an isolated Node project.

```bash
cd examples/card-sdk-usage && npm install && npm start
cd examples/api-sdk-usage && npm install && npm start
cd examples/langchain.js && npm install && npm start -- "Summarize my card and account state"
```
