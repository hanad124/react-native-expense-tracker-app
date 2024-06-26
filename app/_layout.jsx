import { StyleSheet, Text, View, ActivityIndicator, Image } from "react-native";
import React, { useEffect, useContext, useLayoutEffect } from "react";
import { Slot, Stack, useRouter, usePathname } from "expo-router";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, AuthContext } from "../context/authContext";

import Logo from "../assets/Logo.png";
import CustomDrawer from "../components/Drawer";

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

const AuthWrapper = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const routeHandler = async () => {
      if (!isLoading) {
        if (
          (isAuthenticated && pathname.startsWith("/auth")) ||
          (isAuthenticated && pathname === "/sign-in")
        ) {
          router.push("/home");
          return null;
        }
        if (isAuthenticated && pathname === "/") {
          router.push("/home");
          return null;
        }
        if (!isAuthenticated && pathname === "/home") {
          router.push("/sign-in");
          return null;
        } else {
          return;
        }
      }
    };

    routeHandler();

    return () => {};
  }, [isLoading, isAuthenticated, pathname]);

  if (isLoading) {
    return (
      <View className="bg-primary h-screen flex items-center justify-center">
        <View className="flex flex-col items-center gap-y-4">
          <View className="flex flex-col itec gap-y-2">
            <Image source={Logo} className="w-20 h-20" />
            <Text className="text-white text-2xl font-bold">e-Financer</Text>
          </View>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {isAuthenticated ? (
        <>
          <Stack
            initialRouteName={isAuthenticated ? "/home" : "/sign-in"}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="transactions/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="transactions/[id]"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(goals)/create-goal"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="categories/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="categories/[id]"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="categories/create"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </>
      ) : (
        <Stack
          initialRouteName={isAuthenticated ? "/home" : "/sign-in"}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="auth/login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="auth/register"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="auth/reset-password"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="auth/verify-email"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
};

export default RootLayout;
