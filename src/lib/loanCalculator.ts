export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
}

export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): EMIResult {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return { emi, totalInterest: 0, totalPayment: principal };
  }
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalPayment = emi * tenureMonths;
  return { emi, totalInterest: totalPayment - principal, totalPayment };
}

export function generateAmortization(principal: number, annualRate: number, tenureMonths: number): AmortizationRow[] {
  const { emi } = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPart = emi - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month: i, emi, principal: principalPart, interest, balance });
  }
  return rows;
}
