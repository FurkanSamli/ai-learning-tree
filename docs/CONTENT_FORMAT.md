# Content format

Each branch is a separate `.txt` file under `content/`. The load order lives in
`content/index.json`.

## Branch header

```
## g1 | math | Mathematical Foundations | Mathematics
> Short description
? Simple explanation
```

Fields in order: group (`g1`–`g5`), branch id, full name, short name (shown on the label
in the tree).

Groups: `g1` Foundations · `g2` Core methods · `g3` Specializations ·
`g4` Engineering & Deployment · `g5` Responsibility & Career.

## Topics

```
- [1] Linear Algebra
  > The language of data and models
  ? An image or a sentence is stored as lists of numbers...
  - [2] Eigenvalues & eigenvectors
    ? ...
```

- `- ` starts a topic. An indent of **2 spaces** = one level deeper.
- `[1]` basic, `[2]` intermediate, `[3]` advanced. Optional, but first-level topics should have one.
- `>` short description (optional), `?` simple explanation (required; opened with a button
  in the panel). These lines go under their topic, indented 2 more spaces.
- ` | ` is only used in branch headers. Content is English-only; `npm run check` rejects
  Turkish characters.
- Run `npm run check` after editing any file.

## A warning about ids

A topic's id is derived from its title (and its parents' titles). Renaming a title or
moving a topic disconnects the saved progress and note for that topic.
