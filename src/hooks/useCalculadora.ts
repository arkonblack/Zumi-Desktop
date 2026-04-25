export const fmt = (n: number) => new Intl.NumberFormat('de-DE').format(n);

const DENOMINACIONES = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

export function evaluarExpresion(expr: string): number {
  const e = String(expr)
    .replace(/\./g, '')
    .replace(/[×xX]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9+\-*/]/g, '')
    .replace(/[+\-*/]+$/, '');

  if (!e) return 0;

  try {
    const tokens = e.match(/\d+|[+\-*/]/g);
    if (!tokens) return 0;

    const nums: number[] = [];
    const ops: string[]  = [];
    tokens.forEach(t => (/^\d+$/.test(t) ? nums.push(+t) : ops.push(t)));

    if (ops.length !== nums.length - 1 || nums.length === 0) return 0;

    let i = 0;
    while (i < ops.length) {
      if (ops[i] === '*' || ops[i] === '/') {
        const r = ops[i] === '*'
          ? nums[i] * nums[i + 1]
          : nums[i + 1] !== 0 ? Math.round(nums[i] / nums[i + 1]) : 0;
        nums.splice(i, 2, r);
        ops.splice(i, 1);
      } else { i++; }
    }

    let total = nums[0];
    for (let k = 0; k < ops.length; k++)
      total = ops[k] === '+' ? total + nums[k + 1] : total - nums[k + 1];

    return isNaN(total) ? 0 : Math.round(total);
  } catch { return 0; }
}

export function formatInput(raw: string): string {
  let r = raw.replace(/[^0-9+\-*×xX/÷]/g, '');
  r = r.replace(/[×xX]/g, '*').replace(/÷/g, '/');
  return r.replace(/\d+/g, n => fmt(+n));
}

export type ResultadoCalculo =
  | { estado: 'vacio';        vuelto: 0;      desglose: [] }
  | { estado: 'insuficiente'; vuelto: number; desglose: [] }
  | { estado: 'ok';           vuelto: number; desglose: { denom: number; cantidad: number }[] };

export function calcularVuelto(total: number, recibido: number): ResultadoCalculo {
  if (recibido === 0) return { estado: 'vacio',        vuelto: 0, desglose: [] };
  if (recibido < total) return { estado: 'insuficiente', vuelto: total - recibido, desglose: [] };

  let v = recibido - total;
  const desglose: { denom: number; cantidad: number }[] = [];
  DENOMINACIONES.forEach(d => {
    const c = Math.floor(v / d);
    if (c > 0) { desglose.push({ denom: d, cantidad: c }); v %= d; }
  });
  return { estado: 'ok', vuelto: recibido - total, desglose };
}
