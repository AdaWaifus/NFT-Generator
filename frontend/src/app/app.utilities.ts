export const removeItemFromList = (myArray: any[], key: any) => {
  const index = myArray.indexOf(key, 0);
  if (index > -1) {
    myArray.splice(index, 1);
  }
};

export const camelize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
