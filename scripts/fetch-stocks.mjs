import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// 종목을 추가하려면 여기에 Yahoo 코드를 넣으세요 (index.html의 stockList와 같은 코드)
const SYMBOLS = ['005930.KS', '005380.KS', '^KS11', '^GSPC'];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function quote(symbol) {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
              encodeURIComponent(symbol) + '?range=1d&interval=1d';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(symbol + ' HTTP ' + res.status);
  const meta = (await res.json()).chart.result[0].meta;
  return {
    price: meta.regularMarketPrice,
    prev: meta.chartPreviousClose ?? meta.previousClose,
    time: meta.regularMarketTime
  };
}

// 실패한 종목은 이전 값을 그대로 유지
const old = existsSync('stocks.json')
  ? (JSON.parse(readFileSync('stocks.json', 'utf8')).quotes ?? {})
  : {};
const quotes = { ...old };
let ok = 0;

for (const s of SYMBOLS) {
  try { quotes[s] = await quote(s); ok++; }
  catch (e) { console.error(e.message); }
  await new Promise(r => setTimeout(r, 500));
}

if (!ok) { console.error('모든 종목 조회 실패'); process.exit(1); }

writeFileSync('stocks.json', JSON.stringify({ quotes }, null, 1));
