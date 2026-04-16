export type ApiStatus = {
  ok: boolean;
  service: string;
  timestamp: string;
};

export function getApiStatus(): ApiStatus {
  return {
    ok: true,
    service: "clinic-app-api",
    timestamp: new Date().toISOString(),
  };
}
