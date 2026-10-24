# Adding questions to the quiz bank

**The one process for adding, topping up or fixing quiz questions.** Follow it
every time, so the lessons below are not learned again. The files in this
folder are loaded into the question bank (`models/QuizQuestion.js`) by
`npm run quiz:import`; the tests (`src/lib/quiz/bank.test.js`) fail on any
question that would not load.

## The process

1. **Look at what the category already has.**
   `npm run quiz:check -- <category>.json --all` lists its questions per band,
   how many are family, the difficulty spread and the pictures, and anything
   already too close. Read the file itself too, so new questions do not repeat
   its facts.
2. **Write the questions** into `data/quiz-bank/<category>.json`, to the rules
   below. For a new category, see *A new category* first.
3. **Fact-check them in a second pass**, by someone (or an agent) who did not
   write them. Check every answer, every wrong option and every explanation
   against a source. The first big batch had about 175 fixes in 1,050
   questions: a wrong option that could also be argued right, a popular "fact"
   that is a myth, a record that could change, a fact already asked in another
   category.
4. **Check for duplicates:** `npm run quiz:check -- <category>.json`. It
   compares the new questions with every seed file and the live bank, in every
   category, writer questions included (`lib/quiz/overlap.js`).
   - *Too close* (the same fact in other words, nearly the same wording, the
     same picture twice): rewrite or drop one. This fails the check.
   - *Same answer, worth a look*: decide. Two different facts with the same
     answer are fine (York as Jorvik and as Eboracum). The same fact, or one
     question that gives the other away, is not (Harry Styles's band asked
     twice).
5. **Fetch the pictures**: `npm run quiz:images -- <category>.json` (see
   *Question styles*). Then **look at every picture** and close-up before going
   on (*Checking a picture*). Run step 4 again: it now compares the uploaded
   pictures too.
6. **Load them**: `npm run quiz:import` is a dry run that says what it would
   add, update and retire. Read it, then `npm run quiz:import -- --apply`
   writes to the live database.
7. **Test and commit**: `npm test` (the seed files must all load), then commit
   the seed file. Say in the commit how many questions were added and what was
   learned; add a lasting lesson to *Lessons so far* below.

## A new category

1. Add it to `src/lib/quiz/catalogue.js`, in the right group of `GROUPS`:
   `{ id, name, emoji, brief }`. The `brief` is what the writer is told when the
   bank runs short in play, so it says what the category covers; a picture
   category says so ("picture round: name the country from its outline").
2. Create `data/quiz-bank/<id>.json` with 15 `kids` and 15 `adults` questions.
3. Follow the process above.

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
- `family`: true when the question suits a mixed family game: a Kids question an adult would still enjoy, or a Grown-ups question a 10-year-old has a fair chance at. Aim for about two thirds of Kids questions and about a third of Grown-ups questions. Family mix games draw only these, from both bands.
- `difficulty`: 1 easy, 2 medium, 3 hard, for the band. A spread, roughly a third each.
- `dated`: true if the answer could change over time (a current holder, record, champion or count). Prefer facts that do not change; a dated question leaves games a year after it was written.
- `media` (optional): see *Question styles*.

## The questions

