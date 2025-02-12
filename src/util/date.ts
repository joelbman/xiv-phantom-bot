export const dates = {
  oneWeek: () => {
    const oneWeek = new Date(Date.now() + 6.048e8);
    return oneWeek.toISOString().slice(0, 19).replace('T', ' ');
  },
  days: (days: number) => {
    const now = new Date(Date.now() + days * 86400000);
    return now.toISOString().slice(0, 19).replace('T', ' ');
  },
  now: () => {
    const now = new Date(Date.now());
    return now.toISOString().slice(0, 19).replace('T', ' ');
  },
};
