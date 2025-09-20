export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  path: string;
  timestamp: string;
  data: T;
};
