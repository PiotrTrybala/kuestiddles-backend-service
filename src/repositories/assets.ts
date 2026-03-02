
export type ListAssetsParams = {
    page: number,
    pageSize: number,
    labels: string[],
    name: string,
};

export async function listAssets(organizationId: string, params: ListAssetsParams) {

}

export async function getAsset(id: string) {

}

export async function uploadAssets(organizationId: string, files: File[]) {

}

export async function deleteAsset(id: string) {

}