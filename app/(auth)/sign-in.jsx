import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "../../components/CustomButton";
import { Eye, EyeOff } from "lucide-react-native";

// Define validation schema using zod
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data) => {
    console.log(data);
    // Handle sign-in logic here
    alert("Sign in successful");
  };

  return (
    <SafeAreaView className="h-full">
      <ScrollView>
        <View className="w-full justify-center h-full px-4 my-6 mt-10">
          <Text className="text-3xl text-black font-bold text-center">
            Welcome Back
          </Text>
          <Text className="text text-gray-400 mt-4 text-center ">
            Don't have an account?{" "}
            <Link href={"/sign-up"} className="text-blue-500 font-semibold">
              Sign up
            </Link>
          </Text>
          <View className="my-16">
            <Text className="text-base text-slate-600 font-pmedium ml-">
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border-[1px] border-slate-400 px-2 rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                  email
                  placeholder="Enter your email address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500">{errors.email.message}</Text>
            )}

            <Text className="text-base text-slate-600 font-pmedium mt-6">
              Password
            </Text>
            <View className="relative w-full items-center">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border-[1px] border-slate-400 px-2 rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-[40%] transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={24} color="gray" />
                ) : (
                  <Eye size={24} color="gray" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-red-500">{errors.password.message}</Text>
            )}

            <Link
              href={"/forgot-password"}
              className="text-blue-500 font-semibold text-right mt-4 block"
            >
              Forgot password?
            </Link>

            <View className="mt-6">
              <CustomButton
                text="Sign In"
                handlePress={handleSubmit(onSubmit)}
                containerStyles={"w-full mt-6 "}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
