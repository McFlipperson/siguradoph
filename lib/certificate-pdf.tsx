import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

export type CertPdfData = {
  dateIssued: string
  patientName: string
  age: string
  civilStatus: string
  address: string
  dateExamined: string
  procedures: { label: string; toothNo: string; diagnosis: string }[]
  findings: string
  recommendations: string[]
  dentistName: string
  prcLicenseNo: string
  signatureUrl: string | null
  clinicName: string
  clinicAddress: string
  clinicPhone: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const s = (StyleSheet.create as (x: Record<string, any>) => Record<string, any>)({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', color: '#111', lineHeight: 1.5 },
  dateRight: { textAlign: 'right', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, marginBottom: 18 },
  label: { fontWeight: 'bold' },
  row: { marginBottom: 4 },
  section: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  proc: { marginBottom: 6 },
  sig: { height: 56, width: 160, objectFit: 'contain', marginBottom: 2 },
  small: { fontSize: 9, color: '#555' },
  verify: { fontSize: 10, color: '#444', marginTop: 8 },
})

function CertDoc({ d }: { d: CertPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.dateRight}>Date: {d.dateIssued}</Text>
        <Text style={s.title}>DENTAL CERTIFICATE</Text>

        <Text style={s.row}>This is to certify that:</Text>
        <Text style={s.row}><Text style={s.label}>Name of Patient: </Text>{d.patientName}</Text>
        <Text style={s.row}>
          <Text style={s.label}>Age: </Text>{d.age}
          {d.civilStatus ? <Text>{'    '}<Text style={s.label}>Civil Status: </Text>{d.civilStatus}</Text> : <Text />}
        </Text>
        <Text style={s.row}><Text style={s.label}>Address: </Text>{d.address}</Text>

        <Text style={{ marginTop: 10, marginBottom: 8 }}>
          The above-named patient was examined and/or treated in this clinic on {d.dateExamined}.
        </Text>

        <Text style={s.section}>PROCEDURE(S) PERFORMED</Text>
        {d.procedures.length === 0 ? (
          <Text style={s.small}>—</Text>
        ) : d.procedures.map((p, i) => (
          <View key={i} style={s.proc}>
            <Text style={s.label}>{'☑'} {p.label}</Text>
            {p.toothNo ? <Text>   Tooth No.(s): {p.toothNo}</Text> : <Text />}
            {p.diagnosis ? <Text>   Diagnosis: {p.diagnosis}</Text> : <Text />}
          </View>
        ))}

        {d.findings ? (
          <View>
            <Text style={s.section}>FINDINGS / REMARKS</Text>
            <Text>{d.findings}</Text>
          </View>
        ) : <Text />}

        {d.recommendations.length > 0 ? (
          <View>
            <Text style={s.section}>RECOMMENDATIONS</Text>
            {d.recommendations.map((r, i) => <Text key={i}>{'☑'} {r}</Text>)}
          </View>
        ) : <Text />}

        <Text style={{ marginTop: 14 }}>
          This certification is issued upon the request of the patient for whatever legal purpose it may serve.
        </Text>
        <Text style={s.verify}>
          To verify the authenticity of this certificate, please contact {d.clinicName || 'the clinic'} at {d.clinicPhone}.
        </Text>

        <View style={{ marginTop: 28 }}>
          <Text style={{ marginBottom: 6 }}>Respectfully,</Text>
          {d.signatureUrl ? <Image src={d.signatureUrl} style={s.sig} /> : <Text />}
          <Text style={s.label}>Dr. {d.dentistName}</Text>
          <Text style={s.small}>Dentist</Text>
          {d.prcLicenseNo ? <Text style={{ marginTop: 4 }}>PRC License No.: {d.prcLicenseNo}</Text> : <Text />}
          <Text>Clinic Address: {d.clinicAddress}</Text>
          <Text>Contact No.: {d.clinicPhone}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function renderCertificatePdf(d: CertPdfData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (renderToBuffer as (doc: any) => Promise<Buffer>)(<CertDoc d={d} />)
}
