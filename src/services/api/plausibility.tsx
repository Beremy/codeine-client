import { TestPlausibilityError } from "models/TestPlausibilityError";
import api from "./index";


export const getTestPlausibilityErrorByTextId = async (textId: number): Promise<TestPlausibilityError[]> => {
  try {
    const response = await api.get(`/plausibility/getErrorDetailTest/${textId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getCorrectPlausibilityByTextId = async (textId: number): Promise<number> => {
  try {
    const response = await api.get(`/plausibility/correctPlausibility/${textId}`);
    return response.data.test_plausibility;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getReasonForRateByTextId = async (textId: number): Promise<string> => {
  try {
    const response = await api.get(`/plausibility/getReasonForRateByTextId/${textId}`);
    return response.data.reason_for_rate;
  } catch (error) {
    console.error(error);
    throw error;
  }
};