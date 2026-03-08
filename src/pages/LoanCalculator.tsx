import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateEMI, generateAmortization } from '@/lib/loanCalculator';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(240);
  const [currency, setCurrency] = useState('INR');
  const [showTable, setShowTable] = useState(false);

  const result = calculateEMI(principal, rate, tenure);
  const amortization = showTable ? generateAmortization(principal, rate, tenure) : [];

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold text-foreground mb-6">Loan Calculator</h1>

      <Card className="mb-5">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Loan Amount</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Interest Rate (%)</Label>
              <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tenure (months)</Label>
              <Input type="number" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Monthly EMI</p>
            <p className="text-base font-semibold text-primary">{formatCurrency(result.emi, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Total Interest</p>
            <p className="text-base font-semibold text-destructive">{formatCurrency(result.totalInterest, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Total Payment</p>
            <p className="text-base font-semibold">{formatCurrency(result.totalPayment, currency)}</p>
          </CardContent>
        </Card>
      </div>

      <Button
        variant="link"
        onClick={() => setShowTable(!showTable)}
        className="px-0 mb-4 text-muted-foreground hover:text-foreground"
      >
        {showTable ? 'Hide' : 'Show'} Amortization Schedule
      </Button>

      {showTable && (
        <Card>
          <CardContent className="pt-4 overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Month</TableHead>
                  <TableHead>EMI</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortization.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{formatCurrency(row.emi, currency)}</TableCell>
                    <TableCell>{formatCurrency(row.principal, currency)}</TableCell>
                    <TableCell>{formatCurrency(row.interest, currency)}</TableCell>
                    <TableCell>{formatCurrency(row.balance, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
