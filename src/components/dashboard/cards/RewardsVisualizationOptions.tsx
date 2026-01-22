// components/dashboard/cards/RewardsVisualizationOptions.tsx
/**
 * Sankey diagram showing credit card spend flowing into loyalty programs
 * Cards on left → Programs on right, with earn rate in tooltips
 */

import React, { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, PaymentMethod } from "@/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { ArrowRightLeftIcon } from "lucide-react";

interface RewardsVisualizationOptionsProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  className?: string;
}

// Aggregate data by card and points program
function aggregateRewardsData(transactions: Transaction[]) {
  const cardToProgram = new Map<
    string,
    Map<
      string,
      { points: number; spend: number; logoUrl?: string; logoBgColor?: string }
    >
  >();
  const cardTotals = new Map<
    string,
    { spend: number; points: number; name: string; imageUrl: string | null }
  >();
  const programTotals = new Map<
    string,
    { points: number; logoUrl?: string; bgColor?: string; logoScale?: number }
  >();

  transactions.forEach((tx) => {
    if (!tx.paymentMethod || tx.rewardPoints <= 0) return;
    if (tx.paymentMethod.type !== "credit_card") return;

    const cardName =
      tx.paymentMethod.nickname ||
      `${tx.paymentMethod.issuer} ${tx.paymentMethod.name}`;
    const program = tx.paymentMethod.pointsCurrency || "Points";
    const spend = tx.paymentAmount ?? tx.amount;

    // Card to program mapping
    if (!cardToProgram.has(cardName)) {
      cardToProgram.set(cardName, new Map());
    }
    const programMap = cardToProgram.get(cardName)!;
    const existing = programMap.get(program) || { points: 0, spend: 0 };
    programMap.set(program, {
      points: existing.points + tx.rewardPoints,
      spend: existing.spend + spend,
      logoUrl: tx.paymentMethod.rewardCurrencyLogoUrl,
      logoBgColor: tx.paymentMethod.rewardCurrencyBgColor,
    });

    // Card totals
    const cardTotal = cardTotals.get(cardName) || {
      spend: 0,
      points: 0,
      name: cardName,
      imageUrl: tx.paymentMethod.imageUrl,
    };
    cardTotals.set(cardName, {
      ...cardTotal,
      spend: cardTotal.spend + spend,
      points: cardTotal.points + tx.rewardPoints,
      imageUrl: cardTotal.imageUrl || tx.paymentMethod.imageUrl,
    });

    // Program totals with logo
    const programTotal = programTotals.get(program) || { points: 0 };
    programTotals.set(program, {
      points: programTotal.points + tx.rewardPoints,
      logoUrl: programTotal.logoUrl || tx.paymentMethod.rewardCurrencyLogoUrl,
      bgColor: programTotal.bgColor || tx.paymentMethod.rewardCurrencyBgColor,
      logoScale:
        programTotal.logoScale || tx.paymentMethod.rewardCurrencyLogoScale,
    });
  });

  return { cardToProgram, cardTotals, programTotals };
}

// Color palette for cards
const CARD_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
  "#795548",
  "#607D8B",
];

// Color palette for points programs
const PROGRAM_COLORS: Record<string, string> = {
  "Asia Miles": "#6B2C91",
  "Citi ThankYou Points (SG)": "#003DA5",
  "Aeroplan Points": "#F26724",
  "Membership Rewards Points (CA)": "#006FCF",
  "DBS Points": "#E31837",
  "HSBC Rewards Points": "#DB0011",
  OCBC$: "#E31837",
  Points: "#9E9E9E",
};

