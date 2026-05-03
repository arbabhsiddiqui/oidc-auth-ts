import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        redirect: z.string().optional(),
    }),
});

// Infer the type to use in your Service
export type LoginInput = z.infer<typeof loginSchema>['body'];