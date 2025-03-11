import * as z from "zod"

export const businessProfileSchema = z.object({
  businessName: z.string().min(2, {
    message: "El nombre de la empresa debe tener al menos 2 caracteres",
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres",
  }),
  address: z.string().min(5, {
    message: "La dirección debe tener al menos 5 caracteres",
  }),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, {
    message: "Ingresa un número de teléfono válido",
  }),
  email: z.string().email({
    message: "Ingresa un correo electrónico válido",
  }),
  website: z.string().url({
    message: "Ingresa una URL válida",
  }).optional().or(z.literal("")),
  socialMedia: z.object({
    facebook: z.string().url({
      message: "Ingresa una URL válida de Facebook",
    }).optional().or(z.literal("")),
    instagram: z.string().url({
      message: "Ingresa una URL válida de Instagram",
    }).optional().or(z.literal("")),
    twitter: z.string().url({
      message: "Ingresa una URL válida de Twitter",
    }).optional().or(z.literal("")),
  }),
}) 