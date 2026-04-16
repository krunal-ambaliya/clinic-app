export type PatientSummary = {
  id: string;
  fullName: string;
};

export async function listPatients(): Promise<PatientSummary[]> {
  return [];
}
