export const summaryService = {
  generateSummary: (answers) => {
    return {
      timestamp: Date.now(),
      answers: { ...answers }
    };
  }
};
