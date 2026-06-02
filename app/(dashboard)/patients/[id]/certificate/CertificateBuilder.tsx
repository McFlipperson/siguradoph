'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { emailCertificate } from './actions'

type LatestVisit = { date: string; treatment: string; toothNumber: string; diagnosis: string; notes: string } | null

type Props = {
  patientId: string
  patientEmail: string
  patientName: string
  age: number
  address: string
  clinicName: string
  dentistName: string
  prcLicenseNo: string
  signatureUrl: string | null
  clinicAddress: string
  clinicPhone: string
  latestVisit: LatestVisit
}

type Procedure = { key: string; label: string; checked: boolean; toothNo: string; diagnosis: string }

const PROCEDURE_DEFS: { key: string; label: string; kw: string[] }[] = [
  { key: 'checkup', label: 'Dental Check-up', kw: ['check', 'consult'] },
  { key: 'prophy', label: 'Oral Prophylaxis (Cleaning)', kw: ['prophylaxis', 'cleaning', 'prophy'] },
  { key: 'extraction', label: 'Tooth Extraction', kw: ['extraction', 'extract'] },
  { key: 'filling', label: 'Tooth Filling(s)', kw: ['filling', 'fill'] },
  { key: 'surgery', label: 'Surgery', kw: ['surgery', 'surgical'] },
  { key: 'others', label: 'Others', kw: [] },
]

