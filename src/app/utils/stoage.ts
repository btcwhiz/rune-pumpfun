export const storeStorage = (key: string, value: string | object) => {
  try {
    if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch (error) {
    console.log("error :>> ", error);
    return false;
  }
};

export const getStorage = (key: string) => {
  const storageVal = localStorage.getItem(key);
  if (storageVal) {
    return JSON.parse(storageVal);
  } else {
    return storageVal;
  }
};
