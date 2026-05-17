export function computeVat(grossAmount: number) {
  const net = grossAmount / 1.12
  const vat = grossAmount - net
  return {
    gross: grossAmount,
    net: parseFloat(net.toFixed(2)),
    vat: parseFloat(vat.toFixed(2)),
  }
}
