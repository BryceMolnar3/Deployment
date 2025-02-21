import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import NavigationBar from '../../components/NavigationBar.tsx';

interface LocationState {
  verseNumber: number;
  verseText: string;
}

interface Manuscript {
  verse_number: number;
  verse_text: string;
}

interface ManuscriptCollection {
  [sigla: string]: Manuscript[];
}

const manuscripts: ManuscriptCollection = {
  "01": [
    {
      verse_number: 1,
      verse_text: "Paulus apostolus non ab hominibus. Neque per hominem sed perih(esu)m χρ(istu)m. Fratribus qui sunt laodiciae."
    },
    {
      verse_number: 2, 
      verse_text: "Gratia vobis es pax a d(e)o patre et d(omi)no Ih(es)u χρ(ist)o."
    },
    {
      verse_number: 3,
      verse_text: "Gratias ago χρ(ist)o per omnem orationem mea(m). Quod permanentes estis in eo et perseuerantes in operibus eius promissum expectantes in diem iudicii."
    },
    {
      verse_number: 4,
      verse_text: "Neque destituant vos quorundam vaniloquia insinuantium. Ut vis evertant a veritate euangelii quod a me praedicatur."
    },
    {
      verse_number: 5,
      verse_text: "Et nunc faciet d(eu)s ut qui sunt ex me ad profectum veritatis euangelii deseruientes. Et facientes benignitatem. operumque salutis vitae aeternae."
    },
    {
      verse_number: 6,
      verse_text: "Et nunc palam sunt vincula mea quae patior in χρ(ist)o. quibus laetor et gaudeo."
    },
    {
      verse_number: 7,
      verse_text: "Et hoc mihi est ad salutem per petua(m). quod ipsum factum orationib(us) vestris. Et administrantem sp(iritu)m s(an)c(tu)m sive per vitam sive per mortem."
    },
    {
      verse_number: 8,
      verse_text: "Est enim mihi vere vita in χρ(ist)o et mori gaudium."
    },
    {
      verse_number: 9,
      verse_text: "Et in ipsum in vobis faciet misercordiam suam. Ut eandem dilectionem habeatis. et sitis unianimes."
    },
    {
      verse_number: 10,
      verse_text: "Ergo dilectissimi ut audistis praesentia mei. Ita retinete et facite in timore d(e)i et erit vobis vita in aeternum."
    },
    {
      verse_number: 11,
      verse_text: "Est eni(m) d(eu)s qui operatur in vos"
    },
    {
      verse_number: 12,
      verse_text: "et facite sine retractu quaecumque facitis"
    },
    {
      verse_number: 13,
      verse_text: "et quod est dilectissimi gaudete in χρ(ist)o et praecauete sordidos in lucro"
    },
    {
      verse_number: 14,
      verse_text: "omnes sint petitiones vestrae palam aput d(eu)m. et estote firmi in sensu χρ(ist)i"
    },
    {
      verse_number: 15,
      verse_text: "et quae integra et vera et pudica et iusta et amabilia facite"
    },
    {
      verse_number: 16,
      verse_text: "et quae audistis. et accepistis. in corde retinete et erit vobis pax"
    },
    {
      verse_number: 17,
      verse_text: "Salutant vos s(an)c(t)i"
    },
    {
      verse_number: 18,
      verse_text: "Gratia d(omi)ni ih(es)u cum sp(irit)u vestro"
    },
    {
      verse_number: 19,
      verse_text: "et facite legi colosensium vobis."
    }
  ],
  "02": [
    {
      verse_number: 1,
      verse_text: "Paulus apostolus non ab hominibus neque per hominem sed per ihesum christum fratribus qui sunt laodiciae."
    },
    {
      verse_number: 2,
      verse_text: "Gratia vobis et pax a deo patre et domino ihesu christo."
    },
    {
      verse_number: 3,
      verse_text: "Gratias ago christo per omnem orationem meam quod permanentes estis in eo et perseverantes in operibus bonis promissum expectantes in die iudicii."
    },
    {
      verse_number: 4,
      verse_text: "Nec destituant vos quorundam vaniloquentia insinuantium ut vos avertant a veritate evangelii quod a me predicatur."
    }
  ],
  "03": [
    {
      verse_number: 1,
      verse_text: "Paulus apostolus non per homines neque per hominem sed per iesum christum fratribus qui sunt in laodicia."
    },
    {
      verse_number: 2,
      verse_text: "Gratia vobis pax a deo patre nostro et domino iesu christo."
    },
    {
      verse_number: 3,
      verse_text: "Gratias ago deo per omnem orationem meam quod estis permanentes in eo et perseverantes in operibus eius promissum expectantes in diem iudicii."
    },
    {
      verse_number: 4,
      verse_text: "Ne destituat vos quorundam vaniloquium insinuantium ut vos avertant a veritate evangelii quod a me praedicatum est."
    }
  ]
};

function VerseId() {
  const location = useLocation();
  const { verseNumber, verseText } = location.state as LocationState;

  return (
    <Box>
      <NavigationBar />
      <Box bg="navy" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Verse View</Heading>
        </Box>
      <Box p={6} ml={8}>
        <Heading size="lg" mb={4}>Verse {verseNumber}</Heading>
        {Object.entries(manuscripts).map(([manuscriptId, verses]) => {
          const verse = verses.find(v => v.verse_number === verseNumber);
          return (
            <Box key={manuscriptId} mb={6}>
              <Flex ml={6}>
                <Heading size="md" mb={2}>{manuscriptId}</Heading>
                <Text fontSize="lg" ml={4}>{verse?.verse_text}</Text>
              </Flex>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default VerseId;
