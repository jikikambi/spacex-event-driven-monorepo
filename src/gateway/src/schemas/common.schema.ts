import { z } from "zod";

export const NullableString = z.string().nullable();

export const NullableNumber = z.number().nullable();

export const NullableUrl = z.url().nullable();

export const UrlString = z.union([
    z.url(),
    z.null()
]);

export const CoordinatesSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});