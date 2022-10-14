export type GlobalVariables = {
    port: number
}

export const globalVariables: GlobalVariables = {
    port: parseInt(process.env.PORT) || 3000
};

