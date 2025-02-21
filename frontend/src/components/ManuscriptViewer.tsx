import React from 'react';
import { Box, Flex, Heading, Text, Image, VStack } from '@chakra-ui/react';
import NavigationBar from './NavigationBar.tsx';
import { useNavigate, useLocation } from 'react-router-dom';

interface Manuscript {
  ms_id: string;
  sigla: string;
  other_names: string;
  total_folia: number;
  laod_folia: string;
  dimensions: string;
  place_of_origin: string;
  materials: string;
  format_description: string;
  date: string;
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
}

function ManuscriptViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const manuscriptId = location.state?.manuscriptId || null; // null if no state

  interface ManuscriptCollection {
    [sigla: string]: Manuscript;
  }

  const manuscripts: ManuscriptCollection = {
    "01": {
      ms_id: "Fulda, Hochschul- und Landesbibliothek, Bonifatianus 1",
      sigla: "01",
      other_names: "Codex Fuldensis",
      total_folia: 1018,
      laod_folia: "316v-317v",
      dimensions: "15×6×5 in",
      place_of_origin: "Capua, Northern Italy", 
      materials: "Parchment",
      format_description: "Single Column",
      date: "541-546",
      verses: [
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
      ]
    },
    "02": {
      ms_id: "Vatican Library, Codex Vaticanus",
      sigla: "02", 
      other_names: "Codex B",
      total_folia: 759,
      laod_folia: "214r-215v",
      dimensions: "27×27 cm",
      place_of_origin: "Rome",
      materials: "Vellum",
      format_description: "Three Columns",
      date: "325-350",
      verses: [
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
      ]
    },
    "03": {
      ms_id: "British Library, Royal MS",
      sigla: "03",
      other_names: "Codex Alexandrinus",
      total_folia: 773,
      laod_folia: "156r-157r",
      dimensions: "32×26 cm", 
      place_of_origin: "Alexandria, Egypt",
      materials: "Parchment",
      format_description: "Two Columns",
      date: "400-440",
      verses: [
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
    }
  };

  return (
    <Box>
      <NavigationBar />

      <Box>
        <Box bg="navy" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manuscript View</Heading>
        </Box>

        <Box ml={8} p={6}>
          <Flex gap={12}>
            <Box flex={2} maxW="65%">
              <Flex mb={6}>
                <Text fontSize="lg" fontWeight="normal" w="180px">MS ID:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1}><u>{manuscripts[manuscriptId].ms_id}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8}>Sigla: <u>{manuscripts[manuscriptId].sigla}</u></Text>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Other Names:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].other_names}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Total Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].total_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Laod. Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].laod_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Dimensions:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].dimensions}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Place of Origin:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].place_of_origin}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Materials:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].materials}</u></Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text fontSize="lg" fontWeight="normal" w="180px">Format Description:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1}><u>{manuscripts[manuscriptId].format_description}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8}>Date: <u>{manuscripts[manuscriptId].date}</u></Text>
              </Flex>

              <Box 
                border="1px solid" 
                borderColor="gray.300" 
                borderRadius="md"
                p={4}
                height="500px"
                overflowY="auto"
                bg="white"
              >
                <Text whiteSpace="pre-line" fontWeight="normal">
                  {manuscripts[manuscriptId].verses.map(verse => (
                    <React.Fragment key={verse.verse_number}>
                      <Text>
                        <sup>
                          <Text
                            as="span" 
                            cursor="pointer"
                            color="blue.600"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={function() {
                              navigate(`/verse/${verse.verse_number}`, {
                                state: { 
                                  verseNumber: verse.verse_number,
                                  verseText: verse.verse_text
                                }
                              });
                            }}
                          >
                            {verse.verse_number}
                          </Text>
                        </sup>
                        {verse.verse_text}
                      </Text>
                      <br/>
                    </React.Fragment>
                  ))}
                </Text>
              </Box>
            </Box>

            <Box flex={1} display="flex" justifyContent="flex-start">
              <Image 
                src="/images/manuscript-image.png" 
                alt="Manuscript page"
                maxH="900px"
                objectFit="contain"
                border="1px solid"
                borderColor="gray.300"
              />
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

export default ManuscriptViewer; 