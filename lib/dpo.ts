/**
 * Sigurado's OWN Data Protection Officer — the company acting as Personal
 * Information Processor (PIP) under RA 10173.
 *
 * This is a single, company-level record (one DPO for the whole company). It is
 * NOT per-clinic. Each clinic, as a Personal Information Controller (PIC),
 * appoints its own DPO — stored per-clinic on Clinic.dpoName/dpoEmail/dpoPhone.
 *
 * Used in the Data Processing Agreement and the public privacy policy.
 */
// TODO(confirm): verify the DPO's registered full name matches what you file
// with the NPC before launch. email/company below are used in public legal text.
export const SIGURADO_DPO = {
  name: 'Nova Brunet',
  email: 'privacy@sigurado.xyz',
  // Company/operating entity behind Sigurado (the PIP).
  company: 'AI Matters',
} as const
