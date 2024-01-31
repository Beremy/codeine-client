import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ImageBackground, Image, TouchableOpacity, StyleSheet, Dimensions, Touchable } from "react-native";
import { useTailwind } from "tailwind-rn";
import { useAuth } from "services/context/AuthContext";
import { useUser } from "services/context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "navigation/Types";
import { getMessageMenu } from "services/api/utils";
import { MessageMenu } from 'models/MessageMenu';
import { FontAwesome } from '@expo/vector-icons';
import { getCompletedTutorials } from "services/api/games";
import IconNotification from "components/IconNotification";
import ModalBossExplanation from "components/modals/ModalBossExplanation ";
import Loader from "components/Loader";
import { getTopMonthlyWinners } from "services/api/user";
import { MonthlyWinner } from "models/MonthlyWinner";
import { getTutorialContentForStep } from "tutorials/tutorialGeneral";

interface TutorialsCompleted {
    [key: string]: boolean;
}

const MainBoardScreen = ({ }) => {
    const tw = useTailwind();
    const { authState } = useAuth();
    const { user, updateStorageUserFromAPI } = useUser();
    const navigation = useNavigation<RootStackNavigationProp<"Menu">>();
    const windowWidth = Dimensions.get('window').width;
    const [menuMessage, setMenuMessage] = useState<MessageMenu | null>(null);
    const [messageExpanded, setMessageExpanded] = useState(false);
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
    const [tutorialsCompleted, setTutorialsCompleted] = useState<TutorialsCompleted | null>(null);
    const iconSize = windowWidth * 0.015;
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isBossVisible, setIsBossVisible] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tutorialProgress, setTutorialProgress] = useState(0);
    const [loadedImagesCount, setLoadedImagesCount] = useState(0);
    const [loadedStates, setLoadedStates] = useState(Array(8).fill(false));
    const [userNeedsUpdate, setUserNeedsUpdate] = useState(true);
    const [monthlyWinners, setMonthlyWinners] = useState<any>([]);

    useEffect(() => {
        const fetchMonthlyWinners = async () => {
            try {
                const response = await getTopMonthlyWinners();
                setMonthlyWinners(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des gagnants mensuels', error);
            }
        };

        fetchMonthlyWinners();
    }, []);

    useEffect(() => {
        const updateUserData = async () => {
            if (userNeedsUpdate && user) {
                setIsLoading(true);
                try {
                    await updateStorageUserFromAPI(user.id);
                } catch (error) {
                    console.error('Error updating user data', error);
                } finally {
                    if (user.tutorial_progress <= 5) {
                        console.log("redirection");
                        navigation.navigate("Profil");
                    }
                    setIsLoading(false);
                    setUserNeedsUpdate(false); // Mise à jour terminée
                }
            }
        };

        updateUserData();
    }, [user, userNeedsUpdate]);

    // Gestion tuto général
    useEffect(() => {
        if (user && !userNeedsUpdate) {
            const tutorialProgress = user.tutorial_progress;
            setTutorialProgress(user.tutorial_progress);
            console.log(tutorialProgress);
            if (tutorialProgress > 5 && tutorialProgress < 10) {
                setIsBossVisible(true);
                const tutorialContent = getTutorialContentForStep(tutorialProgress, tw);
                setModalContent(tutorialContent);
            } else {
                setTimeout(() => {
                    setIsBossVisible(false);
                }, 500);
            }
        }
    }, [user, userNeedsUpdate]);


    useEffect(() => {
        const fetchTutorials = async () => {
            if (user && !userNeedsUpdate) {
                try {
                    const completedTutorials = await getCompletedTutorials(user.id);
                    const tutorialsState = completedTutorials.reduce((acc, game) => {
                        // @ts-ignore
                        acc[game.name] = true;
                        return acc;
                    }, {});
                    setTutorialsCompleted(tutorialsState);
                } catch (error) {
                    console.error('Error fetching tutorials', error);
                }
            } else {
                setTutorialsCompleted(null);
            }
        };

        fetchTutorials();
    }, [user, userNeedsUpdate]);


    useEffect(() => {
        getMessageMenu()
            .then((message) => {
                setMenuMessage(message);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const toggleMessage = () => {
        setMessageExpanded(!messageExpanded);
    }

    const loaderClose = useCallback(() => {
        setIsLoading(false);
    }, [setIsLoading]);


    // *********** Gestion Tuto *******************
    const showModal = (content: any) => {
        setModalContent(content);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    // *****************************************************

    return (
        <View style={{ flex: 1 }}>
            {isLoading && <Loader />}

            <ImageBackground
                source={require('images/bg_desk_smaller.webp')}
                onLoadEnd={loaderClose}
                style={[tw('flex-1 relative'), StyleSheet.absoluteFill]}
            >
                <View style={tw("flex-1 items-center")}>
                    {menuMessage && menuMessage.active &&
                        <TouchableOpacity onPress={toggleMessage} style={[tw("absolute top-0 right-0 p-4 bg-blue-500 bg-opacity-80 rounded-xl max-w-3xl"), { zIndex: 1 }]}>
                            {messageExpanded ? (
                                <>
                                    <Text style={tw("text-white text-lg font-primary")}>{menuMessage.title}</Text>
                                    <Text style={tw("text-white font-primary text-lg")}>{menuMessage.message}</Text>
                                    <Text style={tw("text-white text-center text-sm mt-2 italic font-primary")}>Cliquez sur le message pour le réduire</Text>
                                </>
                            ) : (
                                <Text style={tw("text-white text-lg font-primary")}>Cliquez ici</Text>
                            )}
                        </TouchableOpacity>
                    }


                    <View style={StyleSheet.absoluteFill}>
                        <View style={StyleSheet.absoluteFill}>
                            <TouchableOpacity onPress={() => navigation.navigate("Menu")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '43%' : '43%',
                                    left: windowWidth > 768 ? '48%' : '48%',
                                }}>
                                <Image source={require('images/map.png')} style={{ width: windowWidth * 0.1, height: windowWidth * 0.1, minWidth: 90, minHeight: 90 }} />
                            </TouchableOpacity>


                            <TouchableOpacity onPress={() => navigation.navigate("Investigation")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '54%' : '54%',
                                    left: windowWidth > 768 ? '21%' : '21%',
                                }}>
                                <Image source={require('images/polaroid_inconnu.png')}
                                    onLoadEnd={loaderClose}
                                    style={{
                                        width: windowWidth * 0.08, height: windowWidth * 0.08, minWidth: 70, minHeight: 70,
                                        shadowColor: 'black',
                                        shadowOffset: { width: -1, height: 2 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 1,
                                    }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>



                            <TouchableOpacity onPress={() => navigation.navigate("Classement")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '54%' : '54%',
                                    left: windowWidth > 768 ? '41%' : '41%',
                                }}>
                                <Image source={require('images/article.png')}
                                    onLoadEnd={loaderClose}
                                    style={{
                                        width: windowWidth * 0.08, height: windowWidth * 0.08, minWidth: 70, minHeight: 70,
                                        shadowColor: 'black',
                                        shadowOffset: { width: -1, height: 2 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 1,
                                    }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            {/* <TouchableOpacity onPress={() => navigation.navigate("HypoMytho")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '27%' : '27%',
                                    left: windowWidth > 768 ? '54%' : '54%',
                                }}>
                                <Image source={require('images/postit_hypothese.png')}
                                    style={{
                                        width: windowWidth * 0.06, height: windowWidth * 0.06, minWidth: 60, minHeight: 60,
                                        shadowColor: 'black',
                                        shadowOffset: { width: -1.6, height: 1 },
                                        shadowOpacity: 0.6,
                                        shadowRadius: 1,
                                    }} />
                            </TouchableOpacity> */}

                            <TouchableOpacity onPress={() => navigation.navigate("MythoTypo")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '53%' : '53%',
                                    left: windowWidth > 768 ? '68%' : '68%',
                                }}>
                                <View style={{ position: 'relative' }}>
                                    <Image
                                        resizeMode="contain"
                                        source={require('images/paper_2.png')}
                                        style={{ width: windowWidth * 0.12, height: windowWidth * 0.1, minWidth: 80, minHeight: 80 }}
                                    />
                                    {tutorialsCompleted && !tutorialsCompleted["MythoTypo"] &&
                                        <IconNotification
                                            size={iconSize}
                                            top="10%"
                                            right="15%"
                                        />
                                    }
                                </View>
                            </TouchableOpacity>


                            <TouchableOpacity onPress={() => navigation.navigate("MythoOuPas")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '40%' : '40%',
                                    left: windowWidth > 768 ? '30%' : '30%',
                                }}>
                                <Image source={require('images/postit_plausibility.png')}
                                    style={{
                                        width: windowWidth * 0.07, height: windowWidth * 0.07, minWidth: 65, minHeight: 65,
                                        shadowColor: 'black',
                                        shadowOffset: { width: -0.8, height: 1.5 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 1,
                                    }}
                                    resizeMode="contain"
                                />
                                {tutorialsCompleted && !tutorialsCompleted["MythoOuPas"] &&
                                    <IconNotification
                                        size={iconSize}
                                        top="1%"
                                        right="1%"
                                    />
                                }
                            </TouchableOpacity>


                            {/* <TouchableOpacity onPress={() => navigation.navigate("MythoTempo")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '56%' : '56%',
                                    left: windowWidth > 768 ? '37%' : '37%',
                                }}>
                                <Image source={require('images/postit_mytho_tempo.png')} style={{
                                    width: windowWidth * 0.06, height: windowWidth * 0.06, minWidth: 60, minHeight: 60,
                                    shadowColor: 'black',
                                    shadowOffset: { width: -1, height: 2 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 1,
                                    transform: [{ rotate: '4deg' }]
                                }} />
                            </TouchableOpacity> */}

                            <TouchableOpacity onPress={() => navigation.navigate("MythoNo")}
                                style={{
                                    position: 'absolute',
                                    top: windowWidth > 768 ? '20%' : '20%',
                                    left: windowWidth > 768 ? '40%' : '40%',
                                }}>
                                <Image source={require('images/postit_negation.png')} style={{
                                    width: windowWidth * 0.07, height: windowWidth * 0.07, minWidth: 65, minHeight: 65,
                                    shadowColor: 'black',
                                    shadowOffset: { width: 1, height: 1 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 1,
                                    transform: [{ rotate: '-8deg' }]
                                }} />

                                {tutorialsCompleted && !tutorialsCompleted["MythoNo"] &&
                                    <IconNotification
                                        size={iconSize}
                                        top="-5%"
                                        right="6%"
                                    />
                                }
                            </TouchableOpacity>

                            <View style={{
                                position: 'absolute',
                                top: '16.5%',
                                left: windowWidth > 768 ? '63%' : '63%',
                            }}>
                                <Image source={require('images/small_postit_month.png')} resizeMode="contain" style={{
                                    height: windowWidth * 0.04, minWidth: 100, minHeight: 40,
                                    shadowColor: 'black',
                                    shadowOffset: { width: 1, height: 1 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 1,

                                }} />

                                <View style={tw("top-0 left-0 right-0 mt-10")}>
                                    <View style={tw("flex-row justify-center items-center")}>
                                        <View
                                            style={[tw('mx-2 p-1 bg-slate-50 border border-slate-200'),
                                            { width: windowWidth * 0.06, minWidth: 80, minHeight: 40 }]}>
                                            <Text style={tw("text-center text-xl font-MochiyPopOne text-[#FACE3B]")}>2ème</Text>
                                            <Text style={tw("text-center font-semibold font-primary")}>{monthlyWinners[1]?.username}</Text>
                                        </View>

                                        <View style={[tw('mx-2 p-1 bg-slate-50 border border-slate-200'),
                                        { width: windowWidth * 0.06, minWidth: 80, minHeight: 40 }]}>
                                            <Text style={tw("text-center text-xl font-MochiyPopOne text-[#FCD903] font-bold")}>1er</Text>
                                            <Text style={tw("text-center font-semibold font-primary")}>{monthlyWinners[0]?.username}</Text>
                                        </View>

                                        <View style={[tw('mx-2 p-1 bg-slate-50 border border-slate-200'),
                                        { width: windowWidth * 0.06, minWidth: 80, minHeight: 40 }]}>
                                            <Text style={tw("text-center text-xl font-MochiyPopOne text-[#F9B784] font-bold")}>3ème</Text>
                                            <Text style={tw("text-center font-semibold font-primary")}>{monthlyWinners[2]?.username}</Text>
                                        </View>
                                    </View>
                                </View>


                                {/* <View
                                    style={tw("flex-row")}>
                                    <TouchableOpacity style={tw('mt-2')}
                                    >
                                        <Image source={require('images/polaroid_character_3.png')} style={{
                                            width: windowWidth * 0.08, height: windowWidth * 0.08, minWidth: 60, minHeight: 60,
                                            shadowColor: 'black',
                                            shadowOffset: { width: 1, height: 1 },
                                            shadowOpacity: 0.5,
                                            shadowRadius: 1,
                                        }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={tw('mr-[-18px] ml-[-18px] z-10')}
                                    >
                                        <Image source={require('images/polaroid_character_2.png')} style={{
                                            width: windowWidth * 0.08, height: windowWidth * 0.08, minWidth: 60, minHeight: 60,
                                            shadowColor: 'black',
                                            shadowOffset: { width: 1, height: 1 },
                                            shadowOpacity: 0.5,
                                            shadowRadius: 1,
                                        }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={tw('mt-4')}>
                                        <Image source={require('images/polaroid_character_1.png')} style={{
                                            width: windowWidth * 0.08, height: windowWidth * 0.08, minWidth: 60, minHeight: 60,
                                            shadowColor: 'black',
                                            shadowOffset: { width: 1, height: 1 },
                                            shadowOpacity: 0.5,
                                            shadowRadius: 1,
                                        }} />
                                    </TouchableOpacity>
                                </View> */}
                            </View>

                            <TouchableOpacity onPress={() => navigation.navigate("Criminels")}
                                style={{
                                    position: 'absolute',
                                    top: '17%',
                                    left: '21%',
                                    flexDirection: 'row',

                                }}>
                                <Image source={require('images/suspects/suspect_identification_2.png')} style={{
                                    width: windowWidth * 0.06, height: windowWidth * 0.06, minWidth: 65, minHeight: 65,
                                    shadowColor: 'black',
                                    shadowOffset: { width: 1, height: 1 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 1,
                                    resizeMode: 'contain',
                                }} />
                                <Image source={require('images/suspects/suspect_identification_1.png')} style={{
                                    width: windowWidth * 0.06, height: windowWidth * 0.06, minWidth: 65, minHeight: 65,
                                    shadowColor: 'black',
                                    shadowOffset: { width: 1, height: 1 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 1,
                                    resizeMode: 'contain',
                                    transform: [{ translateX: -25 }, { translateY: 10 }]
                                }} />
                            </TouchableOpacity>

                        </View>

                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate("Parametres")}
                        style={{ position: 'absolute', top: 0, left: 0, padding: 0, width: windowWidth * 0.10, height: windowWidth * 0.10, minWidth: 100, minHeight: 100 }}>
                        <View style={{
                            backgroundColor: "rgba(0,0,0,0.5)",
                            borderBottomRightRadius: 30,
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Image source={require('images/settings1.png')} resizeMode="contain"
                                style={{ width: windowWidth * 0.05, height: windowWidth * 0.1, minWidth: 50, minHeight: 100 }} />
                        </View>
                    </TouchableOpacity>


                    {!authState.isAuthenticated &&
                        <View style={[tw("absolute bottom-2 right-2")]}>
                            <TouchableOpacity onPress={() => navigation.navigate("Connexion")}
                                style={tw("mb-2 py-2 px-4 bg-blue-500 bg-opacity-70 rounded-xl")}>
                                <Text style={tw("text-center text-white text-lg")}>Se connecter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}
                                style={tw("py-2 px-4 bg-green-500 bg-opacity-70 rounded-xl")}>
                                <Text style={tw("text-center text-white text-lg")}>Créer un compte</Text>
                            </TouchableOpacity>
                        </View>
                    }

                    {authState.isAuthenticated &&
                        <TouchableOpacity onPress={() => navigation.navigate("Profil")}
                            style={{ position: 'absolute', bottom: 0, right: 0, padding: 0, width: windowWidth * 0.10, height: windowWidth * 0.10, minWidth: 100, minHeight: 100 }}>
                            <View style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                borderTopLeftRadius: 30,
                                width: '100%',
                                height: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <Image source={require('images/icon_profil.png')} resizeMode="contain"
                                    style={{ width: windowWidth * 0.06, height: windowWidth * 0.06, minWidth: 60, minHeight: 60 }} />
                            </View>
                        </TouchableOpacity>
                    }
                </View>

                <ModalBossExplanation
                    isVisible={isBossVisible}
                    onClose={handleCloseModal}
                    tutorial_progress={tutorialProgress}
                >
                    {modalContent}
                </ModalBossExplanation>
            </ImageBackground>

        </View>
    );
};

export default MainBoardScreen;
