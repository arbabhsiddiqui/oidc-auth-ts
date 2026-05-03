import { z } from "zod";

class BaseDto {
    static schema = z.object({}).strict();

    static validate(data: unknown) {
        const result = this.schema.strip().safeParse(data);

        if (!result.success) {
            const errors = result.error.issues.map((e) => {
                const path = e.path.join(".");
                return path ? `${path}: ${e.message}` : e.message;
            });

            return { errors, value: null };
        }

        return { errors: null, value: result.data };
    }
}

export default BaseDto;