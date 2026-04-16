import { neon } from "@neondatabase/serverless";

type NeonConfig = {
  connectionString: string;
};

let neonClient: ReturnType<typeof neon> | null = null;

export function getNeonConfig(): NeonConfig {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  return { connectionString };
}

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (neonClient) {
    return neonClient;
  }

  const { connectionString } = getNeonConfig();
  neonClient = neon(connectionString);
  return neonClient;
}
