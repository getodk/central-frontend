// This function has been copied from Central Backend (lib/data/dataset.js).
// eslint-disable-next-line import/prefer-default-export
export const validatePropertyName = (name) => {
  const match = /^(?!__)(?!name$)(?!label$)[\p{L}_][\p{L}\d._-]*$/u.exec(name.toLowerCase());

  return (match !== null);
};
