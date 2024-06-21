import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Button,
  Animated,
  Image,
  //   styleSheet
  StyleSheet,
  ToastAndroid,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useForm, Controller, set } from "react-hook-form";
import { number, z } from "zod";
import { RadioButton } from "react-native-paper";

import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "../../components/CustomButton";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { ArrowLeft } from "lucide-react-native";

import { createGoal } from "../../apicalls/goals";
import { useGoalsStore } from "../../store/goals";
import { useCategoriesStore } from "../../store/categories";

// schema [name, amount, targetDate, icon]
const schema = z.object({
  name: z
    .string()
    .nonempty("Name is required")
    .min(3, "Name is too short")
    .max(15, "Name is too long"),
  amount: z
    .number()
    .min(1, "Amount is required")
    .max(1000000, "Amount is too high"),
  targetDate: z.date("Please enter a valid date "),
  icon: z.string().optional(),
});

const CreateGoal = () => {
  const navigation = useNavigation();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [loading, setLoading] = useState(false);

  const icons = useCategoriesStore((state) => state.icons);

  console.log("icons", icons);

  //   track errors
  useEffect(() => {
    console.log("errors", errors);
  }, [errors]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    data.icon = selectedIcon;
    console.log("data", data);
    setLoading(true);
    try {
      const response = await createGoal(data);
      if (response?.status === 201) {
        Alert.alert(response?.data?.message);
        setLoading(false);
        reset();
        useGoalsStore.getState().getGoals();
      }
    } catch (error) {
      console.log(error);
      Alert.alert(response?.data?.message);
    }
  };

  console.log("selected icon", selectedIcon);

  return (
    <SafeAreaView className="bg-white">
      <ScrollView className="h-screen">
        <View className="w-full  min-h-[90vh] px-4 mt-10  bg-white">
          {/* header */}
          <View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ArrowLeft className="text-black " size={18} />
              <Text
                style={{
                  color: "black",
                  fontSize: 18,
                }}
              >
                Back
              </Text>
              <Text
                style={{
                  color: "black",
                  fontSize: 18,
                  textAlign: "center",
                }}
                className="text-center ml-10 font-pmedium"
              >
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-black text-lg mt-5">
            What is your goal name?
          </Text>

          {/* ===== form ====== */}
          {/* name */}
          <View className="mt-5">
            <Text className="text-black">Name</Text>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border-[1px] border-slate-400 px-2 rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Goal Name"
                />
              )}
              name="name"
              defaultValue=""
            />
            {errors.name && (
              <Text style={{ color: "red" }}>{errors.name.message}</Text>
            )}
          </View>
          {/* amount */}
          <View className="mt-4">
            <Text className="text-sm font-pregular text-gray-800">Amount</Text>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  keyboardType="numeric"
                  style={{
                    padding: 10,
                  }}
                  className="border-[1px] border-slate-400  rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    // check if the value is a number
                    // change the value to a number
                    const numberValue = parseFloat(text);
                    onChange(numberValue);
                  }}
                  value={value}
                  placeholder="Amount"
                />
              )}
              name="amount"
              rules={{ required: "Amount is required" }}
            />
            {errors.amount && (
              <Text className="text-red-500">{errors.amount.message}</Text>
            )}
          </View>
          {/* target date */}
          <View className="mt-5">
            <Text className="text-black ">Target Date</Text>
            <Controller
              control={control}
              name="targetDate"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    onPress={showDatePicker}
                    // style={styles.dateButton}
                    className="border-[1px] border-slate-400 px-2 rounded-lg shadow py-[14px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                  >
                    <Text>
                      {selectedDate
                        ? selectedDate.toDateString()
                        : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={(date) => {
                      onChange(date);
                      handleConfirm(date);
                    }}
                    onCancel={hideDatePicker}
                  />
                </>
              )}
              rules={{ required: "Target date is required" }}
            />

            {errors.targetDate && (
              <Text style={{ color: "red" }}>{errors.targetDate.message}</Text>
            )}
          </View>

          {/* 
          icons section
           */}
          <View className="mt-5">
            <Text className="text-black">Select Icon</Text>
            <View className="flex flex-wrap mt-2">
              <RadioButton.Group
                onValueChange={(value) => setSelectedIcon(value)}
                value={selectedIcon}
              >
                <View className="flex flex-row flex-wrap w-full space-x-2 min-w-full">
                  {icons?.map((icon) => (
                    <TouchableOpacity
                      key={icon?.id}
                      onPress={() => setSelectedIcon(icon?.icon)}
                      className=""
                    >
                      <View
                        style={[
                          {
                            borderRadius: 8,
                            padding: 8,
                            margin: 4,
                          },
                        ]}
                        className={`flex flex-col items-center p-4 rounded-lg ${
                          selectedIcon === icon?.icon
                            ? "bg-primary"
                            : "bg-primary/5"
                        }`}
                      >
                        <Image
                          source={{ uri: icon?.icon }}
                          style={{
                            width: 35,
                            height: 35,
                          }}
                          tintColor={
                            selectedIcon === icon?.icon ? "white" : "#6957E7"
                          }
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </RadioButton.Group>
            </View>
          </View>

          {/* submit button */}
          <CustomButton
            text="Create Goal"
            handlePress={() => {
              handleSubmit(onSubmit)();

              if (errors.targetDate) {
                Alert.alert("Target Date is required");
              }
            }}
            isLoading={loading}
            className="mt-5"
            loadinState={"Creating Goal"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateGoal;
