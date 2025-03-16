import * as z from "zod"

export const businessProfileSchema = z.object({
  name_company: z.string().min(2, {
    message: "El nombre de la empresa debe tener al menos 2 caracteres",
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres",
  }),
  opening_hours: z.string(),
  instagram: z.string().url({
    message: "Ingresa una URL válida de Instagram",
  }).optional().or(z.literal("")),
  facebook: z.string().url({
    message: "Ingresa una URL válida de Facebook",
  }).optional().or(z.literal("")),
  website: z.string().url({
    message: "Ingresa una URL válida",
  }).optional().or(z.literal("")),
  x: z.string().url({
    message: "Ingresa una URL válida de X (Twitter)",
  }).optional().or(z.literal("")),
})

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema> 