const RECOMMENDATION_DEFS = [
  'Patient is advised to continue prescribed medications.',
  'Patient is advised to return for follow-up treatment.',
  'Patient is advised to undergo further dental procedures as indicated.',
  'Patient is fit to resume work/school activities.',
]

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function CertificateBuilder(props: Props) {
  const router = useRouter()
  const today = fmtDate(new Date())

  // Pre-fill procedures from the most recent visit (dentist can edit anything).
  const initProcedures: Procedure[] = (() => {
    const t = (props.latestVisit?.treatment ?? '').toLowerCase()
    const tooth = props.latestVisit?.toothNumber ?? ''
    const dx = props.latestVisit?.diagnosis ?? ''
    let anyMatched = false
    const rows = PROCEDURE_DEFS.map((p) => {
      const matched = p.kw.some((k) => t.includes(k))
      if (matched) anyMatched = true
      return {
        key: p.key,
        label: p.label,
        checked: matched,
        toothNo: matched ? tooth : '',
        diagnosis: matched ? dx : '',
      }
    })
    // If nothing matched but there was a treatment, drop it under "Others".
    if (!anyMatched && props.latestVisit?.treatment) {
      const others = rows.find((r) => r.key === 'others')!
      others.checked = true
      others.toothNo = tooth
      others.diagnosis = props.latestVisit.treatment + (dx ? ` — ${dx}` : '')
    }
    return rows
  })()

  const [dateIssued, setDateIssued] = useState(today)
  const [patientName, setPatientName] = useState(props.patientName)
  const [age, setAge] = useState(String(props.age))
  const [civilStatus, setCivilStatus] = useState('')
  const [address, setAddress] = useState(props.address)
  const [dateExamined, setDateExamined] = useState(props.latestVisit ? fmtDate(new Date(props.latestVisit.date)) : today)
  const [othersLabel, setOthersLabel] = useState('')
  const [procedures, setProcedures] = useState<Procedure[]>(initProcedures)
  const [findings, setFindings] = useState(props.latestVisit?.notes ?? '')
  const [recommendations, setRecommendations] = useState(RECOMMENDATION_DEFS.map((label) => ({ label, checked: false })))
  const [otherRecommendation, setOtherRecommendation] = useState('')
  const [dentistName, setDentistName] = useState(props.dentistName)
  const [prcLicenseNo, setPrcLicenseNo] = useState(props.prcLicenseNo)
  const [clinicAddress, setClinicAddress] = useState(props.clinicAddress)
  const [clinicPhone, setClinicPhone] = useState(props.clinicPhone)
  const [recipient, setRecipient] = useState(props.patientEmail)
  const [isSending, startSending] = useTransition()

  function setProc(i: number, patch: Partial<Procedure>) {
    setProcedures((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  function sendEmail() {
    if (!recipient.includes('@')) { toast.error('Enter the patient\'s email address'); return }
    startSending(async () => {
      try {
        const res = await emailCertificate({
          to: recipient,
          patientId: props.patientId,
          dateIssued,
          patientName,
          age,
          civilStatus,
          address,
          dateExamined,
          procedures: procedures.filter((p) => p.checked).map((p) => ({
            label: p.key === 'others' ? (othersLabel || 'Others') : p.label,
            toothNo: p.toothNo,
            diagnosis: p.diagnosis,
          })),
          findings,
          recommendations: [
            ...recommendations.filter((r) => r.checked).map((r) => r.label),
            ...(otherRecommendation.trim() ? [otherRecommendation.trim()] : []),
          ],
          dentistName,
          prcLicenseNo,
          signatureUrl: props.signatureUrl,
          clinicName: props.clinicName,
          clinicAddress,
          clinicPhone,
        })
        if (res.ok) toast.success(`Certificate emailed to ${recipient}`)
        else toast.error(res.error ?? 'Failed to send')
      } catch {
        toast.error('Failed to send')
      }
    })
  }

  const line = 'border-b border-gray-400 outline-none bg-transparent px-1'

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Toolbar (hidden on print) */}
      <div className="no-print mb-4 sticky top-0 bg-background py-2 z-10 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => router.back()} className="text-sm text-muted-foreground underline">← Back</button>
          <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl border font-semibold text-sm">
            Print / Save PDF
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="patient@email.com"
            className="flex-1 min-h-[44px] rounded-xl border bg-background px-3 text-sm"
          />
          <button onClick={sendEmail} disabled={isSending} className="px-5 min-h-[44px] rounded-xl bg-emerald-600 text-white font-semibold text-sm disabled:opacity-50">
            {isSending ? 'Sending…' : 'Email Certificate'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Edit any field below, then email it to the patient (PDF) or print/save it.</p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cert-doc, #cert-doc * { visibility: visible; }
          #cert-doc { position: absolute; left: 0; top: 0; width: 100%; padding: 8mm 6mm; }
          .no-print { display: none !important; }
          #cert-doc input, #cert-doc textarea { border: none !important; resize: none; }
        }
      `}</style>

      {/* The certificate document */}
      <div id="cert-doc" className="bg-white text-black border rounded-lg p-6 sm:p-10 leading-relaxed text-[13px]">
        <div className="text-right mb-6">
          Date: <input value={dateIssued} onChange={(e) => setDateIssued(e.target.value)} className={`${line} w-48 text-center`} />
        </div>

        <h1 className="text-center text-lg font-bold tracking-wide mb-6">DENTAL CERTIFICATE</h1>

        <p className="mb-3">This is to certify that:</p>
        <div className="space-y-2 mb-5">
          <div>Name of Patient: <input value={patientName} onChange={(e) => setPatientName(e.target.value)} className={`${line} w-2/3`} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>Age: <input value={age} onChange={(e) => setAge(e.target.value)} className={`${line} w-16 text-center`} /></span>
            <span>Civil Status: <input value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)} className={`${line} w-40`} /></span>
          </div>
          <div>Address: <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${line} w-3/4`} /></div>
        </div>

        <p className="mb-4">
          The above-named patient was examined and/or treated in this clinic on{' '}
          <input value={dateExamined} onChange={(e) => setDateExamined(e.target.value)} className={`${line} w-48 text-center`} />.
        </p>

        <p className="font-semibold mb-2">PROCEDURE(S) PERFORMED</p>
        <div className="space-y-3 mb-5">
          {procedures.map((p, i) => (
            <div key={p.key} className="space-y-1">
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" checked={p.checked} onChange={(e) => setProc(i, { checked: e.target.checked })} className="w-4 h-4" />
                {p.label === 'Others' ? (
                  <span>Others: <input value={othersLabel} onChange={(e) => setOthersLabel(e.target.value)} className={`${line} w-64`} /></span>
                ) : p.label}
              </label>
              <div className="pl-6 flex flex-wrap gap-x-6 gap-y-1">
                <span>Tooth No.(s): <input value={p.toothNo} onChange={(e) => setProc(i, { toothNo: e.target.value })} className={`${line} w-32`} /></span>
                <span>Diagnosis: <input value={p.diagnosis} onChange={(e) => setProc(i, { diagnosis: e.target.value })} className={`${line} w-64`} /></span>
              </div>
            </div>
          ))}
        </div>

        <p className="font-semibold mb-1">FINDINGS / REMARKS</p>
        <textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={3} className="w-full border-b border-gray-400 outline-none bg-transparent px-1 mb-5" />

        <p className="font-semibold mb-2">RECOMMENDATIONS</p>
        <div className="space-y-1.5 mb-6">
          {recommendations.map((r, i) => (
            <label key={i} className="flex items-start gap-2">
              <input type="checkbox" checked={r.checked} onChange={(e) => setRecommendations((prev) => prev.map((x, idx) => idx === i ? { ...x, checked: e.target.checked } : x))} className="w-4 h-4 mt-0.5" />
              <span>{r.label}</span>
            </label>
          ))}
          <div className="flex items-center gap-2">
            <span>☐ Others:</span>
            <input value={otherRecommendation} onChange={(e) => setOtherRecommendation(e.target.value)} className={`${line} flex-1`} />
          </div>
        </div>

        <p className="mb-3">This certification is issued upon the request of the patient for whatever legal purpose it may serve.</p>

        <p className="mb-8 text-[12px] text-gray-700">
          To verify the authenticity of this certificate, please contact {props.clinicName || 'the clinic'} at{' '}
          <input value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className={`${line} w-48`} />.
        </p>

        <div className="mt-10">
          <p className="mb-2">Respectfully,</p>
          {props.signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.signatureUrl} alt="Signature" className="h-16 w-auto object-contain mb-1" />
          )}
          <div>Dr. <input value={dentistName} onChange={(e) => setDentistName(e.target.value)} className={`${line} w-2/3 font-medium`} /></div>
          <p className="text-xs text-gray-600 mt-0.5">Dentist</p>
          <div className="mt-3 space-y-1">
            <div>PRC License No.: <input value={prcLicenseNo} onChange={(e) => setPrcLicenseNo(e.target.value)} className={`${line} w-48`} /></div>
            <div>Clinic Address: <input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className={`${line} w-3/4`} /></div>
            <div>Contact No.: <input value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className={`${line} w-56`} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
