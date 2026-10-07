export async function checkPasswordStrength(password) {
  const { default:zxcvbn } = await import('zxcvbn');
  const { score, feedback:{ warning, suggestions } } = zxcvbn(password);
  return {
    score,
    suggestions: [
      warning,
      ...suggestions,
    ].filter(it => it),
  };
}
