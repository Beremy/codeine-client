import React, { useContext } from "react";
import { useAuth } from "services/context/AuthContext";
import { useUser } from "services/context/UserContext";
import FunctionButton from "components/FunctionButton";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "navigation/Types";
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogoutButton = () => {
  const { setAuthState } = useAuth();
  const { setUser, resetTutorialsCompleted } = useUser();
  const navigation = useNavigation<RootStackNavigationProp<"Menu">>();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      resetTutorialsCompleted();
      setAuthState({ isAuthenticated: false, token: null, isLoading: false });
      navigation.navigate("TableauDeBord");
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  return <FunctionButton text={"Se déconnecter"} func={handleLogout} />;
};

export default LogoutButton;
