import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ToastAndroid,
  Linking,
  Platform,
} from "react-native";

import call from "react-native-phone-call";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller, set } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "../../components/CustomButton";
import { useCategoriesStore } from "../../store/categories";
import { useTransactionsStore } from "../../store/transactions";
import { RadioButton } from "react-native-paper";
import { TouchableOpacity } from "react-native-gesture-handler";

import { updateTransaction } from "../../apicalls/transactions";

import ExpenseIcon from "../../assets/icons/expense-icon.png";
import IncomeIcon from "../../assets/icons/income-icon.png";
import { router, useNavigation } from "expo-router";

import { ArrowLeft, Plus } from "lucide-react-native";
import LoadingOverlay from "../../components/LoadingOverlay";

const TransactionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.toString()), {
      message: "Amount can have up to 2 decimal places",
    })
    .or(
      z
        .string()
        .regex(
          /^\d+(\.\d{1,2})?$/,
          "Amount must be a valid number with up to 2 decimal places"
        )
    )
    .transform((value) =>
      typeof value === "string" ? parseFloat(value) : value
    )
    .pipe(z.number()),

  type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

const UpdateTransaction = () => {
  const { categories } = useCategoriesStore();

  const navigation = useNavigation();

  const transactionTypes = [
    {
      id: "INCOME",
      name: "Income",
      icon: IncomeIcon,
    },
    {
      id: "EXPENSE",
      name: "Expense",
      icon: ExpenseIcon,
    },
  ];

  // account type [Merchant, EvcPlus]
  const accountTypes = [
    {
      id: "MERCHANT",
      name: "Merchant",
    },
    {
      id: "EVCPLUS",
      name: "EVCPlus",
    },
  ];

  const { transaction } = useTransactionsStore();
  const categoriesData = categories?.categories;
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overLeyLoading, setOverlayLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTransactionType, setSelectedTransactionType] =
    useState("EXPENSE");
  const [selectedAccountType, setSelectedAccountType] = useState("EVCPLUS");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    getValues,
    register,
  } = useForm({
    resolver: zodResolver(TransactionSchema),

    // if the selected transaction type is expense make it optional to select an account type and number
    defaultValues: {
      type: selectedTransactionType,
      category: selectedCategory,
      accountType: selectedAccountType,
      // number: 0,
    },
  });

  // reset form
  const resetForm = () => {
    reset({
      title: "",
      amount: 0,
      type: selectedTransactionType,
      category: selectedCategory,
      accountType: selectedAccountType,
      description: "",
      receipt: null,
    });
    setImage(null);
  };
  // set default values
  useEffect(() => {
    if (transaction) {
      setOverlayLoading(true);

      setSelectedTransactionType(transaction?.type);
      setValue("title", transaction?.title);
      setValue("amount", Number(transaction?.amount));
      setValue("description", transaction?.description);

      setSelectedCategory(transaction?.category?.id);
      setImage(transaction?.receipt);

      console.log("transaction receipt", transaction.receipt);
      setOverlayLoading(false);
    }
  }, [transaction, setValue]);

  useEffect(() => {
    setValue("type", selectedTransactionType);
    setValue("category", selectedCategory);
    setValue("accountType", selectedAccountType);

    if (selectedTransactionType === "ICONME") {
      setValue("number", 0);
    }
  }, [selectedTransactionType, selectedCategory]);

  // track errors
  useEffect(() => {
    console.log("errors", errors);

    // display exact error message in the alert
  }, [errors]);

  useEffect(() => {
    (async () => {
      const galleryStatus =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasCameraPermission(galleryStatus.status === "granted");
    })();
  }, []);

  // take picture from camera
  const takePicture = async () => {
    if (hasCameraPermission) {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log("result", result);

      if (!result.canceled) {
        const base64Image = await FileSystem.readAsStringAsync(
          result?.assets[0]?.uri,
          {
            encoding: "base64",
          }
        );
        const imageData = `data:image/jpeg;base64,${base64Image}`;

        setImage(imageData);
      }
    }
  };

  const onSubmit = async (data) => {
    console.log("data", data);
    image && (data.receipt = image);

    setLoading(true);
    try {
      const res = await updateTransaction(
        useTransactionsStore.getState().transactionId,
        data
      );

      if (res.status === 200) {
        setLoading(false);
        resetForm();
        ToastAndroid.show(
          `${res.data.message || "Transaction updated successfully!"}`,
          ToastAndroid.SHORT
        );
        if (selectedTransactionType === "EXPENSE") {
          if (selectedAccountType === "MERCHANT") {
            args = {
              number: `*789*${data.number}*${data.amount}#`,
              prompt: true,
              skipCanOpen: false,
            };

            call(args).catch(console.error);
          }
          if (selectedAccountType === "EVCPLUS") {
            args = {
              number: `*712*${data.number}*${data.amount}#`,
              prompt: true,
              skipCanOpen: false,
            };

            call(args).catch(console.error);
          }
        }
        await useTransactionsStore.getState().getTransactions();
      } else {
        alert(`${res.data.message}`, ToastAndroid.SHORT);

        setLoading(false);
      }
    } catch (error) {
      console.error("API call error", error);
    }
  };

  return (
    <>
      <LoadingOverlay loading={overLeyLoading} />
      <SafeAreaView>
        <ScrollView className="bg-white pt-5">
          <View className="w-full  min-h-[90vh] px-4 my-6 mt-0  bg-white">
            <View className="flex flex-row items-center justify-between  my-2 mb-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="flex flex-row items-center"
              >
                <ArrowLeft size={20} color={"black"} />
                <Text className="text-lg font-pmedium text-gray-800 ml-2">
                  Back
                </Text>
              </TouchableOpacity>
            </View>
            <View className="">
              <Text className="text-lg mt-2 text-gray-800 mb-[5px]">
                Select Transaction Type
              </Text>
              <View className="flex flex-col gap-y-4 justify-start ">
                {transactionTypes?.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles]}
                    onPress={() => setSelectedTransactionType(type.id)}
                    className="flex flex-row gap-x-4 items-center"
                  >
                    <View
                      style={selectedTransactionType === type.id && styles}
                      className={`${
                        selectedTransactionType === type.id
                          ? "bg-primary"
                          : "bg-primary/5"
                      } flex flex-col items-center p-4 rounded-lg`}
                    >
                      <Image
                        source={type.icon}
                        style={[styles.categoryIcon]}
                        resizeMode="contain"
                        tintColor={
                          selectedTransactionType === type.id
                            ? "white"
                            : "#6957E7"
                        }
                        className=""
                      />
                    </View>
                    <Text style={styles.categoryText} className="">
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedTransactionType === "EXPENSE" && (
              <View className="mt-2">
                <Text className="text-lg  text-gray-800 mb-[5px]">
                  Select Account Type
                </Text>
                <View className="flex flex-row space-x-2 mt-1 justify-start ">
                  {accountTypes?.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles]}
                      onPress={() => {
                        setSelectedAccountType(type.id);
                        console.log("type", selectedAccountType);
                      }}
                      className="flex flex-row gap-x-4 items-center"
                    >
                      <View
                        style={selectedAccountType === type.id && styles}
                        className={`${
                          selectedAccountType === type.id
                            ? "bg-primary"
                            : "bg-primary/5"
                        } flex flex-col items-center p-4 rounded-lg`}
                      >
                        <Text
                          style={styles.categoryText}
                          className={`
                     ${
                       selectedAccountType === type.id
                         ? "text-white"
                         : "text-primary"
                     }
                      `}
                        >
                          {type.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View className="mt-4">
              <Text className="text-sm font-pregular text-gray-800">Name</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={{
                      padding: 10,
                    }}
                    className="border-[1px] border-slate-400 px-2 rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Title"
                  />
                )}
                name="title"
                rules={{ required: "Title is required" }}
              />
              {errors.title && (
                <Text className="text-red-500">{errors.title.message}</Text>
              )}
            </View>
            <View className="mt-4">
              <Text className="text-sm font-pregular text-gray-800">
                Amount
              </Text>
              <Controller
                control={control}
                name="amount"
                rules={{ required: "Amount is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    keyboardType="numeric"
                    style={{ padding: 10 }}
                    className="border-[1px] border-slate-400 rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      // Using regex to validate the input as a float number
                      const numberValue = text.match(/^\d*\.?\d*$/)
                        ? text
                        : value;
                      onChange(numberValue);
                    }}
                    value={String(value)} // Ensure value is correctly handled
                    placeholder="Amount"
                  />
                )}
              />
              {errors.amount && (
                <Text className="text-red-500">{errors.amount.message}</Text>
              )}
            </View>

            {selectedTransactionType === "EXPENSE" && (
              <View className="mt-4">
                <Text className="text-sm font-pregular text-gray-800">
                  Number
                </Text>
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
                      placeholder="Number"
                    />
                  )}
                  name="number"
                  rules={{ required: "Number is required" }}
                />
                {errors.number && (
                  <Text className="text-red-500">{errors.number.message}</Text>
                )}
              </View>
            )}

            <View className="my-4">
              <View className="">
                <Text className="text-sm font-pregular text-gray-800">
                  Description
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={{
                        padding: 10,
                      }}
                      className="border-[1px] border-slate-400 px-2 rounded-lg shadow py-[9px] w-full mt-2 focus:border-[2px] focus:border-primary focus:ring-4 focus:ring-primary"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Description"
                    />
                  )}
                  name="description"
                />
                {selectedTransactionType === "EXPENSE" && (
                  <View className="mt-4">
                    <Text className="text-sm font-pregular text-gray-800">
                      Attach Receipt
                    </Text>
                    <TouchableOpacity
                      onPress={takePicture}
                      className="flex flex-row border border-slate-400 py-3 rounded-lg items-center justify-center mt-2"
                    >
                      <Text className="text-gray-800 ">Take a picture</Text>
                    </TouchableOpacity>
                    {image && (
                      <Image
                        source={{ uri: image }}
                        style={{
                          width: 100,
                          height: 100,
                          marginTop: 15,
                        }}
                        className="rounded-lg"
                      />
                    )}
                  </View>
                )}

                <View className="mt-5">
                  <Text className="text-sm font-pmedium text-gray-800">
                    Choose category
                  </Text>

                  <RadioButton.Group
                    onValueChange={(newValue) => setSelectedCategory(newValue)}
                    value={selectedCategory}
                  >
                    <View className="flex flex-row flex-wrap  relative w-full ">
                      {categoriesData?.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[styles.categoryContainer]}
                          onPress={() => setSelectedCategory(category.id)}
                          className="flex flex-col items-center"
                        >
                          <View
                            // styles={
                            //   // selectedCategory === category.id &&
                            //   // styles.selectedCategory
                            // }
                            className={`${
                              selectedCategory === category.id
                                ? "bg-primary"
                                : "bg-primary/5"
                            } flex flex-col items-center p-4 rounded-lg`}
                          >
                            <Image
                              source={{ uri: category.icons.icon }}
                              style={[styles.categoryIcon]}
                              resizeMode="contain"
                              tintColor={
                                selectedCategory === category.id
                                  ? "white"
                                  : "#6957E7"
                              }
                              className=""
                            />
                          </View>
                          <Text style={styles.categoryText}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {/*
                       */}
                      <TouchableOpacity
                        onPress={() => {
                          router.push("/categories/create");
                        }}
                        className="flex flex-col items-center bg-none bg-transparent mt-3 ml-2"
                      >
                        <View className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary/5">
                          {/* <Image
                          source={PlusIcon}
                          style={[styles.categoryIcon]}
                          resizeMode="contain"
                          tintColor="#6957E7"
                          className=""
                        /> */}

                          <Plus size={30} color="#6957E7" />
                        </View>
                        <Text>others</Text>
                      </TouchableOpacity>
                    </View>
                  </RadioButton.Group>

                  {/* <TouchableOpacity
                style={[styles.categoryContainer]}
                className="flex flex-col items-center"
                onPress={alert("This feature is not yet available")}
              >
                <View
                  style={styles.categoryContainer}
                  className={`${
                    selectedCategory === "add" ? "bg-primary" : "bg-primary/5"
                  } flex flex-col items-center p-4 rounded-lg`}
                >
                  <Image
                    source={PlusIcon}
                    style={[styles.categoryIcon]}
                    resizeMode="contain"
                    tintColor={selectedCategory === "add" ? "white" : "#6957E7"}
                    className=""
                  />
                </View>
                <Text>others</Text>
              </TouchableOpacity> */}
                </View>

                <CustomButton
                  text="Update Transaction"
                  handlePress={() => {
                    handleSubmit(onSubmit)();

                    if (errors.type) {
                      alert(errors.type.message);
                    }

                    if (errors.category) {
                      alert(errors.category.message);
                    }
                  }}
                  containerStyles={`w-full mt-6 
                } `}
                  isLoading={loading}
                  loadinState={"updating transaction..."}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    // flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    // backgroundColor: "#f0f0f0",
  },
  selectedCategory: {
    backgroundColor: "#d0e0fc",
  },
  categoryIcon: {
    width: 30,
    height: 30,
    // marginRight: 10,
  },
  categoryText: {
    fontSize: 16,
  },
});

export default UpdateTransaction;
