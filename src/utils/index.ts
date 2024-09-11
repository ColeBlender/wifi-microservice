import { Metadata, ServiceError } from "@grpc/grpc-js";

export function generateServiceError(error: ServiceError) {
  return {
    name: "PostgrestError",
    message: error.message,
    code: typeof error.code === "number" ? error.code : 13,
    details: error.details || "",
    metadata: new Metadata(),
  };
}
