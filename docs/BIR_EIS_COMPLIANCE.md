# SiguradoPH — BIR EIS Compliance Plan

## Status: Research complete, implementation not yet started

---

## 1. What BIR EIS Is

The **Electronic Invoicing System (EIS)** is the BIR's mandate for covered taxpayers to generate invoices in structured JSON format, digitally sign them (JWS), and transmit them to the BIR within 3 calendar days of each transaction.

Governing regulations:
- **RR No. 8-2022** — original EIS framework (pilot with top 100 large taxpayers)
- **RR No. 11-2025** (Feb 27, 2025) — expanded mandate, effective March 14, 2025
- **RR No. 26-2025** — extended compliance deadline to **December 31, 2026**

---

## 2. Who Is Covered (Dec 31, 2026 Deadline)

| Category | Covered? |
|---|---|
| Micro-taxpayers (≤ ₱3,000,000 gross sales) | **EXEMPT** — no EIS required |
| E-commerce / internet transaction businesses (small, medium, large) | **YES** |
| Large Taxpayers Service (LTS) members (generally > ₱1B) | **YES** |
| **Users of Computerized Accounting Systems (CAS) or invoicing software** | **YES — grey area for SiguradoPH clients** |
| POS system users | **YES** |
| Exporters, registered enterprises with tax incentives | **YES** |
| Small/medium non-e-commerce, no CAS, not LTS | Not yet mandated — future phases TBD after 2026 |

### Key issue for SiguradoPH
The CAS/invoicing software category (row 3 above) is the risk. If BIR classifies SiguradoPH as "invoicing software capable of producing structured invoice data," then **any clinic using it above the micro-taxpayer threshold could be covered by Dec 31, 2026** — regardless of sales volume. This is legally ambiguous and each clinic owner should get a ruling from their CPA or tax lawyer.

### Practical reality for most dental clinics
Most small dental clinics are either:
- Micro-taxpayers (≤ ₱3M) → exempt
- Small taxpayers using SiguradoPH → grey zone, CAS rule may apply
- No clinic using SiguradoPH is likely LTS (> ₱1B)

---

## 3. Technical Requirements (What BIR Actually Requires)

### 3a. JSON Invoice — Required Fields
- Document type (Invoice, Official Receipt, Service Billing, Debit/Credit Note)
- Document ID (sequential, unique)
- Issue date and precise timestamp (ISO 8601)
- Seller details: name, address, TIN, **BIR Certificate of Registration (COR) number** ← often missed
- Buyer details: name, address, contact
- Line items: service description, quantity, unit price, amount
- Monetary summary: gross amount, discounts, taxable amount
- Tax information: VAT status, SC/PWD status, exemption code (e.g. NIRC §109)
- Total amount due
- Payment method
- Invoice status (draft / final / transmitted)

### 3b. JWS Digital Signature — MANDATORY, not in user's checklist
Every JSON invoice must be signed using **JSON Web Signature (JWS)** with a private key before transmission. BIR validates authenticity using the registered public key. Without this, the JSON is not a valid EIS submission.

Implementation notes:
- Taxpayer (clinic) registers a key pair with BIR
- SiguradoPH signs each invoice payload server-side before transmission
- Requires storing the clinic's private key securely (encrypted, never in client)

### 3c. Transmission
- Method: HTTPS API to BIR gateway, or manual upload via eSRS portal
- Window: **within 3 calendar days of transaction**
- Response: BIR returns acceptance or rejection; system must handle both
- All attempts must be logged immutably (timestamp, invoice ID, status, response)

