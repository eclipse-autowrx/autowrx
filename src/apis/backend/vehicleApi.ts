export type API = {
    name: string;
    type: string;
    uuid: string;
    description: string;
    parent: string | null;
    isWishlist: boolean;
    shortName?: string;
};
