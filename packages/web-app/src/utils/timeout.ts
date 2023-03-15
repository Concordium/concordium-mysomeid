
export const Timeout = {
    set: async (n: number) => {
        return new Promise<void>(resolve => {
        setTimeout(resolve, n);
        });
    },
};
