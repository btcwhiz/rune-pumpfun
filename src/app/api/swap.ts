import axios from "axios";

export const getAllPools = async () => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/swap/get-all-pools`;
    const res = await axios.get(urlEndpoint);
    return res.data;
  } catch (error: any) {
    return [];
  }
};

export const getLiquidity = async () => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/swap/get-liquidity`;
    const res = await axios.get(urlEndpoint);
    return res.data;
  } catch (error: any) {
    return [];
  }
};
