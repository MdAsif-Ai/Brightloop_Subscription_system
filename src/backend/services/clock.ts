let simulatedDate: string | null = null;

export const clockService = {
  getCurrentDate(): string {
    return simulatedDate || new Date().toISOString().split('T')[0];
  },

  setDate(dateStr: string): string {
    simulatedDate = dateStr;
    return simulatedDate;
  },

  reset(): string {
    simulatedDate = null;
    return new Date().toISOString().split('T')[0];
  },
};
