// The Grand Egyptian Museum, as an Egypt Explorer trip.
//
// Everything on a card is written here and was checked against published
// sources before it went in (Wikipedia's GEM article, reporting on the
// November 2025 opening, the Commons descriptions of the photos). Where the
// sources disagree, the card says "about": the hanging obelisk is given as
// 14 to 16 metres and 87 to 90 tonnes, the mask as 10 or 11 kg. Nothing here is
// written by the AI at play time. The guide (api/egypt/guide) answers questions
// on top of this, and is told which stop the family is at.
//
// Pitched at 10 to 14 year olds and their parents: short paragraphs, real
// numbers, no baby talk.
//
// A stop is complete, and earns its stamp, when every quiz question has been
// answered. The photo quest is a bonus: an exhibit can be closed or mobbed,
// and that should never stop a stamp.
//
// `answer` is the index of the right option. They are deliberately not always 0.

export const GEM = {
  id: 'gem',
  name: 'Grand Egyptian Museum',
  shortName: 'The GEM',
  place: 'Giza, next to the pyramids',
  cover: 'cover',
  intro:
    'The biggest museum in the world for a single civilisation, opened in November 2025. More than 100,000 objects, and for the first time every one of Tutankhamun’s treasures together. Nine stops, nine stamps. Ready?',
  stops: [
    {
      id: 'obelisk',
      title: 'The Hanging Obelisk',
      where: 'The plaza, outside the entrance',
      stamp: '𓉶',
      photos: ['obeliskDay', 'obeliskSunset', 'obeliskNight', 'cover', 'obeliskBroken'],
      intro: 'Before you even get inside, Ramesses II is showing off.',
      story: [
        'This granite obelisk is about 16 metres tall and weighs around 87 tonnes, more than a dozen elephants. It was carved for Ramesses II, the pharaoh you will meet inside.',
        'Obelisks were giant stone needles for the sun god Ra. Their pointed tips, called pyramidions, were sometimes covered in gold so they flashed in the sunlight.',
        'This one was found broken into pieces at Tanis, an ancient city in the Nile Delta. Restorers joined it back together and then did something nobody had done before: instead of standing it on the ground, they lifted it onto a stand. It is the world’s first hanging obelisk.',
        'Why lift it? Because Ramesses had his name carved on the bottom, a spot that spent thousands of years in the dark. Walk underneath and look up, and you can see the king’s signature.',
      ],
      lookFor: [
        'Ramesses’ cartouche (the oval name tag) on the underside',
        'Hieroglyphs running up all four sides',
        'The pointed pyramidion at the very top',
      ],
      facts: [
        'There are more ancient Egyptian obelisks outside Egypt than inside it. One, Cleopatra’s Needle, stands by the Thames in London.',
        'Most obelisks were cut from a single piece of granite, at quarries in Aswan in the far south of Egypt.',
      ],
      quest: {
        title: 'The king’s signature',
        ask: 'Stand underneath the obelisk and take a photo of Ramesses’ name carved on the bottom.',
        hint: 'Go right under the stand and point the camera straight up.',
        target:
          'The underside or base of an obelisk on a raised stand, or carved hieroglyphs or a cartouche seen from below. A clear photo of the hanging obelisk itself also counts.',
      },
      quiz: [
        {
          q: 'Why is this obelisk lifted up off the ground?',
          options: ['So it can spin round', 'So you can see the king’s name carved underneath', 'To keep it safe from floods', 'Because the ground was too soft'],
          answer: 1,
          why: 'Ramesses’ cartouche is carved on the bottom of the base. Lifting it is the only way to show it off.',
          photo: 'obeliskDay',
        },
        {
          q: 'Which god were obelisks dedicated to?',
          options: ['Anubis, god of the dead', 'Sobek, the crocodile god', 'Ra, the sun god', 'Thoth, god of writing'],
          answer: 2,
          why: 'Obelisks were linked to Ra. The gilded tip was meant to catch the first rays of the sun.',
        },
        {
          q: 'Where was this obelisk found?',
          options: ['In pieces at Tanis, in the Nile Delta', 'Buried under the Great Pyramid', 'At the bottom of the Red Sea', 'In a palace in Rome'],
          answer: 0,
          why: 'It lay broken at Tanis, in the north of Egypt, before it was restored and brought here.',
        },
        {
          q: 'Which city has an obelisk called Cleopatra’s Needle beside its river?',
          options: ['Madrid', 'Berlin', 'Tokyo', 'London'],
          answer: 3,
          why: 'Cleopatra’s Needle has stood on the Victoria Embankment by the Thames since 1878. It is far older than Cleopatra.',
        },
      ],
      guide:
        'The hanging obelisk of Ramesses II in the GEM entrance plaza. Granite, about 14 to 16 m tall, about 87 to 90 tonnes, found broken at Tanis (San el-Hagar) in the Delta, restored and raised on a stand so visitors can walk under it and see the cartouche of Ramesses II carved on the underside of its base. Described as the world’s first hanging obelisk.',
    },
    {
      id: 'ramesses',
      title: 'Ramesses the Great',
      where: 'The Grand Hall, just inside',
      stamp: '𓇳',
      photos: ['ramessesFull', 'atriumWide', 'ramessesPyramid', 'ramessesRelief', 'entrance'],
      intro: 'Meet the pharaoh who wanted everyone to remember him. It worked.',
      story: [
        'This statue of Ramesses II is 11 metres tall, about the height of a three-storey house, and weighs 83 tonnes. It is carved from red granite and is more than 3,200 years old.',
        'Ramesses ruled Egypt for about 66 years. He built enormous temples, like Abu Simbel, put up statues of himself all over the country, and had well over 100 children.',
        'He fought the Hittites at the Battle of Kadesh, and years later signed one of the first peace treaties in history with them.',
        'The statue has been on quite a journey. It was found in pieces near Memphis, Egypt’s ancient capital, then stood in a busy square in central Cairo for about 50 years. In 2006 it was driven slowly through the city at night to the museum, and in 2018 it was moved into this hall.',
      ],
      lookFor: [
        'The small royal woman carved beside his leg',
        'Cartouches with his name carved on the statue',
        'The people at his feet, for scale',
      ],
      facts: [
        'His name means “Ra is the one who bore him”.',
        'Ramesses’ own mummy is in Cairo too, at the National Museum of Egyptian Civilization. It was moved there in a royal parade in 2021.',
      ],
      quest: {
        title: 'Giant for scale',
        ask: 'Get the whole of Ramesses in one photo, with one of you standing in front so we can see how big he is.',
        hint: 'Walk well back across the hall before you take it.',
        target: 'A colossal standing statue of a pharaoh in a large hall: the Ramesses II colossus in the GEM Grand Hall.',
      },
      quiz: [
        {
          q: 'About how long did Ramesses II rule Egypt?',
          options: ['10 years', '25 years', 'About 66 years', '100 years'],
          answer: 2,
          why: 'About 66 years. Most Egyptians alive when he died had never known another king.',
        },
        {
          q: 'Who did Ramesses fight at Kadesh, and later make peace with?',
          options: ['The Romans', 'The Hittites', 'The Vikings', 'The Greeks'],
          answer: 1,
          why: 'The Hittites, from what is now Turkey. Their peace treaty is one of the oldest known.',
        },
        {
          q: 'Where did this statue stand for about 50 years before the museum?',
          options: ['In a busy square in central Cairo', 'On top of the Great Pyramid', 'On a boat on the Nile', 'In the British Museum'],
          answer: 0,
          why: 'It stood in Ramses Square, by Cairo’s main railway station, until 2006.',
          photo: 'ramessesFull',
        },
        {
          q: 'Roughly how tall is the statue?',
          options: ['2 metres', '11 metres', '30 metres', '50 metres'],
          answer: 1,
          why: '11 metres, and 83 tonnes of granite.',
        },
      ],
      guide:
        'The colossal red granite statue of Ramesses II in the GEM Grand Hall (atrium): 11 m, 83 tonnes, over 3,200 years old. Found in pieces near Memphis (Mit Rahina), stood in Ramses Square in Cairo from 1955, moved to the GEM site in 2006 and into the Grand Hall in 2018. A small figure of a royal woman, usually identified as his daughter Bintanath, is carved by his leg.',
    },
    {
      id: 'staircase',
      title: 'The Grand Staircase',
      where: 'Climbing up from the Grand Hall',
      stamp: '𓋹',
      photos: ['stairWide', 'stairSeated', 'stairSphinx', 'stairKing', 'akhenaten', 'stairPyramidion', 'stairGate', 'stairColumns', 'stairPair', 'stairTriad', 'staircaseUp'],
      intro: 'Six storeys of kings, queens and gods. Take your time on the way up.',
      story: [
        'The Grand Staircase climbs six storeys, and every landing is crowded with ancient giants: more than 60 statues, temple gateways, columns and sphinxes.',
        'It is arranged in themes as you climb: how kings wanted to be seen, the houses they built for the gods, kings standing alongside gods, and the journey to eternity.',
        'A statue was not just decoration. Egyptians believed part of a person’s spirit, the ka, could live in a statue of them. That is why kings always look young, calm and strong: this was the version of themselves they wanted to last forever.',
        'Look out for two rule-breakers. Hatshepsut was a woman who ruled as pharaoh, and she was shown with a king’s headcloth and false beard. Akhenaten threw out the old gods to worship just one, the Aten, the disc of the sun, and had himself carved with a long face and full lips.',
      ],
      lookFor: [
        'A sphinx: a lion’s body with a king’s head',
        'Hatshepsut, the woman pharaoh',
        'Akhenaten’s long face',
        'A pyramidion, the capstone of a pyramid',
      ],
      facts: [
        'Many experts think Akhenaten was Tutankhamun’s father. DNA tests on royal mummies point that way.',
        'Kings were nearly always shown with a false beard tied on with straps. Even Hatshepsut.',
      ],
      quest: {
        title: 'Sphinx spotter',
        ask: 'Find a sphinx on the staircase and take its photo.',
        hint: 'Look low down. Sphinxes lie down, so they are easy to walk past.',
        target: 'A sphinx statue: a lion’s body with a human (royal) head. Any sphinx counts.',
      },
      quiz: [
        {
          q: 'What was a ka?',
          options: ['A kind of crown', 'Part of a person’s spirit that could live in a statue', 'A sacred cat', 'A boat for the afterlife'],
          answer: 1,
          why: 'The ka was a person’s life force. A statue gave it somewhere to live, which is why so many were made.',
        },
        {
          q: 'Who was Hatshepsut?',
          options: ['A goddess of the Nile', 'Ramesses’ mother', 'A woman who ruled as pharaoh', 'The builder of the pyramids'],
          answer: 2,
          why: 'Hatshepsut ruled for about 20 years, around 3,500 years ago, and was one of Egypt’s most successful pharaohs.',
          photo: 'stairKing',
        },
        {
          q: 'Akhenaten wanted Egypt to worship one god above all. Which?',
          options: ['The Aten, the disc of the sun', 'Osiris', 'Horus', 'Sobek'],
          answer: 0,
          why: 'The Aten. After he died, Egypt went straight back to the old gods.',
          photo: 'akhenaten',
        },
        {
          q: 'What is a sphinx?',
          options: ['A snake with wings', 'A lion with a human head', 'A bird with a lion’s tail', 'A crocodile with a hippo’s head'],
          answer: 1,
          why: 'A lion’s body for strength, with the face of the king.',
          photo: 'stairSphinx',
        },
      ],
      guide:
        'The GEM Grand Staircase: six storeys, more than 60 large objects (statues, sphinxes, columns, temple gateways, a pyramidion), arranged in four themes: Royal Image, Divine Houses, Kings and Gods, Journey to Eternity. Includes a head of Akhenaten and statues of Hatshepsut. A large window at the top looks out at the Giza pyramids.',
    },
    {
      id: 'pyramids',
      title: 'Pyramids Through the Glass',
      where: 'The window at the top of the staircase',
      stamp: '𓉴',
      photos: ['viewWindow', 'viewPanorama', 'viewJars'],
      intro: 'You climbed six storeys. Here is your reward.',
      story: [
        'At the top of the staircase, a huge window frames the pyramids of Giza, about 2 kilometres away. The whole museum was designed around them: its north and south walls line up with the pyramids of Khufu and Menkaure.',
        'The biggest, the Great Pyramid of Khufu, was built around 4,500 years ago. It was about 146 metres tall, and stayed the tallest building humans had made for around 3,800 years.',
        'It is made of about 2.3 million blocks of stone. Archaeologists have found the villages, bakeries and tombs of the people who built it: paid teams of workers, not slaves.',
        'There are three main pyramids at Giza: Khufu’s, his son Khafre’s, and Menkaure’s, the smallest. Khafre’s often looks tallest, but that is a trick. It stands on higher ground.',
      ],
      lookFor: [
        'Which pyramid looks tallest, and why',
        'Smooth casing stones still left near the top of Khafre’s pyramid',
        'The desert plateau stretching away behind',
      ],
      facts: [
        'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.',
        'The pyramids were once covered in smooth white limestone that shone in the sun. Most of it was taken away later to build Cairo.',
      ],
      quest: {
        title: 'Window on the pyramids',
        ask: 'Take a photo of the pyramids through the museum’s window.',
        hint: 'Get close to the glass to cut out the reflections.',
        target: 'The Giza pyramids, ideally seen through a window or from the museum. Any clear view of the pyramids counts.',
      },
      quiz: [
        {
          q: 'About how many stone blocks are in the Great Pyramid?',
          options: ['2,300', '230,000', '2.3 million', '230 million'],
          answer: 2,
          why: 'About 2.3 million, some weighing more than a car.',
        },
        {
          q: 'Who built the pyramids, according to archaeologists?',
          options: ['Paid teams of workers', 'Slaves in chains', 'Roman soldiers', 'Nobody knows at all'],
          answer: 0,
          why: 'Their villages and tombs have been found nearby. They were organised, fed and paid.',
        },
        {
          q: 'For about how long was the Great Pyramid the tallest building in the world?',
          options: ['38 years', '380 years', 'About 3,800 years', 'It still is'],
          answer: 2,
          why: 'About 3,800 years, until a cathedral spire in England beat it in the 1300s.',
        },
        {
          q: 'Cleopatra lived closer in time to…',
          options: ['The building of the Great Pyramid', 'The first Moon landing'],
          answer: 1,
          why: 'The Great Pyramid was about 2,500 years old when Cleopatra was born. The Moon landing came about 2,000 years after her.',
          photo: 'viewPanorama',
        },
      ],
      guide:
        'The view of the Giza pyramids from the window at the top of the GEM Grand Staircase. The museum is about 2 km from the pyramids, and its north and south walls align with the pyramids of Khufu and Menkaure. Great Pyramid: built about 4,500 years ago for Khufu, originally about 146 m, about 2.3 million blocks. Khafre’s pyramid keeps some casing stones near the top and stands on higher ground.',
    },
    {
      id: 'mask',
      title: 'The Boy King’s Golden Mask',
      where: 'The Tutankhamun galleries',
      stamp: '𓂀',
      photos: ['mask', 'tutGallery', 'guardians'],
      intro: 'The most famous face from the ancient world. Look closely.',
      story: [
        'Tutankhamun became king when he was about nine, and died when he was about nineteen, more than 3,300 years ago. He was not a famous king in his own time. What made him famous was his tomb.',
        'Almost every royal tomb was robbed in ancient times. Tutankhamun’s small tomb in the Valley of the Kings was buried under rubble and forgotten, until Howard Carter found its steps in November 1922. Peering in by candlelight, he was asked if he could see anything, and is said to have answered: “Yes, wonderful things!”',
        'The mask covered the head and shoulders of the king’s mummy. It is made of about 10 kilograms of gold, with blue lapis lazuli around the eyes and eyebrows, and coloured glass and stones in the stripes.',
        'On his forehead are a cobra and a vulture: the goddesses of Lower and Upper Egypt, showing he ruled both. A spell from the Book of the Dead is carved on the back to protect him.',
      ],
      lookFor: [
        'The cobra and the vulture on his forehead',
        'The blue stripes of his nemes headcloth',
        'The braided false beard',
        'The spell carved on the back, if you can see it',
      ],
      facts: [
        'In 2014 the beard broke off and was glued back on with the wrong glue. Experts fixed it properly in 2015.',
        'Carter and his team spent about ten years carefully emptying the tomb. Tutankhamun’s mummy is still there, in the Valley of the Kings.',
      ],
      quest: {
        title: 'The golden face',
        ask: 'Take a photo of the gold mask.',
        hint: 'No flash. It is under glass, so get close and tilt the phone to dodge the reflection.',
        target: 'Tutankhamun’s gold funerary mask: a gold face with a blue and gold striped headcloth.',
      },
      quiz: [
        {
          q: 'How old was Tutankhamun when he became king?',
          options: ['About 18', 'About 9', 'About 30', 'About 50'],
          answer: 1,
          why: 'About nine. Older advisers ran the country for him at first.',
        },
        {
          q: 'Who found his tomb in 1922?',
          options: ['Howard Carter', 'Napoleon', 'Jean-François Champollion', 'Agatha Christie'],
          answer: 0,
          why: 'Howard Carter, an English archaeologist, after years of searching the Valley of the Kings.',
          photo: 'guardians',
        },
        {
          q: 'What do the cobra and vulture on his forehead stand for?',
          options: ['Day and night', 'Life and death', 'Lower and Upper Egypt', 'The sun and the moon'],
          answer: 2,
          why: 'The cobra is Wadjet of Lower Egypt, the vulture Nekhbet of Upper Egypt. Together: king of all Egypt.',
          photo: 'mask',
        },
        {
          q: 'What happened to the mask’s beard in 2014?',
          options: ['It was stolen', 'It broke off and was glued back badly', 'It was painted blue', 'Nothing, it never had one'],
          answer: 1,
          why: 'It came off during work on the case and was stuck back with epoxy. A German and Egyptian team fixed it in 2015.',
        },
      ],
      guide:
        'Tutankhamun’s gold funerary mask in the GEM Tutankhamun galleries. Tutankhamun became king at about 9 and died at about 19, around 1323 BC. Tomb KV62 found by Howard Carter in November 1922. Mask: about 10 to 11 kg of gold, lapis lazuli around the eyes and brows, quartz and obsidian eyes, glass and stone inlay; cobra (Wadjet) and vulture (Nekhbet) on the brow; Book of the Dead spell on the back. Beard broke off in 2014, glued badly, properly restored in 2015.',
    },
    {
      id: 'treasures',
      title: 'Treasures from the Tomb',
      where: 'The Tutankhamun galleries',
      stamp: '𓆣',
      photos: ['tutGallery', 'throne', 'chariot', 'anubis', 'guardians', 'canopicShrine', 'canopicChest', 'beds', 'vase', 'ibex', 'cowHead', 'bracelet', 'boxes'],
      intro: 'He packed for the afterlife. Everything he might need, he took.',
      story: [
        'For the first time ever, all of Tutankhamun’s treasures are on show together: more than 5,000 objects, from a tomb of just four small rooms.',
        'Two life-size guardian statues stood either side of the sealed door to his burial chamber. Behind it, four golden shrines nested inside each other, like Russian dolls, around his stone sarcophagus and three coffins. The innermost coffin is solid gold and weighs about 110 kilograms.',
        'He packed for the afterlife: six chariots, beds, chests of clothes, board games, jewellery, perfume jars, and a golden throne showing his wife Ankhesenamun gently touching his shoulder.',
        'Look out for his dagger. Its blade is iron that came from a meteorite: metal that fell from space.',
      ],
      lookFor: [
        'The golden throne: find the queen’s hand on his shoulder',
        'A chariot',
        'Anubis, the black jackal',
        'The canopic chest, with its four compartments',
      ],
      facts: [
        'Canopic jars held the king’s liver, lungs, stomach and intestines. The heart was usually left in the body, to be weighed in the afterlife.',
        'The Anubis statue was found lying on a shrine at the door of the treasury, facing out, as if on guard.',
      ],
      quest: {
        title: 'Fit for a king',
        ask: 'Find the golden throne and photograph it. If it is too busy, one of the chariots counts.',
        hint: 'The throne’s back shows the king and queen under the rays of the sun.',
        target:
          'Tutankhamun’s golden throne (a gilded chair with lion legs and a king and queen scene on the back), or one of his chariots. Another clearly identifiable treasure from Tutankhamun’s tomb is worth a medium-confidence yes.',
      },
      quiz: [
        {
          q: 'What is Tutankhamun’s dagger blade made of?',
          options: ['Solid gold', 'Bronze from Cyprus', 'Iron from a meteorite', 'Crystal'],
          answer: 2,
          why: 'Tests in 2016 found nickel and cobalt in the iron that only meteorites have.',
        },
        {
          q: 'What did canopic jars hold?',
          options: ['The king’s organs', 'Perfume', 'Grain for the afterlife', 'Ink for writing'],
          answer: 0,
          why: 'The liver, lungs, stomach and intestines, each protected by its own god.',
          photo: 'canopicChest',
        },
        {
          q: 'Which jackal god guarded the treasury?',
          options: ['Bastet', 'Anubis', 'Horus', 'Sobek'],
          answer: 1,
          why: 'Anubis, the god of mummification, who looked after the dead.',
          photo: 'anubis',
        },
        {
          q: 'About how many objects came out of his tomb?',
          options: ['About 50', 'About 500', 'More than 5,000', 'About 50,000'],
          answer: 2,
          why: 'More than 5,000, all of them now in these galleries.',
        },
        {
          q: 'Who is shown touching the king’s shoulder on his golden throne?',
          options: ['His wife, Ankhesenamun', 'His mother', 'Anubis', 'Howard Carter'],
          answer: 0,
          why: 'His wife and half-sister, Ankhesenamun, under the rays of the Aten sun disc.',
          photo: 'throne',
        },
      ],
      guide:
        'The Tutankhamun galleries at the GEM: the complete collection of more than 5,000 objects (5,398 is the figure usually given) shown together for the first time. Tomb KV62 had four rooms: antechamber, annexe, burial chamber, treasury. Includes the golden throne (king and Ankhesenamun under the Aten), six chariots, two life-size guardian (ka) statues, four gilded shrines, the solid gold inner coffin (about 110 kg), the Anubis shrine, the calcite canopic chest, ritual beds, calcite vessels, jewellery, and the meteoric-iron dagger.',
    },
    {
      id: 'boat',
      title: 'Khufu’s Boat for the Afterlife',
      where: 'The Khufu Boats Museum',
      stamp: '𓊛',
      photos: ['boatSide', 'boatProw', 'boatDeck', 'boatFront', 'boatMarks', 'boatRopes'],
      intro: 'One of the oldest boats on Earth, and the biggest puzzle in the museum.',
      story: [
        'This boat is around 4,500 years old. It was built for King Khufu, the pharaoh of the Great Pyramid.',
        'In 1954 archaeologists found it taken apart, its pieces stacked in a sealed pit beside the pyramid. Putting it back together took years of puzzle-solving, helped by builders’ marks painted on the timbers to show which part went where.',
        'It is about 43 metres long and made mostly of cedar wood from Lebanon. There are no nails at all: the planks were tied together with ropes.',
        'Nobody knows for sure what it was for. It may have carried Khufu’s body to his funeral, or been meant for his journey across the sky with the sun god Ra. A second boat, found in another pit nearby, is being rebuilt here in front of visitors.',
      ],
      lookFor: [
        'The tall curved prow and stern, shaped like papyrus bundles',
        'The cabin on the deck',
        'The long oars',
        'The second boat being rebuilt',
      ],
      facts: [
        'The first boat came out of its pit in more than 1,200 pieces.',
        'The second boat has about 1,650 pieces, and rebuilding it in public began in December 2025.',
      ],
      quest: {
        title: 'Ship shape',
        ask: 'Take a photo of the boat’s tall curved prow.',
        hint: 'The walkways go up high. Try photographing it from above.',
        target: 'An ancient wooden boat: Khufu’s boat at the GEM. Any photo of the boat, or of the second boat being rebuilt, counts.',
      },
      quiz: [
        {
          q: 'How are the boat’s planks held together?',
          options: ['Iron nails', 'Tied with ropes', 'Superglue', 'Gold rivets'],
          answer: 1,
          why: 'Ropes, threaded through the wood and pulled tight.',
          photo: 'boatRopes',
        },
        {
          q: 'Which pharaoh was the boat built for?',
          options: ['Tutankhamun', 'Ramesses II', 'Khufu', 'Cleopatra'],
          answer: 2,
          why: 'Khufu, who built the Great Pyramid.',
        },
        {
          q: 'Where was it found?',
          options: ['In a sealed pit beside the Great Pyramid', 'At the bottom of the Nile', 'In Tutankhamun’s tomb', 'In a desert cave'],
          answer: 0,
          why: 'In a pit at the foot of the Great Pyramid, in 1954.',
        },
        {
          q: 'What wood is it mostly made of?',
          options: ['Oak from England', 'Bamboo', 'Palm trunks', 'Cedar from Lebanon'],
          answer: 3,
          why: 'Cedar, brought from Lebanon. Egypt had no tall, straight trees of its own.',
        },
      ],
      guide:
        'Khufu’s boat (solar boat) in the Khufu Boats Museum at the GEM. About 4,500 years old, about 43 m long, mostly Lebanese cedar, planks lashed with rope, no nails. Found dismantled in a sealed pit beside the Great Pyramid in 1954; reassembled from over 1,200 pieces; moved to the GEM in August 2021. A second boat from a neighbouring pit (about 1,650 pieces) has been reassembled in public view since December 2025. Purpose uncertain: a funeral barge or a boat for the king’s journey with Ra.',
    },
    {
      id: 'galleries',
      title: 'Through the Ages',
      where: 'The main galleries',
      stamp: '𓅃',
      photos: ['galleryPainted', 'coffins', 'galleryPair', 'galleryHead', 'galleryStanding', 'ptolemy'],
      intro: 'Three thousand years of Egypt in twelve galleries. Pick a god and go.',
      story: [
        'The twelve main galleries walk you through ancient Egypt in order, from the first farmers and kings to the time of the Romans.',
        'Each period is shown three ways: how ordinary people lived, how kings ruled, and what Egyptians believed.',
        'Gods were often shown with animal heads, a clue to their powers: Horus the falcon (the sky, and the king), Anubis the jackal (mummies and the dead), Thoth the ibis (writing and wisdom), Sobek the crocodile (the Nile) and Bastet the cat (home and protection).',
        'Near the end come the Ptolemies: Greek kings who ruled Egypt as pharaohs after Alexander the Great. The last of them was Cleopatra.',
      ],
      lookFor: [
        'A god with an animal head',
        'A painted coffin covered in spells',
        'A husband and wife carved together',
        'A Greek king dressed as a pharaoh',
      ],
      facts: [
        'Egyptians mummified animals too: cats, ibises, crocodiles, and millions of birds.',
        'Ancient writers say Cleopatra was the first of her Greek royal family to learn the Egyptian language.',
      ],
      quest: {
        title: 'Name that god',
        ask: 'Find a god with an animal head and take its photo. The guide will tell you who it is.',
        hint: 'Coffins and wall carvings are full of them, not just statues.',
        target:
          'A statue, carving or painting of an Egyptian god or goddess with an animal head or in animal form. Say which god it most likely is.',
      },
      quiz: [
        {
          q: 'Anubis has the head of which animal?',
          options: ['A cat', 'A falcon', 'A jackal', 'A crocodile'],
          answer: 2,
          why: 'A jackal. Jackals prowled around desert cemeteries, so Egyptians made one their protector of the dead.',
        },
        {
          q: 'Thoth, god of writing, is shown as which bird?',
          options: ['An ibis', 'An owl', 'A swan', 'A parrot'],
          answer: 0,
          why: 'An ibis, with its long curved beak, a bit like a scribe’s reed pen.',
        },
        {
          q: 'Who was the last of the Ptolemy family to rule Egypt?',
          options: ['Nefertiti', 'Hatshepsut', 'Tutankhamun', 'Cleopatra'],
          answer: 3,
          why: 'Cleopatra VII. After her death in 30 BC, Egypt became part of the Roman Empire.',
          photo: 'ptolemy',
        },
        {
          q: 'Which three things does each period of the galleries show?',
          options: ['Food, fashion and football', 'Society, kingship and beliefs', 'War, weather and wealth', 'Gods, ghosts and gold'],
          answer: 1,
          why: 'How people lived, how they were ruled, and what they believed.',
        },
      ],
      guide:
        'The twelve GEM main galleries, in chronological order from prehistory to the Greek and Roman periods (roughly 3100 BC to AD 400), each period shown under three themes: society, kingship and beliefs. Includes painted coffins, pair statues, royal heads, and reliefs from the Ptolemaic period (for example Ptolemy IX).',
    },
    {
      id: 'cartouche',
      title: 'Write Like a Pharaoh',
      where: 'Anywhere, any time',
      stamp: '𓍷',
      kind: 'cartouche',
      photos: ['cartoucheRelief', 'cartoucheKarnak'],
      intro: 'Every pharaoh’s name sits inside a cartouche. Now yours can.',
      story: [
        'A cartouche is the oval loop drawn around a royal name. It is a rope tied at one end, a magic circle protecting the name inside.',
        'Hieroglyphs mix sounds and pictures. Some signs stand for a single sound, like our letters: a vulture for “a”, a foot for “b”, an owl for “m”. Others stand for whole words or ideas.',
        'For about 1,400 years nobody could read them. Then the Rosetta Stone, carved with the same message in hieroglyphs, a later Egyptian script and Greek, helped Jean-François Champollion crack the code in 1822. The Rosetta Stone itself is in the British Museum, in London.',
        'Egyptian writing left out most vowels, so modern names are spelt by sound. Try yours below.',
      ],
      lookFor: [
        'A cartouche anywhere in the museum',
        'An owl hieroglyph, the sound “m”',
        'A vulture hieroglyph, the sound “a”',
      ],
      facts: [
        'Hieroglyphs can be written left to right, right to left, or top to bottom. The animals face the start of the line.',
        'A pharaoh had five official names. Two of them were written in cartouches.',
      ],
      quest: {
        title: 'Read the royal name',
        ask: 'Find any cartouche in the museum and take its photo. The guide will try to read the name.',
        hint: 'Obelisks, statues and coffins are covered in them.',
        target: 'A cartouche: an oval ring enclosing hieroglyphs. If possible, say whose name it is.',
      },
      quiz: [
        {
          q: 'What is a cartouche?',
          options: ['A kind of chariot', 'An oval loop around a royal name', 'A pharaoh’s sandal', 'A mummy’s bandage'],
          answer: 1,
          why: 'A loop of rope, tied at the end, wrapped around a king’s or queen’s name to protect it.',
          photo: 'cartoucheRelief',
        },
        {
          q: 'Which stone helped crack hieroglyphs?',
          options: ['The Blarney Stone', 'The Moonstone', 'The Rosetta Stone', 'The Stone of Scone'],
          answer: 2,
          why: 'The Rosetta Stone had the same text in Greek, which scholars could read, and in hieroglyphs.',
        },
        {
          q: 'Where is the Rosetta Stone now?',
          options: ['The British Museum in London', 'The Grand Egyptian Museum', 'The Louvre in Paris', 'Still buried at Rosetta'],
          answer: 0,
          why: 'It has been in the British Museum since 1802. Egypt has asked for it back.',
        },
        {
          q: 'Which hieroglyph makes the sound “m”?',
          options: ['A lion', 'A foot', 'A snake', 'An owl'],
          answer: 3,
          why: 'The owl. The lion is “l”, the foot is “b” and the horned snake is “f”.',
        },
      ],
      guide:
        'Cartouches and hieroglyphs. A cartouche is an oval rope loop around a royal name. Uniliteral signs work like an alphabet (vulture a, foot b, owl m, water n, mouth r, folded cloth s, bread loaf t, quail chick w, and so on). The Rosetta Stone (hieroglyphic, Demotic and Greek) let Champollion decipher hieroglyphs in 1822; it is in the British Museum.',
    },
  ],
};
