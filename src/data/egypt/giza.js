// The Pyramids of Giza, as an Egypt Explorer trip.
//
// The same rules as the GEM trip (gem.js): everything on a card was checked
// against published sources before it went in (Wikipedia's articles on each
// pyramid, the Sphinx and the Tomb of Hetepheres I, and the reporting on the
// ScanPyramids finds), disputed figures say "about", and nothing here is
// written by the AI at play time. Where experts disagree (whose face the
// Sphinx has, how the ramps worked) the card says so rather than picking one.
//
// Outdoors and in the sun, so the stops are written to be read in short bursts,
// and the route follows the usual way round: the Great Pyramid first, along
// the three pyramids to the desert viewpoint, then down through the Valley
// Temple to finish at the Sphinx.
//
// `answer` is the index of the right option. They are deliberately not always 0.

export const GIZA = {
  id: 'giza',
  name: 'Pyramids of Giza',
  shortName: 'Giza',
  place: 'The Giza plateau, at the edge of the desert',
  tagline: 'The Great Pyramid, the Sphinx, and the temples and tombs around them.',
  description: 'A family game for the pyramids of Giza: stories, photo quests, quizzes and a guide you can ask anything.',
  cover: 'gizaCover',
  intro:
    'Three kings’ pyramids, the Sphinx, and the only one of the Seven Wonders of the Ancient World still standing. Nine stops, nine stamps. Hats on, water bottles full?',
  // What the guide is told about where the family is (lib/egypt/ai.js).
  setting:
    'They are outdoors on the Giza plateau, walking between the pyramids, the Sphinx and the temples, usually in strong sun. They may already have visited the Grand Egyptian Museum nearby.',
  around: 'around the pyramids',
  ready: {
    title: 'Get ready for the pyramids',
    todo: 'Save all the photos on this phone now, on Wi-Fi, so the stops still work if the signal drops out on the plateau.',
  },
  // A rough plan of the plateau, north up, in metres from the middle of the
  // Great Pyramid (east is +x, north is +y). Worked out from the monuments'
  // published coordinates and sizes, so the layout is right but small things
  // are nudged apart to stay tappable. The Panorama is further out than shown.
  map: {
    view: [-1010, -1060, 1480, 1260],
    features: [
      { type: 'road', points: [[-220, -344], [300, -490]], label: 'Khafre’s causeway', labelAt: [40, -480] },
      { type: 'pyramid', x: 0, y: 0, size: 230, label: 'Khufu', labelAt: [0, -175] },
      { type: 'pyramid', x: 190, y: 20, size: 46 },
      { type: 'pyramid', x: 190, y: -40, size: 46 },
      { type: 'pyramid', x: 190, y: -98, size: 46 },
      { type: 'pyramid', x: -328, y: -344, size: 215, label: 'Khafre', labelAt: [-328, -510] },
      { type: 'pyramid', x: -588, y: -744, size: 104, label: 'Menkaure', labelAt: [-660, -760], anchor: 'end' },
      { type: 'pyramid', x: -500, y: -850, size: 44 },
      { type: 'pyramid', x: -566, y: -850, size: 32 },
      { type: 'pyramid', x: -624, y: -850, size: 32 },
      { type: 'temple', x: 330, y: -500, w: 46, h: 46 },
      { type: 'sphinx', x: 300, y: -425 },
      { type: 'area', x: 330, y: -900, w: 230, h: 150, label: 'Builders’ town', labelAt: [330, -1020] },
      { type: 'arrow', from: [360, 20], to: [455, 100], label: 'The GEM, 2 km', labelAt: [465, 125], anchor: 'end' },
      { type: 'label', label: 'Western Desert', labelAt: [-995, -1045], anchor: 'start' },
    ],
    pins: {
      khufu: [-80, 20],
      inside: [40, 135],
      queens: [262, -40],
      builders: [330, -880],
      khafre: [-328, -344],
      menkaure: [-588, -744],
      panorama: [-860, -900],
      valley: [400, -520],
      sphinx: [230, -400],
    },
  },
  stops: [
    {
      id: 'khufu',
      title: 'The Great Pyramid',
      where: 'The north side of the plateau, where most visits start',
      stamp: '𓈌',
      kind: 'scale',
      photos: ['khufuHero', 'khufuFace', 'khufuCasing', 'khufuCamel', 'khufuClimb', 'khufuSummit', 'khufuPinch', 'khufuOld', 'viewPanorama'],
      intro: 'The last of the Seven Wonders of the Ancient World still standing. Stand at the bottom and look up.',
      story: [
        'This is the tomb of Khufu, a pharaoh who ruled about 4,500 years ago. When it was finished it stood 146.6 metres tall. It has lost its tip since, so today it is about 138.5 metres.',
        'It is made of an estimated 2.3 million blocks of stone, about 6 million tonnes in all. For more than 3,700 years nothing people built anywhere was taller, until the spires of medieval English cathedrals.',
        'It did not always look like this. The whole pyramid was covered in smooth white limestone from Tura, across the Nile, that shone in the sun. In the 1300s, after earthquakes had loosened them, most of those casing stones were carried off to build Cairo. A few are still in place at the bottom of the north side.',
        'The Egyptians called it Akhet Khufu, “the Horizon of Khufu”. That is the sign on this stop’s stamp: the sun between two hills.',
      ],
      lookFor: [
        'The smooth casing stones left at the bottom of the north side',
        'How tall the bottom row of blocks is next to a person',
        'The small pyramids along the east side (stop 3)',
      ],
      facts: [
        'Its four sides face north, south, east and west almost exactly: on average they are out by only about a tenth of a degree.',
        'Visitors used to climb to the top for the view, hauled up by local guides. Climbing it is banned now.',
        'You saw these pyramids from the window at the top of the GEM’s Grand Staircase, about 2 kilometres away.',
      ],
      quest: {
        title: 'Pinch the pyramid',
        ask: 'The classic trick photo: line one of you up so it looks as if they are pinching the tip of the pyramid between finger and thumb.',
        hint: 'Stand well back. One of you holds a hand out, and the photographer crouches until the fingers meet the tip.',
        target:
          'A photo of the Great Pyramid, or any of the Giza pyramids, ideally with a person’s hand or fingers lined up with the tip in a forced-perspective trick. A clear photo of the Great Pyramid with a person in it also counts.',
      },
      quiz: [
        {
          q: 'About how many blocks of stone are in the Great Pyramid?',
          options: ['23,000', '230,000', '2.3 million', '23 million'],
          answer: 2,
          why: 'An estimated 2.3 million, weighing about 6 million tonnes altogether.',
        },
        {
          q: 'What covered the outside of the pyramid when it was new?',
          options: ['Gold leaf', 'Smooth white limestone', 'Painted mud bricks', 'Nothing: it always looked like this'],
          answer: 1,
          why: 'Polished white limestone from Tura. Most of it was carted off to build Cairo in the 1300s.',
          photo: 'khufuCasing',
        },
        {
          q: 'For how long was it the tallest thing people had built?',
          options: ['About 50 years', 'About 500 years', 'More than 3,700 years', 'It still is'],
          answer: 2,
          why: 'More than 3,700 years, until the spires of medieval English cathedrals went higher.',
        },
        {
          q: 'What did the Egyptians call it?',
          options: ['The Horizon of Khufu', 'The House of Ra', 'The Mountain of Gold', 'The Great Stair'],
          answer: 0,
          why: 'Akhet Khufu, the Horizon of Khufu. The horizon was where the sun was born each morning and died each night.',
        },
      ],
      guide:
        'The Great Pyramid of Khufu (Cheops), Giza, 4th Dynasty, c. 2600–2560 BC, built over roughly 20 to 27 years. Original height 146.6 m (280 royal cubits), now 138.5 m; base about 230.3 m a side; slope about 51°50′; an estimated 2.3 million blocks, about 6 million tonnes, average block about 2.5 tonnes; granite blocks inside up to about 80 tonnes. Casing of white Tura limestone, mostly removed in the 14th century after earthquakes; some casing stones remain at the base of the north side. Tallest human-made structure for more than 3,700 years. Sides aligned to the cardinal points to within about 3 to 4 arcminutes. Ancient name Akhet Khufu, Horizon of Khufu. Presumed architect Hemiunu. The only surviving Wonder of the Ancient World. Climbing it is prohibited.',
    },
    {
      id: 'inside',
      title: 'Inside a Pyramid',
      where: 'The Great Pyramid’s north face (going in needs its own ticket)',
      stamp: '𓊭',
      photos: ['insideGallery', 'insideEntrance', 'insideEntranceWide', 'insideTunnel', 'insidePassage', 'insideGalleryLit', 'insideKing', 'insideSarcophagus', 'insideCutaway', 'insideVoid', 'insideGraffiti', 'insideEngraving'],
      intro: 'There are passages and rooms hidden in all that stone. Some were only found in the last few years.',
      story: [
        'The original entrance is high up on the north face, under a pair of giant stone chevrons that take the weight of the stone above. Visitors today go in lower down, through a tunnel that robbers or treasure hunters cut. Tradition says the Caliph al-Ma’mun’s men dug it around 820 AD, though some think it is older.',
        'Inside, a low, steep passage climbs to the Grand Gallery: about 47 metres long and more than 8 metres high, its polished walls stepping inwards towards the roof. At the top is the King’s Chamber, lined entirely with red granite. Its ceiling is nine granite slabs weighing about 400 tonnes in all.',
        'The only thing in it is a granite sarcophagus, found empty and broken. It is wider than the passages, so it must have been put in while the pyramid was still being built.',
        'In 2017, scientists using muons (tiny particles that rain down from space and pass through rock) found a huge hidden space above the Grand Gallery, at least 30 metres long. Nobody has been inside it. In 2023 a camera pushed through a gap found a 9-metre corridor hidden behind the chevrons over the entrance.',
      ],
      lookFor: [
        'The giant chevron stones over the original entrance',
        'The tunnel lower down that visitors use',
        'If you go in: the Grand Gallery’s stepped walls',
      ],
      facts: [
        'Above the King’s Chamber are five small rooms that spread the weight. When they were opened in 1837, explorers found graffiti in red paint left by the work gangs, with Khufu’s name more than a dozen times.',
        'The Queen’s Chamber was never a queen’s tomb. The name came from early explorers, not from anything found in it.',
        'Inside it is hot, humid and steep, and some passages are bent-double low. If anyone hates small spaces, the outside is just as amazing.',
      ],
      quest: {
        title: 'The secret entrance',
        ask: 'Find the original entrance on the north face and photograph the giant chevron stones above it.',
        hint: 'Look up near the middle of the north side, about 17 metres above the ground. The tunnel visitors use is lower down, a little to the right.',
        target:
          'The north face entrance area of the Great Pyramid: large gabled or chevron-shaped limestone blocks over the original entrance, or the robbers’ tunnel entrance below it. Anything clearly inside the Great Pyramid (the Grand Gallery, a passage, the King’s Chamber) also counts.',
      },
      quiz: [
        {
          q: 'How do most visitors get inside the Great Pyramid today?',
          options: ['Through the original entrance', 'Through a tunnel dug by robbers or treasure hunters', 'By a lift in the middle', 'Through a door at the top'],
          answer: 1,
          why: 'Through the tunnel credited to the Caliph al-Ma’mun’s men, around 820 AD. The original entrance is above it.',
          photo: 'insideEntranceWide',
        },
        {
          q: 'What was found in the King’s Chamber?',
          options: ['Khufu’s mummy and his gold', 'A room full of treasure', 'An empty granite sarcophagus', 'A hidden staircase'],
          answer: 2,
          why: 'Just the sarcophagus, already broken open and empty. It is too big for the passages, so it went in during the building.',
        },
        {
          q: 'How did scientists find the hidden “Big Void” in 2017?',
          options: ['By drilling holes', 'With particles from space called muons', 'With a robot dog', 'By tapping the walls'],
          answer: 1,
          why: 'Muons pass through stone, and fewer get through where there is more of it. Detectors spotted a place where there was less.',
        },
        {
          q: 'What are the giant chevrons over the entrance for?',
          options: ['Decoration', 'To spread the weight of the stone above', 'To point at the sun', 'To hide a door'],
          answer: 1,
          why: 'They push the enormous weight above out to the sides, so the passage below is not crushed.',
          photo: 'insideEntrance',
        },
      ],
      guide:
        'Interior of the Great Pyramid. Original entrance on the north face about 17 m up and 7.9 m east of the centre line, under double chevrons. Visitors use the Robbers’ Tunnel, traditionally attributed to Caliph al-Ma’mun around 820 AD (many scholars think it older), entered about 7 m above the base. The ascending passage leads to the Grand Gallery (46.68 m long, 8.6 m high, corbelled polished limestone) and the King’s Chamber (granite, 10.5 × 5.2 m, flat ceiling of nine granite slabs about 400 tonnes in total), containing an empty, broken granite sarcophagus too large to pass through the passages. The Queen’s Chamber (5.2 × 5.8 m, gabled roof) is misnamed. Five relieving chambers above the King’s Chamber, opened by Vyse in 1837, hold work-gang graffiti in red ochre with Khufu’s name. ScanPyramids muography found the Big Void above the Grand Gallery (announced 2017, at least 30 m long, inaccessible) and the North Face Corridor behind the entrance chevrons (explored by endoscope in February 2023, about 9 m long, about 2 × 2 m). Going inside needs a separate ticket; passages are low, steep, hot and humid. Never say whether it is open today or what tickets cost.',
    },
    {
      id: 'queens',
      title: 'The Queens’ Pyramids',
      where: 'The east side of the Great Pyramid',
      stamp: '𓁐',
      photos: ['queensSE', 'queensRuins', 'khufuStatuette', 'hetepheresChair', 'hetepheresBed', 'hetepheresCanopy', 'basalt', 'boatPit', 'boatSide', 'mastabas', 'queensChapel'],
      intro: 'Khufu was not buried alone. His family and his court lie all around him, and so did his boats.',
      story: [
        'The three small pyramids along the east side of the Great Pyramid were built for royal women of Khufu’s family: his queens, and perhaps his mother. They are ruined now, but each was once a smooth, pointed pyramid of its own.',
        'In 1925 an American expedition’s photographer was setting up nearby when one leg of his tripod slipped into the ground. It had broken through plaster hiding the top of a shaft 27 metres deep. At the bottom was the burial of Queen Hetepheres, Khufu’s mother: gold-covered furniture, jewellery and a sealed alabaster sarcophagus. When it was opened in 1927, it was empty.',
        'The black floor near here is basalt, all that is left of Khufu’s own temple, where priests made offerings to the dead king.',
        'Pits shaped like boats were cut into the rock around the pyramid. In 1954 one on the south side was found still sealed, with a real boat inside, taken apart into 1,224 pieces of cedar. It took 14 years to put it back together. It is the boat you saw at the Grand Egyptian Museum.',
      ],
      lookFor: [
        'The black basalt floor of Khufu’s temple',
        'The three small queens’ pyramids in a row',
        'Pits and shafts cut into the rock',
      ],
      facts: [
        'The wood of Hetepheres’ furniture had rotted away, but the gold that covered it survived. Archaeologists rebuilt the chair and bed around the original gold.',
        'Rows of flat-topped tombs called mastabas fill the ground east and west of the pyramid. They belong to Khufu’s relatives and officials, who wanted to be close to their king forever.',
        'For the man behind the biggest pyramid, Khufu has a tiny statue: the only complete one ever found is an ivory figure about 7.5 cm tall.',
      ],
      quest: {
        title: 'A queen’s pyramid',
        ask: 'Find one of the small queens’ pyramids beside the Great Pyramid and take a photo of one of you in front of it.',
        hint: 'They stand in a row on the east side, the side facing the Sphinx and the city.',
        target:
          'One of the small, ruined subsidiary pyramids beside a large pyramid at Giza (the queens’ pyramids), or the basalt pavement or a rock-cut pit on the east side of the Great Pyramid. Mastaba tombs beside the Great Pyramid also count.',
      },
      quiz: [
        {
          q: 'How was Queen Hetepheres’ hidden tomb found in 1925?',
          options: ['A dog dug it up', 'A tripod leg slipped into the ground', 'A storm blew the sand away', 'A map was found in a book'],
          answer: 1,
          why: 'A photographer’s tripod leg broke through the plaster sealing the shaft. At the bottom was the queen’s burial.',
        },
        {
          q: 'What was inside Hetepheres’ sealed sarcophagus?',
          options: ['Her mummy, covered in gold', 'A cat mummy', 'Nothing: it was empty', 'A model boat'],
          answer: 2,
          why: 'It was empty. Nobody knows for certain where her body went.',
          photo: 'hetepheresChair',
        },
        {
          q: 'What was found in a sealed pit beside the Great Pyramid in 1954?',
          options: ['A chariot', 'A wooden boat in 1,224 pieces', 'A second Sphinx', 'Khufu’s crown'],
          answer: 1,
          why: 'Khufu’s cedar boat, about 43 metres long. It took 14 years to rebuild, and it is now in the GEM.',
          photo: 'boatSide',
        },
        {
          q: 'Who were the small pyramids beside the Great Pyramid built for?',
          options: ['Khufu’s pets', 'Royal women of Khufu’s family', 'The builders', 'Practice runs for the big one'],
          answer: 1,
          why: 'Khufu’s queens, and probably his mother. Royal women often had small pyramids of their own.',
        },
      ],
      guide:
        'East side of the Great Pyramid: three subsidiary queens’ pyramids (G1-a, G1-b, G1-c) for royal women of Khufu’s family (attributions debated; G1-a is often linked to Hetepheres I or Meritites), a small satellite pyramid (G1-d), the basalt pavement of Khufu’s mortuary temple, boat-shaped pits, and the Eastern Cemetery of mastabas for royal relatives and officials. In February 1925, while Reisner was away, the Harvard–Boston expedition photographer Mohammedani Ibrahim’s tripod leg broke through plaster sealing shaft G 7000x, about 27 m deep: the burial of Queen Hetepheres I, Khufu’s mother, with gilded furniture (carrying chair, bed, canopy frame, armchair) rebuilt around the original gold, and a sealed alabaster sarcophagus that was empty when opened in 1927; her canopic chest still held her organs. In 1954 Kamal el-Mallakh found a sealed boat pit on the south side with Khufu’s cedar boat in 1,224 pieces, reassembled over 14 years, about 43.6 m long, now in the Grand Egyptian Museum (the family may have seen it there). A second boat pit was excavated from 2011. The only complete statue of Khufu is an ivory statuette about 7.5 cm tall, found at Abydos.',
    },
    {
      id: 'builders',
      title: 'Who Built the Pyramids?',
      where: 'Anywhere at the foot of the pyramids (a good one for a sit in the shade)',
      stamp: '𓊸',
      kind: 'builder',
      photos: ['buildersBlocks', 'buildersSitting', 'buildersRestored', 'buildersSledge', 'buildersRampFront', 'buildersRampWrap', 'insideGraffiti'],
      intro: 'Not slaves, and definitely not aliens. Thousands of skilled, well-fed Egyptians, and some brilliant organisation.',
      story: [
        'For a long time people imagined armies of slaves. The evidence says otherwise. South of the Sphinx, archaeologists have dug up the builders’ own town, with bakeries, storerooms and piles of bones from the cattle, sheep and goats they ate. Their tombs are on the hillside nearby, close to their king’s.',
        'Their skeletons show years of hard work, but also care: broken bones that had been set and healed. Ancient historians claimed 100,000 workers. Modern estimates are far lower, roughly 10,000 to 40,000 at any one time, many of them working in teams that took turns.',
        'Most of the stone was cut right here on the plateau. The fine white casing came by boat from Tura, across the river. In 2013 archaeologists found the oldest inscribed papyri ever discovered: the logbook of an official called Merer, who spent months shipping Tura limestone to Giza in Khufu’s reign.',
        'How did they get the blocks up? Copper tools, wooden sledges, ropes and ramps of mud brick and rubble. Exactly what the ramps looked like is still argued about. A painting from a later tomb shows a man pouring water on the sand in front of a sledge, and in 2014 scientists showed that sand with the right amount of water can halve the force needed to drag one.',
      ],
      lookFor: [
        'A block taller than the shortest person in your family',
        'Rough tool marks on the stone',
        'Khafre’s causeway, running from the pyramids down towards the Sphinx',
      ],
      facts: [
        'Work gangs painted their team names on the stones. One that worked on the Great Pyramid called itself “the Friends of Khufu”.',
        'Bread and beer were the basic rations, and judging by the bones, the builders got plenty of meat too.',
        'An average block weighs about 2.5 tonnes. Some of the granite blocks inside the Great Pyramid weigh up to about 80 tonnes.',
      ],
      quest: {
        title: 'Bigger than you',
        ask: 'Find a block at the bottom of a pyramid and take a photo of the smallest member of the family standing next to it.',
        hint: 'The bottom rows of the Great Pyramid have some of the biggest blocks you can walk up to.',
        target:
          'A person standing next to a large stone block at the base of a pyramid at Giza, showing the scale of the block. A close photo of big pyramid blocks also counts.',
      },
      quiz: [
        {
          q: 'Who do archaeologists think built the pyramids?',
          options: ['Slaves captured in war', 'Paid and fed Egyptian workers', 'Aliens', 'Giants'],
          answer: 1,
          why: 'Skilled Egyptian workers and crews, housed and fed by the state. Their town and their tombs have been found here.',
        },
        {
          q: 'What is Merer famous for?',
          options: ['Designing the Sphinx', 'Keeping the oldest inscribed papyri ever found: a logbook of shipping stone', 'Being the tallest pharaoh', 'Robbing the Great Pyramid'],
          answer: 1,
          why: 'His logbook, found in 2013, records shipping limestone from Tura to Giza in Khufu’s reign.',
        },
        {
          q: 'Why did an ancient painting show a man pouring water in front of a sledge?',
          options: ['To cool the workers down', 'Damp sand makes a sledge much easier to pull', 'To wash the statue', 'For good luck'],
          answer: 1,
          why: 'Wet sand is firmer, so the sledge does not dig in. Scientists measured it in 2014: it can halve the pulling force.',
          photo: 'buildersSledge',
        },
        {
          q: 'About how much does an average block weigh?',
          options: ['25 kg, like a suitcase', 'About 2.5 tonnes, more than a big car', 'About 250 tonnes', 'Nothing much: they are hollow'],
          answer: 1,
          why: 'About 2.5 tonnes on average, though some granite blocks inside weigh up to about 80 tonnes.',
        },
      ],
      guide:
        'How the Giza pyramids were built. The builders were paid and fed Egyptian workers and crews working in rotating teams, not slaves. Mark Lehner’s excavations at Heit el-Ghurab (the "Lost City of the Pyramid Builders"), south of the Wall of the Crow, found workers’ galleries, bakeries, storerooms and large amounts of cattle, sheep and goat bone; that town dates to Khafre and Menkaure. Zahi Hawass’s team excavated the workers’ cemetery on the slope above from 1990 (first noticed when a tourist’s horse stumbled on a mud-brick wall); skeletons show heavy labour and healed fractures. Workforce: Herodotus said 100,000; modern estimates are roughly 10,000 to 40,000 at a time (one 1999 study: average about 13,200, peak about 40,000). Most core stone was quarried on the plateau, fine casing came from Tura by boat, granite from Aswan. The Diary of Merer (Wadi al-Jarf papyri, found 2013 by Pierre Tallet), the oldest known inscribed papyri, records shipping limestone from Tura in Khufu’s 27th year. Tools: copper chisels and saws, stone pounders, wooden sledges, levers and ropes; ramps of mudbrick and rubble, their design debated (straight, zigzag, wrapping, internal). The Djehutihotep tomb painting (Middle Kingdom, about 1900 BC) shows water poured in front of a sledge carrying a colossus; a 2014 University of Amsterdam study found correctly wetted sand can halve the pulling force. Work-gang names such as "Friends of Khufu". Average block about 2.5 tonnes. Never endorse alien or lost-civilisation theories; say kindly that the evidence points clearly to Egyptian builders.',
    },
    {
      id: 'khafre',
      title: 'Khafre’s Pyramid',
      where: 'The middle one of the three',
      stamp: '𓈍',
      photos: ['khafreHero', 'khafreCap', 'khafreSun', 'khafreCamel', 'khafreBelzoni', 'khafreChamber', 'khafrePassage'],
      intro: 'It looks like the tallest. It isn’t. And it still has a patch of its original shiny skin.',
      story: [
        'Khafre was Khufu’s son. His pyramid was about 143.5 metres tall when new, a little shorter than his father’s, but it stands on rock about 10 metres higher, so from most places it looks bigger. Clever, or cheeky?',
        'Look at the top. That paler cap is the last surviving patch of the smooth white limestone that once covered every pyramid here. The bottom row of casing was pink granite.',
        'Inside, the burial chamber was cut down into the bedrock. In 1818 an Italian explorer and former circus strongman, Giovanni Belzoni, found the way in. He found a granite sarcophagus sunk into the floor, already robbed, and painted his name on the wall in big letters. It is still there.',
        'A stone causeway about 500 metres long ran from Khafre’s temple, on the pyramid’s east side, down to his Valley Temple beside the Sphinx. You will walk down that way for the last two stops.',
      ],
      lookFor: [
        'The cap of smooth casing at the top',
        'Pink granite blocks around the bottom',
        'The ruins of Khafre’s temple on the east side',
      ],
      facts: [
        'Belzoni found bones in the sarcophagus, possibly from a bull. Nobody knows how they got there.',
        'The Sphinx sits beside Khafre’s causeway and his Valley Temple, which is one reason many experts think it has Khafre’s face.',
      ],
      quest: {
        title: 'The shiny cap',
        ask: 'Take a photo of Khafre’s pyramid with the smooth cap at the top clearly showing.',
        hint: 'It is the middle of the three big pyramids. Zoom in on the tip if you need to.',
        target:
          'Khafre’s pyramid at Giza, recognisable by the smooth limestone casing that survives on its top third. Any Giza pyramid with that smooth casing clearly visible at the top counts.',
      },
      quiz: [
        {
          q: 'Why does Khafre’s pyramid look taller than the Great Pyramid?',
          options: ['It is taller', 'It is built on higher ground', 'It is newer and less worn', 'It has a pointier top'],
          answer: 1,
          why: 'It stands on bedrock about 10 metres higher. The Great Pyramid was, and still is, the taller of the two.',
        },
        {
          q: 'What is the pale cap at the top?',
          options: ['Snow', 'Bird droppings', 'The last of the original smooth limestone casing', 'A modern repair'],
          answer: 2,
          why: 'Original casing. Every pyramid here was once covered like that, all the way down.',
          photo: 'khafreCap',
        },
        {
          q: 'What did Belzoni do when he reached the burial chamber in 1818?',
          options: ['Took the mummy home', 'Painted his name on the wall', 'Found a room of gold', 'Sealed it up again'],
          answer: 1,
          why: 'His name and the date are still on the wall: “Scoperta da G. Belzoni”, Italian for “discovered by G. Belzoni”.',
          photo: 'khafreBelzoni',
        },
        {
          q: 'Who was Khafre?',
          options: ['Khufu’s son', 'Khufu’s architect', 'A Roman emperor', 'Tutankhamun’s grandfather'],
          answer: 0,
          why: 'He was Khufu’s son, and probably the king the Sphinx was carved for.',
        },
      ],
      guide:
        'Pyramid of Khafre (Chephren), son of Khufu, 4th Dynasty. Original height 143.5 m, now 136.4 m; base about 215 m; stands on bedrock about 10 m higher than Khufu’s pyramid, so it often looks taller. Keeps original Tura limestone casing on its top third (the very apex is missing); the lowest course was pink granite. Interior: two entrances on the north side; burial chamber cut into the bedrock with a gabled limestone roof, about 14.15 × 5 m, with a granite sarcophagus sunk partly into the floor. Giovanni Belzoni (Italian explorer, former strongman) entered on 2 March 1818 and left the graffito "Scoperta da G. Belzoni. 2. mar. 1818." on the chamber wall; he found bones in the sarcophagus, possibly a bull’s. Mortuary temple on the east face; causeway about 494.6 m to the Valley Temple beside the Sphinx. Whether the interior is open on a given day varies; do not say.',
    },
    {
      id: 'menkaure',
      title: 'Menkaure’s Pyramid',
      where: 'The smallest of the three, to the south-west',
      stamp: '𓏠',
      photos: ['menkaureHero', 'menkaurePeople', 'menkaureGranite', 'menkaureBosses', 'menkaureQueens', 'menkaureChamber', 'menkaureSarcophagus', 'menkaureTriad', 'menkaureOld'],
      intro: 'The baby of the three, with a scar on its face and a treasure at the bottom of the sea.',
      story: [
        'Menkaure was probably Khafre’s son. His pyramid is far smaller: about 65.5 metres when new and about 61 today, with less than a tenth of the Great Pyramid’s volume. But it was meant to be the grandest: its lowest sixteen rows were cased in red granite brought hundreds of kilometres down the Nile from Aswan.',
        'Look closely and some of the granite is still rough, never smoothed off. The work seems to have stopped when Menkaure died.',
        'That deep gash in the north face? In 1196 a sultan of Egypt, al-Aziz Uthman, son of the famous Saladin, decided to demolish the pyramids, starting with this one. His workers spent eight months on it and managed only one or two stones a day. They gave up, and left the scar.',
        'In 1837 an English colonel, Howard Vyse, took Menkaure’s beautifully carved stone sarcophagus out of the burial chamber and shipped it to Britain. The ship, the Beatrice, sank in a storm in 1838. The sarcophagus has never been found.',
      ],
      lookFor: [
        'The gash in the north face',
        'Red granite casing at the bottom',
        'Granite blocks that were never smoothed off',
        'Three small queens’ pyramids on its south side',
      ],
      facts: [
        'In Menkaure’s valley temple, archaeologists found superb statues of the king standing with the goddess Hathor and other gods. Some are in Cairo, others in Boston.',
        'Small as it is, its granite casing made it one of the most expensive pyramids to build: every block had to come by boat from Aswan, in the far south.',
      ],
      quest: {
        title: 'The scar',
        ask: 'Take a photo of Menkaure’s pyramid showing the big gash in its north face.',
        hint: 'The gash is on the north side, the side facing the other two big pyramids.',
        target:
          'The pyramid of Menkaure at Giza, the smallest of the three main pyramids, ideally showing the large vertical gash in its north face or its red granite lower casing.',
      },
      quiz: [
        {
          q: 'What was special about the casing at the bottom of Menkaure’s pyramid?',
          options: ['It was gold', 'It was red granite from Aswan', 'It was painted blue', 'It was glass'],
          answer: 1,
          why: 'Red granite, brought hundreds of kilometres down the Nile. Some of it was never finished.',
          photo: 'menkaureGranite',
        },
        {
          q: 'What made the gash in the north face?',
          options: ['An earthquake', 'Lightning', 'A sultan’s workers trying to demolish it in 1196', 'A crashed plane'],
          answer: 2,
          why: 'Al-Aziz Uthman’s men worked for eight months and gave up. All they managed was the scar.',
        },
        {
          q: 'What happened to Menkaure’s sarcophagus?',
          options: ['It is in the British Museum', 'It sank with a ship in 1838', 'It is still inside', 'It was made into a bath'],
          answer: 1,
          why: 'It went down with the Beatrice on the way to Britain, and has never been found.',
          photo: 'menkaureSarcophagus',
        },
        {
          q: 'Which is the smallest of the three big pyramids?',
          options: ['Khufu’s', 'Khafre’s', 'Menkaure’s', 'They are all the same'],
          answer: 2,
          why: 'Menkaure’s, at about 65 metres when new, less than half the height of the other two.',
        },
      ],
      guide:
        'Pyramid of Menkaure (Mycerinus), 4th Dynasty, probably Khafre’s son. Original height 65.5 m, now about 61 m; base about 102–105 m. The lowest sixteen courses were cased in red Aswan granite, partly left undressed, suggesting work stopped at the king’s death. Vertical gash on the north face from the demolition attempt ordered in 1196 by Sultan al-Aziz Uthman, son of Saladin: eight months, one or two stones a day, abandoned. Burial chamber lined with granite. Howard Vyse and John Perring found the basalt sarcophagus, carved with palace-façade panelling, in 1837; it was lost when the ship Beatrice sank in 1838. Three queens’ pyramids lie to the south (G3-a a true pyramid, G3-b and G3-c stepped). Reisner excavated the valley temple from 1908 and found greywacke triads of Menkaure with Hathor and nome deities, and a pair statue with a queen (now in Cairo and Boston).',
    },
    {
      id: 'panorama',
      title: 'The Panorama',
      where: 'The viewpoint out in the desert, south-west of the pyramids',
      stamp: '𓈉',
      photos: ['panoramaHero', 'panoramaRider', 'panoramaCamels', 'panoramaResting', 'panoramaLying', 'panoramaCamelFace', 'panoramaAerial', 'buildersRestored'],
      intro: 'The postcard view: every pyramid in a row, with the desert behind you and Cairo beyond.',
      story: [
        'From out here you can see why Giza was chosen. The pyramids stand on a high, flat shelf of limestone at the edge of the Western Desert: solid rock to build on and to quarry, high enough to stay dry when the Nile flooded, close enough to the river for boats, and right on the skyline.',
        'They are on the west bank of the Nile for a reason. The west is where the sun sets, and to the Egyptians the setting sun meant the land of the dead. Most of Egypt’s great royal cemeteries are on the west bank.',
        'Count the pyramids. The three big ones are Khufu’s, Khafre’s and Menkaure’s. The small ones in front belong to Menkaure’s queens. Add Khufu’s three queens’ pyramids, hidden from here behind his own, and you get the classic count of nine.',
        'The camels are a much later addition. The pyramid builders never rode one: camels only became common in Egypt around 2,000 years after the pyramids were built. The builders used donkeys, boats and a lot of muscle.',
      ],
      lookFor: [
        'All three big pyramids lined up',
        'Menkaure’s three small queens’ pyramids in front',
        'The city on the horizon behind the pyramids',
      ],
      facts: [
        'Behind you, the Western Desert stretches hundreds of kilometres, all the way to Libya.',
        'Camel and horse rides are offered all round here. Agree the price and how long the ride lasts before anyone gets on.',
      ],
      quest: {
        title: 'All in a row',
        ask: 'Get all of the pyramids into one photo, the way they look on the postcards.',
        hint: 'Step back until the three big ones and the little ones in front all fit. Turn the phone sideways.',
        target:
          'A wide view of several Giza pyramids together, ideally all three main pyramids in one frame, as seen from the desert to the south-west. Camels in the photo are fine.',
      },
      quiz: [
        {
          q: 'Why are the pyramids on the west bank of the Nile?',
          options: ['The east bank was full', 'The sun sets in the west, the land of the dead', 'The wind blows that way', 'So sailors could see them'],
          answer: 1,
          why: 'The west, where the sun goes down, was the land of the dead. Most royal tombs in Egypt are on the west bank.',
        },
        {
          q: 'Did the pyramid builders ride camels?',
          options: ['Yes, everywhere', 'Only the pharaoh did', 'No: camels became common in Egypt much later', 'Only to carry the stone'],
          answer: 2,
          why: 'Camels only became common in Egypt around 2,000 years later. The builders used donkeys, boats and their own muscles.',
          photo: 'panoramaRider',
        },
        {
          q: 'How many pyramids are in the classic count at Giza?',
          options: ['Three', 'Six', 'Nine', 'Twelve'],
          answer: 2,
          why: 'Nine: the three kings’ pyramids, plus three small queens’ pyramids each for Khufu and Menkaure.',
          photo: 'panoramaHero',
        },
        {
          q: 'Why build on this high, rocky shelf?',
          options: ['It was dry, solid and near the river', 'It was the only free land', 'To be closer to the stars', 'Because of buried treasure'],
          answer: 0,
          why: 'Solid limestone to build on and to quarry, above the reach of the flood, and close to the Nile for boats.',
        },
      ],
      guide:
        'The Panorama viewpoint, in the desert south-west of the Giza pyramids, where the classic view of all the pyramids in a line is taken; camel and horse rides are offered there. The plateau is a shelf of limestone (Mokattam Formation) at the edge of the Western Desert, above the old Nile floodplain. Royal cemeteries were on the west bank, linked with sunset and the dead. The classic count is nine pyramids: Khufu, Khafre and Menkaure, three queens’ pyramids of Khufu east of the Great Pyramid, and three of Menkaure south of his. Camels were not used by the pyramid builders: domesticated camels only became common in Egypt in the first millennium BC; the builders used donkeys, boats and sledges. For rides, advise agreeing the price and length beforehand, but never give prices.',
    },
    {
      id: 'valley',
      title: 'Khafre’s Valley Temple',
      where: 'Beside the Sphinx: the way through to see it',
      stamp: '𓊽',
      photos: ['valleyHero', 'valleyHall', 'valleyPillars', 'valleyScale', 'valleyCorner', 'valleySockets', 'valleyWindow', 'valleyStatue', 'valleyFalcon', 'valleyOutside', 'valleyOld', 'valleyFlood'],
      intro: 'No paintings, no carvings, just enormous blocks of polished granite. This was the front door to Khafre’s pyramid.',
      story: [
        'This temple stood at the bottom of Khafre’s causeway, at the edge of the valley, probably close to a harbour linked to the Nile. It was the grand entrance to the king’s whole pyramid complex: from here a covered causeway climbed to his pyramid temple and his tomb.',
        'Its walls are a core of huge limestone blocks, faced with red granite from Aswan. The square pillars of the T-shaped hall are each a single piece of granite, and the floor was paved with white alabaster.',
        'Look at the floor of the hall: there are sockets where statues of Khafre once stood, lit by thin slots high in the walls. One famous statue was found in a pit in this temple in the 1850s: Khafre on his throne, with the falcon god Horus spreading his wings behind the king’s head.',
        'The builders cut the blocks to fit each other exactly, even wrapping some round corners so that there is no straight joint. Walk up to a pillar and see how you compare.',
      ],
      lookFor: [
        'Blocks that bend round the corners',
        'Sockets in the floor where statues stood',
        'The thin light slots at the top of the walls',
        'What is left of the alabaster floor',
      ],
      facts: [
        'Until the Aswan High Dam was finished in 1970, the Nile flooded every summer and the water spread across the valley towards the foot of the plateau.',
        'The Sphinx Temple next door was built right up against this one, and was never finished.',
      ],
      quest: {
        title: 'Granite giants',
        ask: 'Inside the temple, take a photo of one of you standing next to a granite pillar or block.',
        hint: 'The T-shaped hall has the biggest pillars. Stand right up against one.',
        target:
          'The interior of Khafre’s Valley Temple at Giza: massive red granite pillars, lintels or wall blocks, ideally with a person for scale. The neighbouring Sphinx Temple or its big limestone blocks also count.',
      },
      quiz: [
        {
          q: 'What are the pillars in the T-shaped hall made from?',
          options: ['Mud brick', 'Single blocks of red granite', 'Wood painted to look like stone', 'Concrete'],
          answer: 1,
          why: 'Each one is a single block of red granite from Aswan, hundreds of kilometres up the Nile.',
          photo: 'valleyHall',
        },
        {
          q: 'What does this temple have almost none of?',
          options: ['Stone', 'Carvings and paintings', 'Pillars', 'Corners'],
          answer: 1,
          why: 'It is almost undecorated. The polished granite was the decoration.',
        },
        {
          q: 'What is behind Khafre’s head on the statue found here?',
          options: ['A cobra', 'A falcon: the god Horus', 'A sun disc', 'A crown of feathers'],
          answer: 1,
          why: 'Horus the falcon wraps his wings round the back of the king’s head: the god protecting the king.',
          photo: 'valleyStatue',
        },
        {
          q: 'Why was this temple built down here, not up by the pyramid?',
          options: ['It was the entrance from the valley and the river', 'The ground was softer', 'To hide it', 'The priests lived here'],
          answer: 0,
          why: 'It was the gateway at the valley’s edge. The causeway led from here up to the pyramid.',
        },
      ],
      guide:
        'Valley Temple of Khafre, at the lower end of Khafre’s causeway (about 495 m long), immediately south of the Sphinx Temple and beside the Sphinx; visitors usually pass through it to the Sphinx viewing terrace. A core of huge local limestone blocks cased in red Aswan granite; a T-shaped hall of monolithic square granite pillars and architraves; floor paved with alabaster (calcite); narrow slits near the roof for light; floor sockets for statues of Khafre (reconstructions suggest about 23). Almost no decoration apart from inscriptions around the doorways. Auguste Mariette cleared it in the 1850s and found the seated statue of Khafre with the Horus falcon behind his head (anorthosite gneiss, often called diorite) in a pit in the temple. The Sphinx Temple was built later against it and never finished. Do not give weights for individual blocks. Before the Aswan High Dam (1970) the annual Nile flood spread towards the foot of the plateau, and a harbour or canal probably served the valley temples.',
    },
    {
      id: 'sphinx',
      title: 'The Great Sphinx',
      where: 'In front of Khafre’s pyramid, facing the sunrise',
      stamp: '𓃭',
      photos: ['sphinxHero', 'sphinxFront', 'sphinxFace', 'sphinxStele', 'sphinxSteleClose', 'sphinxBody', 'sphinxBeard', 'sphinxBuried', 'sphinxCleared', 'sphinxGroup', 'sphinxSoldiers', 'panoramaOld', 'sphinxDapper'],
      intro: 'A lion’s body, a king’s face, and 4,500 years of watching the sun come up.',
      story: [
        'The Sphinx is about 73 metres long and 20 metres high, and it was not built from blocks. It was carved out of the living rock: the builders quarried around a lump of limestone and shaped what was left, using the stone they cut away for the temples in front of it.',
        'Whose face is it? Nobody wrote it down. Most experts think it is Khafre’s, because it sits beside his causeway and his Valley Temple, though some argue for his father Khufu or his brother Djedefre.',
        'And the nose? Not Napoleon’s soldiers, whatever you have heard: drawings from 1737, before Napoleon was even born, already show it missing. Marks on the face show it was levered off on purpose. A historian writing in the 1400s said a Sufi named Muhammad Sa’im al-Dahr did it in 1378, angry that people were making offerings to it.',
        'For much of history, sand buried the Sphinx up to its shoulders. Around 1400 BC a prince called Thutmose fell asleep in its shadow and dreamed that it promised him the throne if he cleared the sand away. He did, became king, and set up the Dream Stele between its paws to tell the story.',
      ],
      lookFor: [
        'The Dream Stele between its paws',
        'Where the nose used to be',
        'Layers of harder and softer rock in its body',
        'The king’s striped headcloth',
      ],
      facts: [
        'It was painted once. Traces of red survive on the face, and there are hints of yellow and blue elsewhere.',
        'Pieces of its stone beard were found between the paws. One is in the British Museum in London.',
        'It faces almost exactly east, towards the rising sun. Later Egyptians worshipped it as Horemakhet, “Horus in the Horizon”.',
      ],
      quest: {
        title: 'Face to face',
        ask: 'Take a photo of the Sphinx with one of you in it. Extra fun: a trick photo kissing the nose that isn’t there.',
        hint: 'The viewing terrace beside the Valley Temple has the best angle.',
        target: 'The Great Sphinx of Giza, ideally with a person in the photo, possibly in a forced-perspective pose.',
      },
      quiz: [
        {
          q: 'How was the Sphinx made?',
          options: ['Built from blocks like a pyramid', 'Carved out of the rock of the plateau', 'Cast in bronze', 'Made of mud brick'],
          answer: 1,
          why: 'It was carved from the bedrock. The stone cut away went into the temples beside it.',
        },
        {
          q: 'What really happened to the Sphinx’s nose?',
          options: ['Napoleon’s soldiers shot it off', 'It fell off in an earthquake', 'It was levered off on purpose, centuries before Napoleon', 'A camel walked into it'],
          answer: 2,
          why: 'Drawings from 1737 already show it missing. A medieval historian said a Sufi did it in 1378.',
          photo: 'sphinxFace',
        },
        {
          q: 'What story does the Dream Stele between its paws tell?',
          options: ['How to build a pyramid', 'A prince dreamed the Sphinx would make him king if he cleared the sand', 'A recipe for bread', 'Where treasure is hidden'],
          answer: 1,
          why: 'Thutmose IV cleared the sand, became king, and put up the stele to say so, around 1400 BC.',
          photo: 'sphinxStele',
        },
        {
          q: 'Which way does the Sphinx face?',
          options: ['North, to the sea', 'South, up the Nile', 'East, to the sunrise', 'West, to the desert'],
          answer: 2,
          why: 'East, towards the rising sun. Later Egyptians worshipped it as Horus in the Horizon.',
        },
      ],
      guide:
        'The Great Sphinx of Giza: about 73 m long, 20 m high and 19 m wide; carved from the limestone bedrock (Mokattam Formation) in a quarry, the cut stone used for the Sphinx Temple and Khafre’s Valley Temple; 4th Dynasty, about 2500 BC. The face is usually attributed to Khafre (beside his causeway and valley temple), with some scholars arguing for Khufu or Djedefre; no contemporary inscription names it. Faces east. The nose was deliberately pried off (rod or chisel marks); al-Maqrizi in the 15th century blamed the Sufi Muhammad Sa’im al-Dahr in 1378; Norden’s drawings of 1737 already show it missing, so the Napoleon story is a myth. Fragments of a beard were found between the paws, one in the British Museum (probably a New Kingdom addition). Traces of red paint on the face and yellow and blue elsewhere. Buried to the shoulders for much of history; Thutmose IV cleared it about 1400 BC and set up the granite Dream Stele between the paws; Caviglia uncovered the chest in 1817; it was cleared and restored in the 1920s and 1930s. New Kingdom name Hor-em-akhet, Horus in the Horizon. The Sphinx Temple in front was never finished. Claims that it is far older than the 4th Dynasty are a minority view; say so if asked.',
    },
  ],
};
