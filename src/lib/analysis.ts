import { Database } from '@/types/database';

type Asset = Database['public']['Tables']['assets']['Row'];

export interface PortfolioAnalysis {
  totalValue: number;
  hhiIndex: number; // Herfindahl-Hirschman Index for concentration
  safetyScore: number; // 0-100
  dominantAsset: string;
  recommendation: string;
  allocations: { ticker: string; weight: number; value: number }[];
}

export function analyzePortfolio(assets: Asset[]): PortfolioAnalysis {
  if (assets.length === 0) {
    return {
      totalValue: 0,
      hhiIndex: 0,
      safetyScore: 0,
      dominantAsset: 'None',
      recommendation: "자산 데이터가 부족합니다. 스캔을 보류합니다.",
      allocations: []
    };
  }

  const values = assets.map(a => ({
    ticker: a.ticker,
    value: Number(a.current_price) * Number(a.quantity)
  }));

  const totalValue = values.reduce((sum, item) => sum + item.value, 0);
  
  const allocations = values.map(item => ({
    ticker: item.ticker,
    value: item.value,
    weight: item.value / totalValue
  })).sort((a, b) => b.weight - a.weight);

  // Calculate HHI (sum of squared weights)
  // HHI < 0.15 = Diversified, 0.15-0.25 = Moderate concentration, > 0.25 = High concentration
  const hhiIndex = allocations.reduce((sum, item) => sum + Math.pow(item.weight, 2), 0);
  
  // Calculate a mock "Safety Score" (Internal logic for Cold Unit)
  // Better safety with lower HHI (more diversity).
  let safetyScore = Math.max(0, 100 - (hhiIndex * 200));

  let dominantAsset = allocations[0]?.ticker || 'None';
  let recommendation = "";

  if (hhiIndex > 0.3) {
    recommendation = `경고: 단일 자산(${dominantAsset}) 집중도가 위험 수준(${Math.round(allocations[0].weight * 100)}%)입니다. 하락장 도래 시 포트폴리오 전체 붕괴 리스크가 존재합니다. 분산 투자를 즉각 설계하십시오.`;
    safetyScore -= 15;
  } else if (hhiIndex < 0.15) {
    recommendation = "데이터 확인: 자산 분산이 다변화(Diversified) 상태입니다. 변동성 장세 방어력이 우수합니다.";
  } else {
    recommendation = `자산 집중도(${Math.round(allocations[0].weight * 100)}%, ${dominantAsset})가 임계점에 근접했습니다. 추가 매집 시 주의가 요구됩니다.`;
  }

  return {
    totalValue,
    hhiIndex,
    safetyScore: Math.round(safetyScore),
    dominantAsset,
    recommendation,
    allocations
  };
}
