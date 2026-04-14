import { z } from "zod";
import { getSiteConfig } from "@/config/site-settings";

const { validation } = getSiteConfig();

export const registerSchema = z.object({
  name: z
    .string()
    .min(validation.name.minLength, `Meno musí mať aspoň ${validation.name.minLength} znaky`)
    .max(validation.name.maxLength, `Meno môže mať najviac ${validation.name.maxLength} znakov`)
    .optional(),
  email: z
    .string()
    .email("Zadajte platný e-mail")
    .min(validation.email.minLength, `E-mail musí mať aspoň ${validation.email.minLength} znakov`)
    .max(validation.email.maxLength, `E-mail môže mať najviac ${validation.email.maxLength} znakov`),
  password: z
    .string()
    .min(validation.password.minLength, `Heslo musí mať aspoň ${validation.password.minLength} znakov`)
    .max(validation.password.maxLength, `Heslo môže mať najviac ${validation.password.maxLength} znakov`)
    .refine(
      (val) => !validation.password.requireUppercase || /[A-Z]/.test(val),
      "Heslo musí obsahovať aspoň jedno veľké písmeno"
    )
    .refine(
      (val) => !validation.password.requireNumber || /[0-9]/.test(val),
      "Heslo musí obsahovať aspoň jednu číslicu"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Heslá sa nezhodujú",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Zadajte platný e-mail"),
  password: z
    .string()
    .min(1, "Zadajte heslo"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
