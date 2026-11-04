# University Digital Library Search System

A small full-stack prototype with a modular C backend, native Node.js HTTP bridge, and HTML/CSS/JavaScript interface. C owns document CRUD, search matching and sorting. The interface only calls the API and renders results.

## Run in Replit
1. Import/upload this project folder or ZIP into a Replit workspace.
2. Ensure the workspace has GCC and Node.js.
3. Run `npm start` (the server compiles the C backend automatically).
4. Open the Replit web preview. The server listens on `PORT` or 3000.

## Local run
Install GCC and Node.js, then run `npm start` from the project root.

## Features
- Document create, read, update and delete.
- Search title, author, category and actual text file content.
- Multi-term Boolean AND and OR.
- Sort by title, author or year (ascending/descending).
- Metadata persisted in `data/library.tsv`; content stored in `data/documents/*.txt`.

## Important implementation note
This educational prototype uses a linked list and scans each document's text during search. It does not yet implement an inverted index, binary search or hash-based lookup. Those algorithms should be added and benchmarked for the assignment requirements before final submission. Metadata TSV fields should not contain tabs or newlines.
