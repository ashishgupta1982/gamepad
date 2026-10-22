# Writing seed questions for the quiz bank

How every file in this folder is written. The files are loaded into the
question bank (`models/QuizQuestion.js`) by `npm run quiz:import`, and the
tests (`src/lib/quiz/bank.test.js`) fail on any question that would not load.

## The file

One file per category, named for its id: `data/quiz-bank/<category>.json`.

```json
{
  "category": "dinosaurs",
  "questions": [
    {
      "band": "kids",
      "question": "Which dinosaur had three horns on its face?",
      "options": ["Triceratops", "Stegosaurus", "Diplodocus", "Velociraptor"],
      "answer": "Triceratops",
      "explanation": "Its name means three-horned face.",
      "family": true,
      "difficulty": 1,
      "dated": false
    }
  ]
}
```

- `band`: `kids` (ages 8 to 13) or `adults` (teens and adults, pub-quiz standard).
- `options`: exactly four, all different. `answer` is one of them, written exactly the same.
- `explanation`: one short, fun sentence a quizmaster could read out after the answer. Every claim in it must be true.
- `family`: true when the question suits a mixed family game: a Kids question an adult would still enjoy, or a Grown-ups question a 10-year-old has a fair chance at. Aim for about two thirds of Kids questions and about a third of Grown-ups questions.
- `difficulty`: 1 easy, 2 medium, 3 hard, for the band. A spread, roughly a third each.
- `dated`: true if the answer could change over time (a current holder, record, champion or count). Prefer facts that do not change.
- `media` (optional): see below.

## The questions

- British English, a UK family audience. One sentence, short and clear; simple words for Kids.
- Exactly one right answer, a well-established fact you are certain of. If you are not sure, write a different question.
- Wrong answers are plausible and of the same kind as the right one (four countries, four years, four animals), so it cannot be solved by spotting the odd one out.
- Avoid: "which of these is NOT"; trick wording; anything gory, frightening or unkind; answers that need specialist spelling; two options that could both be argued right.
- Make them interesting: a surprising fact beats a dull one. Avoid the tired chestnuts (the Red Planet, a spider's legs, the capital of France) unless the question finds a fresh angle.
- No question twice, and no two questions so close that one gives away the other.

## Pictures and emoji clues

**Emoji clue**, for films, TV, cartoons, music, games and stories:
`"media": { "kind": "emoji", "text": "🦁👑🌅" }`. Two to six emoji a fan would recognise. The clue shows above the question, so the question is just "Which film do these emoji describe?" (or show, song, book, game) and holds no emoji itself.

**Picture**, for flags, landmarks, places, animals, dinosaurs, planets, famous paintings, historical rulers, logos, country outlines, sports kit and sport stars. Written as a hint; `npm run quiz:images` fetches it:
- a flag: `"media": { "kind": "image", "flag": "jp", "alt": "A national flag" }` (ISO 3166 two-letter code, lower case; `gb-sct`, `gb-wls`, `gb-eng`, `gb-nir` for the UK nations)
- anything else: `"media": { "kind": "image", "wiki": "Angkor_Wat", "alt": "A large stone temple" }`, the exact English Wikipedia article title, whose lead image is what is shown. Only use an article whose lead image clearly shows the answer by itself (check with `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&redirects=1&titles=<Title>` when unsure). A map, a logo, a diagram or a crowd scene will not do.
- one named file on Wikipedia or Commons, for a logo, a club crest or a circuit map: `"media": { "kind": "image", "file": "Apple logo black.svg", "alt": "A company logo" }`. Find the exact file name on the article (`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=images&titles=<Article>`).
- a country's outline: `"media": { "kind": "image", "outline": "it", "alt": "The outline of a country" }` (ISO two-letter code, lower case, from mapsicon).
- `alt` describes the picture without giving away the answer.
- **Look at every picture before using it** (a preview tool makes it exactly as the game will show it). A picture must not give the answer away: no brand or club name written in a logo, no caption, no name on a shirt.
- Copyright is no bar: GamePad is for Ash's family (Ash, 2026-10-22). Logos, crests and photos of famous people (sport stars for Sporting Legends) are all fine.
- The question asks about the picture: "Which country's flag is this?", "Which famous landmark is this?", "Which animal is this?", "Who painted this?".

## How many

Fifteen per band in every category to start: 15 `kids` and 15 `adults`. A category the family plays a lot is topped up ten at a time, in the band that is running low (2026-10-22: the first top-up). In picture or emoji categories, about four or five of each fifteen use one.
