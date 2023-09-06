import React, { useCallback, useEffect, useRef, useState, FC } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useTailwind } from "tailwind-rn";
import { AntDesign, Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from 'services/context/UserContext';
import { Token } from "models/Token";
import Modal from 'react-native-modal';
import CustomHeaderInGame from 'components/header/CustomHeaderInGame';
import { ErrorDetail } from "models/ErrorDetail";
import { getTextWithTokens } from "services/api/texts";
import { TextWithTokens } from "interfaces/TextWithTokens";
import { checkUserSelectionPlausibility } from "utils/gameFunctions";

const colors = [
  "bg-yellow-300",
  "bg-green-300",
  "bg-indigo-300",
  "bg-pink-300",
];


interface ModalPlausibilityGameDetailedProps {
  isVisible: boolean;
  closeModal: () => void;
  setIsModalVisible: (isVisible: boolean) => void;
  setHighlightEnabled: (highlight: boolean) => void;
}


const PlausibilityGameDetailedScreen = () => {
  const tw = useTailwind();
  const { incrementPoints } = useUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [errorSpecifying, setErrorSpecifying] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSelectionStarted, setSelectionStarted] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetail[]>([]);
  const [nextId, setNextId] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const window = Dimensions.get('window');
  const isMobile = window.width < 795;
  const { user } = useUser();
  const [text, setText] = useState<TextWithTokens>();
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [noMoreTexts, setNoMoreTexts] = useState(false);
  const [userRateSelected, setUserRateSelected] = useState(0);

  useEffect(() => {
    if (!text && user) {
      const fetchText = async () => {
        try {
          const response = await getTextWithTokens(user.id, 'plausibility');
          setText(response);
        } catch (error) {
          console.error(error);
        }
      };
      fetchText();
    }
  }, [text, user]);

  const HighlightedWord = ({ token, index }: { token: Token; index: number }) => {
    const isSelected = selectedWords.includes(index);
    return (
      <TouchableOpacity
        onPress={showMessage ? undefined : () => onTokenPress(index)}
        style={tw(
          `m-0 p-[2px] ${token.isCurrentSelection ? token.color : token.isSelected ? getErrorColor(token.sentenceId) : "bg-transparent"}`
        )}
      >
        <Text
          style={[
            tw("text-2xl font-secondary text-gray-800"),
            token.color ? tw(token.color) : null
          ]}
        >
          {token.content}
        </Text>
      </TouchableOpacity>
    );
  };

  const addErrorDetail = () => {
    setSelectionStarted(false);
    if (!text) return;

    const selectedTokens = text.tokens.filter(token => token.isCurrentSelection);
    selectedTokens.forEach(token => {
      token.sentenceId = nextId;
      token.isSelected = true;
      token.isCurrentSelection = false;
      delete token.color;
    });

    const wordPositions = selectedTokens.map(token => token.position).join(', ');
    setErrorDetails([...errorDetails, {
      id: nextId,
      content: selectedTokens.map(token => token.content).join(' '),
      word_positions: wordPositions,
      color: colors[colorIndex]
    }]);

    setNextId(nextId + 1);
    setColorIndex((colorIndex + 1) % colors.length);
  };


  const getErrorColor = (sentenceId: any) => {
    if (sentenceId === null) {
      return "bg-transparent";
    }
    const sentence = errorDetails.find(spec => spec.id === sentenceId);
    return sentence ? sentence.color : "bg-transparent";
  };

  const onTokenPress = (wordIndex: number) => {
    if (!highlightEnabled) return;
    setText(currentText => {
      if (!currentText) return currentText;

      const newTokens = [...currentText.tokens];
      const token = newTokens[wordIndex];
      token.isCurrentSelection = !token.isCurrentSelection;

      if (token.isCurrentSelection) {
        token.color = 'bg-blue-200';
      } else {
        delete token.color;
      }

      const anyTokenSelected = newTokens.some(t => t.isCurrentSelection);
      setSelectionStarted(anyTokenSelected);
      return { ...currentText, tokens: newTokens };
    });
  };

  //Modal
  const ModalPlausibilityGameDetailed: FC<ModalPlausibilityGameDetailedProps> = ({ isVisible, closeModal, setIsModalVisible, setHighlightEnabled }) => {
    const tw = useTailwind();
    return (
      <Modal
        isVisible={isVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        backdropColor="transparent"
        style={tw("items-center justify-center")}
      >
        <View style={[tw("bg-white rounded-lg p-4 flex-row mb-14"), {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 3,
        }]}>
          <>
            <TouchableOpacity
              style={tw("bg-orange-100 p-3 mr-3 rounded-lg")}
              onPress={() => {
                setIsModalVisible(false);
                setHighlightEnabled(true);
                setErrorSpecifying(true);
              }}
            >
              <Text style={tw(" text-orange-500 font-semibold")}>Source du doute</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw("bg-green-200 p-3 rounded-lg")}
              onPress={() => {
                setIsModalVisible(false);
                onNextCard();
              }}
            >
              <Text style={tw("text-green-700 font-semibold")}>Aller au texte suivant</Text>
            </TouchableOpacity>
          </>
        </View>
      </Modal>
    );
  };
  //finmodal

  const renderErrorDetail = (errorDetail: ErrorDetail) => (
    <View key={errorDetail.id} style={tw(`flex-row items-center m-1 max-w-[400px] ml-9`)}>
      {errorDetail.content ? (
        <View style={tw("flex-shrink")}>
          <Text style={tw(`text-lg mr-2 ${errorDetail.color ? errorDetail.color : ''} font-primary`)}>{errorDetail.content}</Text>
        </View>
      ) : (
        <Text style={tw("text-lg mr-2")}>Contenu vide</Text>
      )}
      <TouchableOpacity onPress={() => removeErrorDetail(errorDetail.id)}>
        <Entypo name="cross" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  const fetchTextFromAPI = async () => {
    try {
      if (user) {
        const response = await getTextWithTokens(user?.id, 'plausibility');
        if (response === null || response.tokens.length === 0) {
          setNoMoreTexts(true);
          return;
        }

        setText(response);
        setNoMoreTexts(false);
      }
    } catch (error) {
      console.error(error);
    }
  };


  const removeErrorDetail = (errorDetailId: number) => {
    setErrorDetails(errorDetails.filter(errorDetail => errorDetail.id !== errorDetailId));
  };

  // TODO Séparer dans d'autres fichiers pour plus de visibilité
  const renderText = (text: TextWithTokens) => {
    if (!text) return null;

    return (
      <SafeAreaView style={tw("flex-1 bg-white")}>
        <View
          style={[
            tw("bg-[#FFFEE0] rounded-xl justify-center mx-2 mt-4 lg:mt-8 xl:mt-12"),
            {
              minHeight: 300,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}
        >
          <View style={tw("flex-row flex-wrap mb-2 m-7")}>
            {text.tokens.map((token: Token, idx: number) => (
              <HighlightedWord token={token} index={idx} key={idx} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const updateTokensColor = (text: TextWithTokens, positions: number[]) => {
    const newTokens = [...text.tokens];
    newTokens.forEach((token, index) => {
      if (positions.includes(index + 1)) {
        token.color = 'text-red-500';
      }
    });
    return { ...text, tokens: newTokens };
  };


  const goToNextSentence = async () => {
    setErrorDetails([]);
    setShowMessage(false);
    setMessageContent("");
    setErrorSpecifying(false);
    setHighlightEnabled(false);
    await fetchTextFromAPI();
  };

  const onNextCard = async () => {
    if (text?.is_plausibility_test) {
      const checkResult = await checkUserSelectionPlausibility(text.id, errorDetails, userRateSelected);
      console.log(checkResult);

      if (!checkResult.isValid) {
        const correctSpecification = checkResult.testPlausibilityError.map(spec => `• ${spec.content}`).join('\n');
        const allPositions = checkResult.testPlausibilityError.flatMap(spec => spec.word_positions.split(', ').map(pos => parseInt(pos)));
        setText(currentText => {
          if (!currentText) return currentText;
          return updateTokensColor(currentText, allPositions);
        });

        let messageHeader;
        if (checkResult.testPlausibilityError.length > 0) {
          messageHeader = "Oups, raté! Voilà les erreurs qu'il fallait trouver :";
        } else {
          messageHeader = "Oh non, il n'y avait rien à trouver ici";
        }
        setMessageContent(`${messageHeader}\n${correctSpecification}`);
        setShowMessage(true);
        setSelectionStarted(false);
        return;
      } else {
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
        setTimeout(() => {
          incrementPoints(5);
        }, 100);
      }
    } else {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      setTimeout(() => {
        incrementPoints(10);
      }, 100);
    }
    for (let errorDetail of errorDetails) {
      const { id, ...rest } = errorDetail;
      // await createUsererrorDetails(rest);
    }
    goToNextSentence();
  };


  return (
    <SafeAreaView style={tw("flex-1 bg-white")}>
      <ScrollView ref={scrollViewRef}>
        <CustomHeaderInGame title="Plausibilité de textes" />

        {noMoreTexts ? (
          <View style={tw('items-center justify-center mt-4')}>
            <Text style={tw('text-lg text-red-500')}>Plus de texte pour le moment. Reviens plus tard.</Text>
          </View>
        ) : (
          <SafeAreaView>

            <View style={tw("flex-1 mb-2")}>
              {text && renderText(text)}
            </View>
            <View style={tw("mx-4 mt-2 mb-2")}>
              {errorDetails.map(errorDetail => renderErrorDetail(errorDetail)
              )}
            </View>

          </SafeAreaView>
        )}
      </ScrollView>

      <ModalPlausibilityGameDetailed
        isVisible={isModalVisible}
        closeModal={() => setIsModalVisible(false)}
        setIsModalVisible={setIsModalVisible}
        setHighlightEnabled={setHighlightEnabled}
      />

      {errorSpecifying ? (
        <SafeAreaView>
          <View style={tw('absolute bottom-3 left-4 flex-col')}>
            {errorDetails.length > 0 && (
              <TouchableOpacity
                style={[
                  tw('w-8  bg-blue-500 rounded-full justify-center items-center'),
                ]}
                onPress={() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }}
              >
                <MaterialIcons name="arrow-downward" size={25} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <View style={tw('absolute bottom-3 right-4 flex-col w-52')}>
            {isSelectionStarted &&
              <TouchableOpacity
                key={"add"}
                style={tw(`px-2 items-center flex-row justify-center rounded-full h-12 mx-2 mb-1 ${isSelectionStarted ? 'bg-blue-500' : 'bg-blue-50'}`)}
                onPress={() => {
                  addErrorDetail();
                }}
                disabled={!isSelectionStarted}
              >
                <MaterialIcons name="add" size={22} color="white" />
                <Text style={tw("text-white font-primary text-lg")}>Valider la sélection</Text>
              </TouchableOpacity>
            }

            {!showMessage &&
              <TouchableOpacity
                key={"next"}
                style={tw(`px-2 items-center flex-row justify-center rounded-full h-12 mx-2 ${errorDetails.length > 0 ? 'bg-primary' : 'bg-green-200'}`)}
                disabled={errorDetails.length === 0}
                onPress={onNextCard}
              >
                <Text style={tw("text-white font-primary text-lg")}>Phrase suivante</Text>

                <View style={tw(`rounded-full h-6 w-6 flex items-center justify-center ml-2 ${errorDetails.length > 0 ? 'bg-primaryLighter' : 'bg-green-100'}`)}>
                  <Text style={tw('text-white font-bold')}>{errorDetails.length}</Text>
                </View>
              </TouchableOpacity>
            }

          </View>

          <View style={tw(' flex-col w-full bottom-0')}>
            {showMessage &&
              <View style={tw("bg-red-200 p-2 rounded-lg w-full flex-row justify-between items-center")}>
                <View>
                  <Text style={tw("text-[#B22222] font-primary text-lg flex-shrink")}>{messageContent}</Text>
                </View>
                <TouchableOpacity
                  style={tw("bg-red-500 px-4 rounded-lg h-8 my-1 flex-row items-center")}
                  onPress={goToNextSentence}
                >
                  <Text style={tw("text-white font-primary text-lg")}>Continuer</Text>
                </TouchableOpacity>
              </View>

            }
          </View>

        </SafeAreaView>
      ) : (
        // Boutons de plausibilité  
        < View style={tw('flex flex-row justify-evenly my-1 md:my-3')}>
          <TouchableOpacity style={tw('items-center justify-center rounded-full w-14 h-14 md:w-16 md:h-16 my-auto bg-red-200')}
            onPress={async () => {
              setIsModalVisible(true);
              setUserRateSelected(0);
            }} >
            <Entypo name="cross" size={32} color="red" />
          </TouchableOpacity>

          <TouchableOpacity style={tw('items-center justify-center rounded-full w-14 h-14 md:w-16 md:h-16 my-auto bg-orange-100')}
            onPress={async () => {
              setIsModalVisible(true);
              setUserRateSelected(25);
            }} >
            <Entypo name="flag" size={28} color="orange" />
          </TouchableOpacity>

          <TouchableOpacity style={tw('items-center justify-center rounded-full w-14 h-14 md:w-16 md:h-16 my-auto bg-yellow-100')}
            onPress={() => {
              setIsModalVisible(true);
              setUserRateSelected(50);
            }}  >
            <AntDesign name="question" size={30} color="orange" />
          </TouchableOpacity>

          <TouchableOpacity style={tw('items-center justify-center rounded-full w-14 h-14 md:w-16 md:h-16 my-auto bg-green-50')}
            onPress={async () => {
              setUserRateSelected(75);
              setIsModalVisible(true);
            }} >
            <Ionicons name="checkmark" size={24} color="#48d1cc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={tw('items-center justify-center rounded-full w-14 h-14 md:w-16 md:h-16 my-auto bg-green-200')}
            onPress={async () => {
              setUserRateSelected(100);
              onNextCard();
            }}
          >
            <Ionicons name="checkmark-done-sharp" size={24} color="green" />
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView >
  );
};

export default PlausibilityGameDetailedScreen;