// eslint-disable-next-line import/prefer-default-export
export const mockAxiosResponse = (data, config = undefined) => {
  const response = { config };
  if (data.problem == null) {
    response.status = 200;
    response.data = data;
  } else {
    const problem = typeof data.problem === 'object'
      ? data.problem
      : { code: data.problem, message: 'There was a problem.' };
    response.status = Math.floor(problem.code);
    response.data = problem;
  }
  return response;
};