### 3d. Permit to Transmit (PTT) — Software Certification
Before any transmission can happen, SiguradoPH must be certified:
1. Register on [eis-cert.bir.gov.ph](https://eis-cert.bir.gov.ph)
2. Provide company authorizations and representative IDs
3. Confirm valid BIR registration numbers
4. Demonstrate: JSON generation, JWS signing, BIR gateway connectivity
5. Receive **Permit to Transmit (PTT)**

**This is a prerequisite for everything else. Without PTT, the app cannot legally transmit to BIR.**

---

## 4. Assessment of the Checklist Provided

The checklist the user provided is a reasonable approximation. Here is the gap analysis:

### Correct ✅
- JSON invoice generation
- Required fields (mostly)
- HTTPS transmission
- Transmission logging (immutable)
- Retry/error handling
- Audit trail per invoice action
- SC/PWD ledger
- Sales journal
- Tax summary
- CSV/Excel export

### Missing or incorrect ❌
| Gap | Detail |
|---|---|
| **JWS digital signature** | Mandatory. Every JSON must be signed before transmission. Not mentioned at all in checklist. |
| **Permit to Transmit (PTT)** | Must be obtained from BIR before any transmission. Not mentioned. |
| **3-day transmission window** | Invoices must be transmitted within 3 calendar days. Not specified. |
| **BIR COR number in seller details** | Certificate of Registration number required, not just TIN. |
| **Transmission Log report** | Listed in checklist — correct, this is required. |
| **Data encryption at rest** | Checklist mentions it but SiguradoPH does not currently implement column-level encryption (Supabase disk encryption only). |

---

## 5. What Already Exists in SiguradoPH

| Requirement | Status |
|---|---|
| Official Receipt / invoice generation | ✅ Done |
| Sequential OR numbering | ✅ Done |
| Seller TIN stored on clinic | ✅ Done |
| VAT-exempt flag (NIRC §109) | ✅ Done — net = gross, VAT = 0 |
| SC/PWD discount with ID capture | ✅ Done |
| SC/PWD immutable audit log | ✅ Done |
| User access audit log (RA 10173) | ✅ Done |
| Invoice void (status change, not delete) | ✅ Done |
| JSON generation | ❌ Not yet |
| JWS digital signature | ❌ Not yet |
| BIR API transmission | ❌ Not yet |
| Transmission log | ❌ Not yet |
| PTT obtained | ❌ Not yet |
| General Ledger report | ❌ Not yet |
| Sales Journal report | ❌ Not yet (invoices list exists but not a formal report) |
| Tax Summary report | ❌ Not yet |
| Transmission Log report | ❌ Not yet |
| CSV/Excel export for all reports | ❌ Not yet (CPA quarterly report exports exist) |

---

## 6. Plan of Action (Phased)

### Phase 0 — Decision gate (before writing any code)
- [ ] Decide: is SiguradoPH pursuing BIR PTT certification as a software product?
- [ ] Register entity/company details with BIR EIS Certification Portal (eis-cert.bir.gov.ph)
- [ ] Confirm with a tax lawyer whether CAS rule applies to SiguradoPH clients
- [ ] Decide the toggle UX: per-clinic opt-in (some clinics may not need EIS)

### Phase 1 — Per-clinic BIR toggle
- [ ] Add `birEisEnabled` boolean to `Clinic` model in schema
- [ ] Add toggle in clinic Settings page
- [ ] When enabled: surface BIR-specific fields (COR number input for clinic)
- [ ] Add `birCorNumber` field to Clinic model

### Phase 2 — JSON invoice generation
- [ ] Build `generateEisJson(invoiceId)` function
- [ ] Output compliant JSON with all required fields (see Section 3a above)
- [ ] Include JWS signing placeholder (key pair management TBD pending PTT)
- [ ] Validate completeness before allowing transmission
- [ ] Store generated JSON on the Invoice record

### Phase 3 — JWS signing
- [ ] Per-clinic key pair storage (private key encrypted at rest)
- [ ] Key pair registration flow with BIR (manual initially)
- [ ] Sign every invoice JSON with clinic private key before transmission
- [ ] Verify signature locally before sending

### Phase 4 — BIR API transmission
- [ ] Integrate with BIR EIS gateway (endpoint TBD — obtain from PTT process)
- [ ] Immutable `EisTransmissionLog` table: invoiceId, timestamp, status, biRResponse, retryCount
- [ ] 3-day window enforcement: warn in UI if untransmitted invoices are approaching deadline
- [ ] Retry logic with exponential backoff
- [ ] Manual override: allow secretary to trigger transmission from invoice detail page

### Phase 5 — Reports
- [ ] Sales Journal: chronological invoice list with totals, exportable CSV
- [ ] Tax Summary: breakdown by VAT status / SC/PWD / service type
- [ ] SC/PWD Ledger: all discount transactions with ID numbers (already have data, needs report UI)
- [ ] Transmission Log: all EIS submissions with status
- [ ] General Ledger: all transactions with running balance (may overlap with CPA quarterly report)
- [ ] Excel/CSV export for all of the above

---

## 7. New Prisma Models Needed (Future)

```prisma
// Per-clinic BIR EIS configuration
// Add to Clinic model:
// birEisEnabled   Boolean @default(false)
// birCorNumber    String?
// birPrivateKey   String? // encrypted, never exposed to client

// Immutable transmission log
model EisTransmissionLog {
  id            String   @id @default(cuid())
  clinicId      String
  invoiceId     String
  attemptedAt   DateTime @default(now())
  status        String   // PENDING | SUCCESS | REJECTED | ERROR
  birResponse   String?  // raw BIR API response
  retryCount    Int      @default(0)
  eisJson       String   // the signed JSON that was transmitted (immutable record)
}
```

---

## 8. Key Sources

- [BIR EIS Certification Portal](https://eis-cert.bir.gov.ph)
- [BIR EIS Portal](https://eis.bir.gov.ph)
- [RTC Suite — Full EIS Technical Guide](https://rtcsuite.com/bir-e-invoicing-philippines-eis-by-2026-a-comprehensive-guide-to-scope-stages-and-technical-compliance/)
- [Flick Network — RR 11-2025 Guide](https://www.flick.network/en-ph/e-invoicing-philippines)
- [Aureda Law — Who is Covered, Extension Details](https://www.aureadalaw.com/post/bir-extends-compliance-period-for-electronic-invoicing-what-businesses-need-to-know)
- [KPMG — Deadline Extended to Dec 31 2026](https://kpmg.com/us/en/taxnewsflash/news/2025/10/philippines-e-invoicing-compliance-deadline-extended.html)
- [EDICOM — EIS Technical Overview](https://edicomgroup.com/blog/philippines-step-towards-mandatory-electronic-invoice)
- [PwC Philippines — Paperless Invoicing](https://www.pwc.com/ph/en/tax/tax-publications/taxwise-or-otherwise/2025/paperles-invoicing-and-sales-reporting.html)

---

## 9. Open Questions Before Starting

1. Will SiguradoPH register for PTT certification as a software provider?
2. Does Nova's company entity (AI Matters?) qualify for BIR EIS software registration?
3. What is the BIR gateway API endpoint URL? (Provided post-PTT certification)
4. How do we handle the private key per clinic — HSM, Supabase Vault, or KMS?
5. Should the BIR toggle be a paid add-on (aligns with the CPA feature monetization model)?
