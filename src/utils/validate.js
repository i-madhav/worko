// validate.js
import { z } from "zod";

const validateObject = (obj, schemaType) => {
  let schema;
  
  switch(schemaType) {
    case 'register':
      schema = z.object({
        email: z.string().email(),
        name: z.string(),
        age: z.number(),
        city: z.string(),
        zipcode: z.number(),
        password: z.string().min(8)
      });
      break;
    case 'login':
      schema = z.object({
        email: z.string().email(),
        password: z.string()
      });
      break;
    case 'update':
      schema = z.object({
        email: z.string().email().optional(),
        name: z.string().optional(),
        age: z.number().optional(),
        city: z.string().optional(),
        zipcode: z.number().optional()
      }).partial();
      break;
    default:
      throw new Error("Invalid schema type");
  }

  const response = schema.safeParse(obj);
  return response;
}

const validatePartialObject = (obj) => {
  const updateSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    age: z.number().optional(),
    city: z.string().optional(),
    zipcode: z.number().optional()
  }).partial();

  return updateSchema.safeParse(obj);
};

export { validateObject, validatePartialObject };