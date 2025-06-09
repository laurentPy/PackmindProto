// packmind-ui/src/data/dashboardData.ts
export interface DashboardData {
  services: { name: string; errors: number; warnings: number; infos: number }[];
  burnDown:  { week: string; open: number; closed: number }[];
  coverage: {
    totalAdrs:     number;
    enforcedAdrs:  number;
    unenforcedList: string[];
  };
  highSeverityTrend: { week: string; highSeverityCount: number }[];
  quarterlyAdrs:    { quarter: string; created: number; updated: number }[];
}

export const dashboardData: DashboardData = {
  services: [
    { name: "auth-service",    errors: 15, warnings:  5, infos: 2 },
    { name: "payment-service", errors: 10, warnings:  8, infos: 4 },
    { name: "ui-frontend",      errors: 5,  warnings: 12, infos: 6 },
    { name: "data-pipeline",   errors: 8,  warnings:  3, infos: 1 },
  ],
  burnDown: [
    { week: "2025-02-10", open: 42, closed: 8 },
    { week: "2025-02-17", open: 40, closed:10 },
    { week: "2025-02-24", open: 38, closed:15 },
    { week: "2025-03-03", open: 35, closed:12 },
    { week: "2025-03-10", open: 33, closed:14 },
    { week: "2025-03-17", open: 30, closed:18 },
    { week: "2025-03-24", open: 28, closed:20 },
    { week: "2025-03-31", open: 25, closed:22 },
  ],
  coverage: {
    totalAdrs:      20,
    enforcedAdrs:   12,
    unenforcedList: [
      "ADR-SEC-005","ADR-PERF-003","ADR-DB-002",
      "ADR-UI-004", "ADR-OPS-006", "ADR-INT-001",
      "ADR-LOG-007","ADR-DATA-008"
    ],
  },
  highSeverityTrend: [
    { week: "2025-01-01", highSeverityCount:20 },
    { week: "2025-01-08", highSeverityCount:18 },
    { week: "2025-01-15", highSeverityCount:16 },
    { week: "2025-01-22", highSeverityCount:14 },
    { week: "2025-01-29", highSeverityCount:12 },
    { week: "2025-02-05", highSeverityCount:11 },
    { week: "2025-02-12", highSeverityCount:10 },
    { week: "2025-02-19", highSeverityCount:9  },
    { week: "2025-02-26", highSeverityCount:8  },
    { week: "2025-03-05", highSeverityCount:7  },
    { week: "2025-03-12", highSeverityCount:6  },
    { week: "2025-03-19", highSeverityCount:5  },
  ],
  quarterlyAdrs: [
    { quarter: "Q2 2024", created: 4, updated: 2 },
    { quarter: "Q3 2024", created: 6, updated: 3 },
    { quarter: "Q4 2024", created: 3, updated: 5 },
    { quarter: "Q1 2025", created: 7, updated: 4 },
  ],
};
