import z from "zod";

export function extractPagingParams(url: string) {

    const params = new URLSearchParams(url);

    const page = Math.max(0, parseInt(params.get("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(params.get("pageSize") ?? "20", 10) || 20);
    const labels = (params.get("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const name = params.get("name") || "";

    return {
        page, pageSize, name, labels,
    }
}

export function parseBodyFiles(body: { [x: string]: string | File | (string | File)[]; }) {

    const rawUploads = body['uploads'];
    if (!rawUploads) return [];

    const uploads: File[] = Array.isArray(rawUploads) ?
        rawUploads.filter((f): f is File => f instanceof File) :
        rawUploads instanceof File ? [rawUploads] : [];

    return uploads;
}