- British English, a UK family audience. One sentence, short and clear; simple words for Kids.
- Exactly one right answer, a well-established fact you are certain of. If you are not sure, write a different question.
- Wrong answers are plausible and of the same kind as the right one (four countries, four years, four animals), so it cannot be solved by spotting the odd one out.
- Avoid: "which of these is NOT"; trick wording; anything gory, frightening or unkind; answers that need specialist spelling; two options that could both be argued right.
- Make them interesting: a surprising fact beats a dull one. Avoid the tired chestnuts (the Red Planet, a spider's legs, the capital of France) unless the question finds a fresh angle.
- No question twice, in this category or any other, and no two questions so close that one gives away the other. `npm run quiz:check` finds most; the rest is judgement.

## Question styles

Every style is the same JSON question; the style is its `media`.

**Plain**: no `media`. Most questions.

**Emoji clue**, now and then, for films, TV, cartoons, music, games and stories:
`"media": { "kind": "emoji", "text": "🦁👑🌅" }`. Two to six emoji a fan would recognise. The clue shows above the question, so the question is just "Which film do these emoji describe?" (or show, song, book, game) and holds no emoji itself. **Use them sparingly** (Ash, 2026-10-24: proper questions about the characters and stories first). At most one in ten new questions in a category, and none in a category that already has five or more (`npm run quiz:check -- <category>.json --all` counts them). The ones already in the bank stay. The live writer is told the same: at most one in a batch.

**Picture**, for flags, landmarks, places, animals, dinosaurs, planets, famous paintings, historical rulers, logos, country outlines, sports kit and sport stars. Written as a hint, which `npm run quiz:images` turns into a picture on Cloudinary (`GamePad/quiz/`, through `@aspiro/media`), writing `src` and `credit` back into the file:
- **a flag**: `"media": { "kind": "image", "flag": "jp", "alt": "A national flag" }` (ISO 3166 two-letter code, lower case; `gb-sct`, `gb-wls`, `gb-eng`, `gb-nir` for the UK nations). From flagcdn.com.
- **a photo**: `"media": { "kind": "image", "wiki": "Angkor_Wat", "alt": "A large stone temple" }`, the exact English Wikipedia article title, whose lead image is what is shown. Only use an article whose lead image clearly shows the answer by itself (check with `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&redirects=1&titles=<Title>` when unsure). A map, a logo, a diagram or a crowd scene will not do.
- **a logo, crest or circuit map**: one named file on Wikipedia or Commons, `"media": { "kind": "image", "file": "Apple logo black.svg", "alt": "A company logo" }`. Find the exact file name on the article (`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=images&titles=<Article>`). Symbol-only logos: nothing in it may spell out the answer.
- **a country's outline**: `"media": { "kind": "image", "outline": "it", "alt": "The outline of a country" }` (ISO two-letter code, lower case, from mapsicon, given a white margin so a coastline never runs into the edge of the card).
- **a close-up**: any picture above plus `"zoom": [x, y, size]`: the centre of a square crop as fractions of the picture's width and height, and its side as a fraction of the shorter side (0.3 to 0.45 works). The close-up is the question; the whole picture is uploaded too, as `reveal`, and shown with the answer (a phones game keeps it back until then). The question says so: "Which sport is this a close-up from?". Choose a detail a fan would know but that is not the whole giveaway (the numbers round a dartboard, not the bullseye with darts in it).
- **a logo with its name written in it**: any picture above plus `"hide": [[x, y, w, h], ...]`, rectangles (fractions of the picture's width and height) round the name, which is painted out; add `"hideGround": "#000000"` when the name sits on a dark shield. The logo is then trimmed and centred. The logo without its name is the question, and the whole logo is uploaded as `reveal`, shown with the answer. Leave each rectangle a little clear of the symbol, and look at the result: lettering on a glossy badge (Lamborghini) leaves a shadow, so use a close-up there instead.
- `alt` describes the picture without giving away the answer.
- The question asks about the picture: "Which country's flag is this?", "Which famous landmark is this?", "Which animal is this?", "Who painted this?".
- Copyright is no bar: GamePad is for Ash's family (Ash, 2026-10-22). Logos, crests and photos of famous people (sport stars for Sporting Legends) are all fine.
- About four or five in fifteen use a picture, except in a picture round (Logos, Country Shapes, Which Sport?), where every question does.

## Checking a picture

Look at every picture before it goes in, as the game shows it:
`transformUrl(src, IMAGE_PRESETS.hero)` from `@aspiro/media` (download it and
open it), and the `reveal` too for a close-up. A picture must not give the
answer away: no brand or club name written in a logo, no caption, no name on a
shirt, no credit that names the answer.

- `npm run quiz:images` skips a picture already on Cloudinary. To redo one
  (another photo, a new zoom), delete its `src` (and `reveal`) in the file and
  run it again; it replaces the old upload under the same name.
- A public-domain picture carries no credit: Commons names a painting's painter
  as its artist, and the credit would answer "Who painted this?".

## How many

Fifteen per band in every category to start: 15 `kids` and 15 `adults`. A category the family plays a lot is topped up ten at a time, in the band that is running low (2026-10-22: the first top-up, the eleven busiest band-categories). Family mix, the level played most, draws only `family: true` questions, so watch that pool: on 2026-10-24 eleven categories were down to 5 to 9 unseen family questions, and each got ten more, all family, five Kids and five Grown-ups. When a category runs short in play, the writer (Sonnet, `lib/quiz/writer.js`) writes more on the spot and keeps them (`source: writer`); they are not in these files, but `npm run quiz:check` compares against them, so a seed question does not repeat one.

## Fixing a question

- A question the thumbs sent to `review` (two "wrong answer" flags, or mostly
  thumbs down) is no longer served. Correct it in its file and import: it comes
  back to `active` with its flags cleared. Thumbs are still noisy (a child
  thumbed down every question on 2026-10-22), so check the question itself
  before changing it.
- **Change the wording only when you must.** A question's key is its wording
  plus its picture or emoji (`questionKey`), so new wording is a new question:
  the old one is retired, its stats are lost, and every player's memory of it
  goes with it, so they can be asked it again. Correcting an option, the answer,
  the explanation or a tag keeps the key, and the stats.
- To drop a question, delete it from the file: the import retires it.

## Lessons so far

- The same fact turns up in two categories more than anywhere else (Adele's
  album names in Music and Celebrities, Murray at Wimbledon, Mo Farah, Wonka,
  Bonfire Night). Check across categories, not just within one.
- A second fact-checking pass always finds things; never skip it.
- A picture is the same picture after a re-upload: the key uses its name, not
  Cloudinary's version number.
- Most current brand logos on Wikipedia have the name written in them. Use an
  icon-only file (search Commons for "<brand> icon") or paint the name out with
  `hide` (Puma, Red Bull, Peugeot, 2026-10-24: Ash wanted them kept, name
  scrubbed). The same picture must not be used twice across categories (the
  Ferrari horse is in Formula 1).
- A wrong option can turn out to be arguable: Rowling once said Hermione's middle
  name was Jane, and Porsche's crest has a black rearing horse too.
- Every new kind of picture so far needed a look before use (logos with the name
  in them, outlines touching the edge, a photo whose lead image was a map).