const getProgramColor = (program: string) => {
  if (PROGRAM_COLORS[program]) return PROGRAM_COLORS[program];
  // Check partial matches
  for (const [key, color] of Object.entries(PROGRAM_COLORS)) {
    if (program.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#9E9E9E";
};

// Format program names for display (full name)
const formatProgramName = (name: string): string => {
  return name;
};

// Format card names for display (full name)
const formatCardName = (name: string): string => {
  return name;
};

interface SankeyNode {
  id: string;
  nodeColor: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  spend: number;
  earnRate: number;
}

interface CardMeta {
  id: string;
  name: string;
  imageUrl: string | null;
  points: number;
  spend: number;
}

interface ProgramMeta {
  id: string;
  name: string;
  points: number;
  logoUrl?: string;
  bgColor?: string;
  logoScale?: number;
}

/**
 * Rewards Sankey - Cards → Programs flow (2 columns)
 */
const RewardsFlowSankey: React.FC<RewardsVisualizationOptionsProps> = ({
  transactions,
  className = "",
}) => {
  const { displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  const {
    sankeyData,
    cardsData,
    programsData,
    totalPoints,
    totalSpend,
    linkMeta,
  } = useMemo(() => {
    const { cardToProgram, cardTotals, programTotals } =
      aggregateRewardsData(transactions);

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    const linkMetaMap = new Map<
      string,
      {
        spend: number;
        earnRate: number;
        cardImage?: string | null;
        programLogo?: string;
        programBgColor?: string;
      }
    >();

    // Build cards (left side nodes)
    const cards: CardMeta[] = Array.from(cardTotals.entries())
      .map(([name, data], idx) => {
        const shortName = formatCardName(name);
        nodes.push({
          id: shortName,
          nodeColor: CARD_COLORS[idx % CARD_COLORS.length],
        });
        return {
          id: shortName,
          name,
          imageUrl: data.imageUrl,
          points: data.points,
          spend: data.spend,
        };
      })
      .sort((a, b) => b.points - a.points);

    // Build programs (right side nodes)
    const programs: ProgramMeta[] = Array.from(programTotals.entries())
      .map(([name, data], idx) => {
        const shortName = formatProgramName(name);
        nodes.push({
          id: shortName,
          nodeColor: getProgramColor(name),
        });
        return {
          id: shortName,
          name,
          points: data.points,
          logoUrl: data.logoUrl,
          bgColor: data.bgColor,
          logoScale: data.logoScale,
        };
      })
      .sort((a, b) => b.points - a.points);

    // Build links (card → program flows)
    cardToProgram.forEach((programMap, cardName) => {
      const cardData = cardTotals.get(cardName);
      if (!cardData) return;

      const shortCardName = formatCardName(cardName);

      programMap.forEach((pData, program) => {
        if (pData.points > 0) {
          const shortProgram = formatProgramName(program);
          const earnRate = pData.spend > 0 ? pData.points / pData.spend : 0;

          links.push({
            source: shortCardName,
            target: shortProgram,
            value: pData.points,
            spend: pData.spend,
            earnRate,
          });

          // Store metadata for tooltips
          linkMetaMap.set(`${shortCardName}->${shortProgram}`, {
            spend: pData.spend,
            earnRate,
            cardImage: cardData.imageUrl,
            programLogo: pData.logoUrl,
            programBgColor: pData.logoBgColor,
          });
        }
      });
    });

    const total = programs.reduce((sum, p) => sum + p.points, 0);
    const spend = cards.reduce((sum, c) => sum + c.spend, 0);

    return {
      sankeyData: { nodes, links },
      cardsData: cards,
      programsData: programs,
      totalPoints: total,
      totalSpend: spend,
      linkMeta: linkMetaMap,
    };
  }, [transactions]);

  if (cardsData.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowRightLeftIcon className="h-5 w-5 text-primary" />
          Rewards Flow
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Card spend flows into loyalty programs. Hover for earn rate details.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveSankey
            data={sankeyData}
            margin={{ top: 10, right: 280, bottom: 10, left: 280 }}
            align="justify"
            colors={(node) => node.nodeColor || "#888"}
            nodeOpacity={1}
            nodeHoverOpacity={1}
            nodeThickness={18}
            nodeSpacing={12}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={0.4}
            linkHoverOpacity={0.7}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={12}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 1]],
            }}
            label={(node) => node.id}
            nodeTooltip={({ node }) => {
              // Find card or program metadata
              const card = cardsData.find((c) => c.id === node.id);
              const program = programsData.find((p) => p.id === node.id);

              if (card) {
                return (
                  <div className="bg-popover text-popover-foreground px-4 py-3 rounded-md shadow-md border">
                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="h-16 w-24 object-contain rounded mb-2"
                      />
                    )}
                    <div className="text-sm">You have spent</div>
                    <div className="font-bold">
                      {formatCurrency(card.spend)}
                    </div>
                  </div>
                );
              }

              if (program) {
                return (
                  <div className="bg-popover text-popover-foreground px-4 py-3 rounded-md shadow-md border">
                    {program.logoUrl && (
                      <div
                        className="h-12 w-12 flex items-center justify-center rounded-full overflow-hidden mb-2"
                        style={{
                          backgroundColor: program.bgColor || "#ffffff",
                        }}
                      >
                        <img
                          src={program.logoUrl}
                          alt={program.name}
                          className="w-full h-full object-contain"
                          style={
                            program.logoScale
                              ? { transform: `scale(${program.logoScale})` }
                              : undefined
                          }
                        />
                      </div>
                    )}
                    <div className="text-sm">You have earned</div>
                    <div className="font-bold">
                      {program.points.toLocaleString()} pts
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-popover text-popover-foreground px-4 py-3 rounded-md shadow-md border text-sm min-w-48">
                  <strong className="text-base">{node.id}</strong>
                  <br />
                  {node.value.toLocaleString()} pts
                </div>
              );
            }}
            linkTooltip={({ link }) => {
              const meta = linkMeta.get(`${link.source.id}->${link.target.id}`);
              return (
                <div className="bg-popover text-popover-foreground px-4 py-3 rounded-lg shadow-lg border text-sm min-w-64">
                  <div className="flex items-center gap-2 mb-2">
                    {meta?.cardImage && (
                      <img
                        src={meta.cardImage}
                        alt=""
                        className="h-5 w-8 object-contain rounded-sm"
                      />
                    )}
                    <span className="font-medium">{link.source.id}</span>
                    <span className="text-muted-foreground">→</span>
                    {meta?.programLogo && (
                      <div
                        className="h-5 w-5 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: meta.programBgColor || "#f0f0f0",
                        }}
                      >
                        <img
                          src={meta.programLogo}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <span className="font-medium">{link.target.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Spend</p>
                      <p className="font-medium">
                        {formatCurrency(meta?.spend || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-medium text-primary">
                        {(meta?.earnRate || 0).toFixed(2)}x
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Points</p>
                      <p className="font-medium">
                        {link.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsFlowSankey;
