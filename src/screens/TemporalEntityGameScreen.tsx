import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTailwind } from "tailwind-rn";
import data from "data/fakeUserData.js";
import { Entypo, MaterialIcons } from '@expo/vector-icons';

const colors = [
  "bg-yellow-300",
  "bg-green-300",
  "bg-blue-300",
  "bg-indigo-300",
  "bg-pink-300",
];

const TemporalEntityScreen = ({ }) => {
  const tw = useTailwind();
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [temporalEntities, setTemporalEntities] = useState([]);
  const [colorIndex, setColorIndex] = useState(0);

  function shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  useEffect(() => {
    const shuffledSentences = shuffleArray(data.sentences);
    setSentences(shuffledSentences.slice(0, 10).map((sentence) => {
      const words = sentence.content.split(' ').map((word) => ({ text: word, isSelected: false, entityId: null }));
      return { ...sentence, content: words };
    }));
  }, []);

  const onWordPress = (wordIndex, sentenceIndex) => {
    const newSentences = sentences.map((sentence, idx) => {
      if (idx === sentenceIndex) {
        const newWords = sentence.content.map((word, idx) => {
          if (idx === wordIndex) {
            return { ...word, isSelected: !word.isSelected, entityId: word.isSelected ? null : temporalEntities.length };
          }
          return word;
        });
        return { ...sentence, content: newWords };
      }
      return sentence;
    });

    setSentences(newSentences);
  };

  const addTemporalEntity = () => {
    const selectedWords = sentences[currentIndex].content.filter(word => word.isSelected && word.entityId === temporalEntities.length);
    const entityText = selectedWords.map(word => word.text).join(' ');

    if (entityText) {
      setTemporalEntities([...temporalEntities, { id: temporalEntities.length, text: entityText }]);
      setColorIndex((colorIndex + 1) % colors.length);
    }
  };

  const removeTemporalEntity = (entityId) => {
    setTemporalEntities(temporalEntities.filter(entity => entity.id !== entityId));

    const newSentences = sentences.map(sentence => {
      const newWords = sentence.content.map(word => {
        if (word.entityId === entityId) {
          return { ...word, isSelected: false, entityId: null };
        }
        return word;
      });
      return { ...sentence, content: newWords };
    });

    setSentences(newSentences);
  };

  const renderSentence = (sentence, index) => {
    if (typeof sentence === "undefined") {
      return null;
    }
    return (
      <SafeAreaView style={tw("flex-1 bg-white")}>

        <View style={tw("flex-row justify-end items-center mb-4 mr-2")}>
          <TouchableOpacity
            style={tw("bg-blue-500 py-2 px-4 rounded-lg flex-row items-center")}
            onPress={onNextCard}
          >
            <Text style={tw('font-primary mr-2 text-white text-base')}>Phrase suivante</Text>
            <MaterialIcons name="navigate-next" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            tw("bg-[#FFFEE0] rounded-xl justify-center mx-2"),
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
            {sentence.content.map((word, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => onWordPress(idx, index)}
                style={tw(
                  `m-1 ${word.isSelected ? colors[word.entityId % colors.length] : "bg-transparent"}`
                )}
              >
                <Text style={
                  tw("text-2xl font-HandleeRegular")}
                >{word.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const renderTemporalEntity = (entity) => (
    <View key={entity.id} style={tw(`flex-row items-center m-1 `)}>
      <Text style={tw(`text-lg mr-2 ${colors[entity.id % colors.length]} font-primary`)}>{entity.text}</Text>
      <TouchableOpacity onPress={() => removeTemporalEntity(entity.id)}>
        <Entypo name="cross" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  const onNextCard = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTemporalEntities([]); // Réinitialiser le récapitulatif des entités
    }
  };

  return (
    <SafeAreaView style={tw("flex-1 bg-white")}>
      <ScrollView contentContainerStyle={tw("")}>

        <View style={tw("flex-1 justify-center items-center")}>
          {renderSentence(sentences[currentIndex], currentIndex)}
        </View>
        <View style={tw("flex-row mb-4 mt-8 justify-center")}>
          <View style={tw("mx-4")}>
            {temporalEntities.map(entity => renderTemporalEntity(entity))}
          </View>
          <TouchableOpacity
            style={tw("bg-blue-500 px-4 rounded-lg mx-4 h-10")}
            onPress={addTemporalEntity}
          >
            <View style={tw("py-2")}>
              <Text style={tw("text-white font-primary text-lg")}>Nouvelle entité</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

};

export default TemporalEntityScreen;