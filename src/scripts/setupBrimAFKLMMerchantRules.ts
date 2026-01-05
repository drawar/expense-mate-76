/**
 * Script to add merchant-specific bonus rules for Brim Financial Air France KLM World Elite Mastercard
 *
 * These are online-only merchant bonuses with varying earn rates.
 * Values shown are TOTAL Flying Blue points (base + bonus).
 *
 * Base rate: 1 mile per $1
 * Example: 12 miles/$1 total = 1 base + 11 bonus
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

interface MerchantRule {
  merchants: string[];
  totalMultiplier: number;
  category: string;
  isFlat?: boolean; // For Disney+ 150 flat points
}

// Organize merchants by earn rate for easier maintenance
// Source: Official Brim Financial Air France KLM merchant rewards table
const merchantRules: MerchantRule[] = [
  // Disney+ - 150 flat points per transaction (special case)
  {
    merchants: ["Disney+", "DISNEY+", "Disney Plus", "DISNEYPLUS"],
    totalMultiplier: 150,
    category: "Entertainment",
    isFlat: true,
  },

  // 12x merchants
  {
    merchants: ["Martinic Audio", "MARTINIC"],
    totalMultiplier: 12,
    category: "Entertainment",
  },

  // 8x merchants
  {
    merchants: ["Blinkist", "BLINKIST"],
    totalMultiplier: 8,
    category: "Education",
  },

  // 7x merchants
  {
    merchants: ["Charlotte Tilbury", "CHARLOTTE TILBURY"],
    totalMultiplier: 7,
    category: "Beauty",
  },
  {
    merchants: ["zChocolat", "ZCHOCOLAT"],
    totalMultiplier: 7,
    category: "Food & Gifts",
  },

  // 6x merchants
  { merchants: ["jAlbum", "JALBUM"], totalMultiplier: 6, category: "Software" },

  // 4.5x merchants
  {
    merchants: ["GoDaddy", "GODADDY"],
    totalMultiplier: 4.5,
    category: "Software & Services",
  },
  {
    merchants: ["Mideer Toys", "MIDEER"],
    totalMultiplier: 4.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Nobis", "NOBIS"],
    totalMultiplier: 4.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Petsnowy", "PETSNOWY"],
    totalMultiplier: 4.5,
    category: "Pet",
  },

  // 4x merchants
  {
    merchants: ["Big Bat Box", "BIG BAT BOX"],
    totalMultiplier: 4,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Columbia", "COLUMBIA"],
    totalMultiplier: 4,
    category: "Shopping & Retail",
  },
  { merchants: ["Endoca", "ENDOCA"], totalMultiplier: 4, category: "Health" },
  {
    merchants: ["Gigi New York", "GIGI NEW YORK"],
    totalMultiplier: 4,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Hover", "HOVER"],
    totalMultiplier: 4,
    category: "Software & Services",
  },
  {
    merchants: ["Love & Pebble", "LOVE & PEBBLE", "LOVE AND PEBBLE"],
    totalMultiplier: 4,
    category: "Beauty",
  },
  {
    merchants: ["The Outnet", "THE OUTNET", "OUTNET"],
    totalMultiplier: 4,
    category: "Shopping & Retail",
  },
  {
    merchants: ["TurboTax", "TURBOTAX"],
    totalMultiplier: 4,
    category: "Software & Services",
  },
  {
    merchants: ["UPERFECT", "UPERFECT"],
    totalMultiplier: 4,
    category: "Electronics",
  },

  // 3.5x merchants
  {
    merchants: ["Angles90", "ANGLES90"],
    totalMultiplier: 3.5,
    category: "Fitness",
  },
  {
    merchants: ["Backroad Maps", "BACKROAD MAPS"],
    totalMultiplier: 3.5,
    category: "Travel",
  },
  {
    merchants: ["Fanatics", "FANATICS"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["FunnyFuzzy", "FUNNYFUZZY"],
    totalMultiplier: 3.5,
    category: "Pet",
  },
  {
    merchants: ["Stanley", "STANLEY"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Stutterheim", "STUTTERHEIM"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["lululemon", "LULULEMON"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },

  // 3x merchants
  {
    merchants: ["ACEBEAM Flashlight", "ACEBEAM"],
    totalMultiplier: 3,
    category: "Electronics",
  },
  {
    merchants: ["Amiro Beauty", "AMIRO"],
    totalMultiplier: 3,
    category: "Beauty",
  },
  {
    merchants: ["Asebbo", "ASEBBO"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Bang & Olufsen", "BANG & OLUFSEN", "B&O"],
    totalMultiplier: 3,
    category: "Electronics",
  },
  {
    merchants: ["Cloudfield", "CLOUDFIELD"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Crocs", "CROCS"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Earthlove", "EARTHLOVE"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Europcar", "EUROPCAR"],
    totalMultiplier: 3,
    category: "Travel",
  },
  {
    merchants: ["Farfetch", "FARFETCH"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Fofana", "FOFANA"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["GAFLY", "GAFLY"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Hana Emi", "HANA EMI"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Happy Sinks", "HAPPY SINKS"],
    totalMultiplier: 3,
    category: "Home",
  },
  {
    merchants: ["Hieno", "HIENO"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["INDO Trick Scooter", "INDO"],
    totalMultiplier: 3,
    category: "Sports",
  },
  {
    merchants: ["IPRoyal", "IPROYAL"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Joseph A Bank", "JOSEPH A BANK", "JOS A BANK"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Jukebox", "JUKEBOX"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  { merchants: ["Kailo", "KAILO"], totalMultiplier: 3, category: "Health" },
  {
    merchants: ["LARQ", "LARQ"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["MLBshop.com", "MLBSHOP", "MLB SHOP"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["MLS Shop", "MLS SHOP", "MLSSHOP"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  { merchants: ["Mejuri", "MEJURI"], totalMultiplier: 3, category: "Jewelry" },
  { merchants: ["Mioeco", "MIOECO"], totalMultiplier: 3, category: "Home" },
  {
    merchants: ["Onemile", "ONEMILE"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Ontaki", "ONTAKI"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Pure Scentum", "PURE SCENTUM"],
    totalMultiplier: 3,
    category: "Beauty",
  },
  {
    merchants: ["Puzzle Ready", "PUZZLE READY"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  { merchants: ["Reibii", "REIBII"], totalMultiplier: 3, category: "Home" },
  {
    merchants: ["Retro Stage", "RETRO STAGE"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Silginnes", "SILGINNES"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Speraxsports", "SPERAXSPORTS", "SPERAX"],
    totalMultiplier: 3,
    category: "Sports",
  },
  {
    merchants: ["Steve Madden", "STEVE MADDEN"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Striking Viking", "STRIKING VIKING"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Throwback Traits", "THROWBACK TRAITS"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Tobe Outerwear", "TOBE OUTERWEAR", "TOBE"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Torras", "TORRAS"],
    totalMultiplier: 3,
    category: "Electronics",
  },
  {
    merchants: ["Unicoeye", "UNICOEYE"],
    totalMultiplier: 3,
    category: "Beauty",
  },
  {
    merchants: ["Vanpowers", "VANPOWERS"],
    totalMultiplier: 3,
    category: "Electronics",
  },
  {
    merchants: ["VersaDesk", "VERSADESK"],
    totalMultiplier: 3,
    category: "Office",
  },
  {
    merchants: ["Victory Range Hoods", "VICTORY RANGE HOODS"],
    totalMultiplier: 3,
    category: "Home",
  },
  {
    merchants: ["Waterdrop (US)", "WATERDROP"],
    totalMultiplier: 3,
    category: "Shopping & Retail",
  },

  // 2.5x merchants
  {
    merchants: ["AKU Footwear", "AKU"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Blenders Eyewear", "BLENDERS"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Camper", "CAMPER"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Decathlon", "DECATHLON"],
    totalMultiplier: 2.5,
    category: "Sports",
  },
  {
    merchants: ["Fossil", "FOSSIL"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Keetsa Mattress", "KEETSA"],
    totalMultiplier: 2.5,
    category: "Home",
  },
  {
    merchants: ["Lightailing", "LIGHTAILING"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["NBA Store", "NBA STORE", "NBASTORE"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["NFL Shop", "NFL SHOP", "NFLSHOP"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Rossignol", "ROSSIGNOL"],
    totalMultiplier: 2.5,
    category: "Sports",
  },
  {
    merchants: ["SOREL", "SOREL"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Salomon", "SALOMON"],
    totalMultiplier: 2.5,
    category: "Sports",
  },
  {
    merchants: ["Stubhub", "STUBHUB"],
    totalMultiplier: 2.5,
    category: "Entertainment",
  },
  {
    merchants: ["Tilley", "TILLEY"],
    totalMultiplier: 2.5,
    category: "Shopping & Retail",
  },

  // 2x merchants
  {
    merchants: ["AOSEED", "AOSEED"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["AW Bridal", "AW BRIDAL"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  { merchants: ["Acer", "ACER"], totalMultiplier: 2, category: "Electronics" },
  { merchants: ["Aiper", "AIPER"], totalMultiplier: 2, category: "Home" },
  {
    merchants: ["Allies of Skin", "ALLIES OF SKIN"],
    totalMultiplier: 2,
    category: "Beauty",
  },
  {
    merchants: ["Aquabatics", "AQUABATICS"],
    totalMultiplier: 2,
    category: "Sports",
  },
  { merchants: ["Babor", "BABOR"], totalMultiplier: 2, category: "Beauty" },
  {
    merchants: ["Bass Pro Shops", "BASS PRO SHOPS", "BASS PRO"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["BloomChic", "BLOOMCHIC"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Bluetti CA", "BLUETTI"],
    totalMultiplier: 2,
    category: "Electronics",
  },
  {
    merchants: ["Brochu Walker", "BROCHU WALKER"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Canadian Coin & Currency", "CANADIAN COIN"],
    totalMultiplier: 2,
    category: "Collectibles",
  },
  {
    merchants: ["DAVIDsTEA", "DAVIDSTEA", "DAVIDS TEA"],
    totalMultiplier: 2,
    category: "Food & Drink",
  },
  {
    merchants: ["GOLF Partner", "GOLF PARTNER"],
    totalMultiplier: 2,
    category: "Sports",
  },
  {
    merchants: ["Herschel", "HERSCHEL"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Hockey Supremacy", "HOCKEY SUPREMACY"],
    totalMultiplier: 2,
    category: "Sports",
  },
  {
    merchants: ["Icebreaker", "ICEBREAKER"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["LUVME HAIR", "LUVME"],
    totalMultiplier: 2,
    category: "Beauty",
  },
  {
    merchants: ["Mackage", "MACKAGE"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Muc Off", "MUC OFF", "MUCOFF"],
    totalMultiplier: 2,
    category: "Sports",
  },
  {
    merchants: ["Mustang Survival", "MUSTANG SURVIVAL"],
    totalMultiplier: 2,
    category: "Sports",
  },
  {
    merchants: ["Perfectlens.ca", "PERFECTLENS"],
    totalMultiplier: 2,
    category: "Health",
  },
  { merchants: ["Sandals", "SANDALS"], totalMultiplier: 2, category: "Travel" },
  {
    merchants: ["Swanwick", "SWANWICK"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Under Armour", "UNDER ARMOUR", "UNDERARMOUR"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  { merchants: ["Zray", "ZRAY"], totalMultiplier: 2, category: "Sports" },
  { merchants: ["iRobot", "IROBOT"], totalMultiplier: 2, category: "Home" },
  { merchants: ["illy", "ILLY"], totalMultiplier: 2, category: "Food & Drink" },

  // 1.5x merchants
  { merchants: ["AOR", "AOR"], totalMultiplier: 1.5, category: "Health" },
  {
    merchants: ["AbeBooks", "ABEBOOKS"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Adagio Teas", "ADAGIO TEAS", "ADAGIO"],
    totalMultiplier: 1.5,
    category: "Food & Drink",
  },
  { merchants: ["Alamo", "ALAMO"], totalMultiplier: 1.5, category: "Travel" },
  {
    merchants: ["Ancheer", "ANCHEER"],
    totalMultiplier: 1.5,
    category: "Sports",
  },
  {
    merchants: ["Apple.com", "APPLE.COM", "Apple Store", "APPLE STORE"],
    totalMultiplier: 1.5,
    category: "Electronics",
  },
  { merchants: ["Bala", "BALA"], totalMultiplier: 1.5, category: "Fitness" },
  {
    merchants: ["Banbe Eyewear", "BANBE"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Baron Collection", "BARON COLLECTION"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Best Western Hotels", "BEST WESTERN"],
    totalMultiplier: 1.5,
    category: "Travel",
  },
  {
    merchants: ["Bose", "BOSE"],
    totalMultiplier: 1.5,
    category: "Electronics",
  },
  {
    merchants: ["Bostanten", "BOSTANTEN"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Brave Leather", "BRAVE LEATHER"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Brilliant Earth", "BRILLIANT EARTH"],
    totalMultiplier: 1.5,
    category: "Jewelry",
  },
  {
    merchants: ["Clarins", "CLARINS"],
    totalMultiplier: 1.5,
    category: "Beauty",
  },
  {
    merchants: ["Coast Appliances", "COAST APPLIANCES"],
    totalMultiplier: 1.5,
    category: "Home",
  },
  {
    merchants: ["Coco&Eve", "COCO&EVE", "COCO AND EVE"],
    totalMultiplier: 1.5,
    category: "Beauty",
  },
  {
    merchants: ["DH Gate", "DHGATE", "DH GATE"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Erno Laszlo", "ERNO LASZLO"],
    totalMultiplier: 1.5,
    category: "Beauty",
  },
  {
    merchants: ["Etihad Airways", "ETIHAD"],
    totalMultiplier: 1.5,
    category: "Travel",
  },
  {
    merchants: ["Gap", "GAP"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Harry Rosen", "HARRY ROSEN"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Haven", "HAVEN"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  { merchants: ["Hertz", "HERTZ"], totalMultiplier: 1.5, category: "Travel" },
  {
    merchants: ["Logitech", "LOGITECH"],
    totalMultiplier: 1.5,
    category: "Electronics",
  },
  {
    merchants: ["Red Paddle Co", "RED PADDLE"],
    totalMultiplier: 1.5,
    category: "Sports",
  },
  {
    merchants: ["Reolink", "REOLINK"],
    totalMultiplier: 1.5,
    category: "Electronics",
  },
  {
    merchants: ["SFERRA Fine Linens", "SFERRA"],
    totalMultiplier: 1.5,
    category: "Home",
  },
  {
    merchants: ["Sonos", "SONOS"],
    totalMultiplier: 1.5,
    category: "Electronics",
  },
  {
    merchants: ["TFal", "T-FAL", "TFAL"],
    totalMultiplier: 1.5,
    category: "Home",
  },
  {
    merchants: ["Toms", "TOMS"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["TruBar", "TRUBAR"],
    totalMultiplier: 1.5,
    category: "Food & Drink",
  },
  {
    merchants: ["WOWANGEL", "WOWANGEL"],
    totalMultiplier: 1.5,
    category: "Beauty",
  },
  {
    merchants: ["Warby Parker", "WARBY PARKER"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
];

async function setupBrimAFKLMMerchantRules() {
  console.log(
    "=== Setting Up Brim Financial Air France KLM Merchant-Specific Rules ===\n"
  );

  // Initialize repository
  try {
    initializeRuleRepository(supabase);
    console.log("✅ RuleRepository initialized\n");
  } catch (error) {
    console.error("❌ Failed to initialize repository:", error);
    return;
  }

  const repository = getRuleRepository();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Generate card type ID
  const cardTypeId = cardTypeIdService.generateCardTypeId(
    "Brim Financial",
    "Air France KLM World Elite"
  );
  console.log("Card Type ID:", cardTypeId, "\n");

  // Count existing merchant rules to determine starting priority
  const { data: existingRules } = await supabase
    .from("reward_rules")
    .select("id, priority")
    .eq("card_type_id", cardTypeId)
    .order("priority", { ascending: false });

  const maxExistingPriority = existingRules?.[0]?.priority || 6;
  console.log(`Existing rules count: ${existingRules?.length || 0}`);
  console.log(`Max existing priority: ${maxExistingPriority}`);
  console.log(`Starting new rules at priority: ${maxExistingPriority + 1}\n`);

  let currentPriority = maxExistingPriority + 1;
  let rulesCreated = 0;
  let rulesFailed = 0;

  // Group by multiplier for logging
  const groupedByMultiplier = new Map<number, MerchantRule[]>();
  for (const rule of merchantRules) {
    const mult = rule.totalMultiplier;
    if (!groupedByMultiplier.has(mult)) {
      groupedByMultiplier.set(mult, []);
    }
    groupedByMultiplier.get(mult)!.push(rule);
  }

  try {
    // Sort by multiplier descending (higher earn rates = higher priority)
    const sortedMultipliers = Array.from(groupedByMultiplier.keys()).sort(
      (a, b) => b - a
    );

    for (const multiplier of sortedMultipliers) {
      const rules = groupedByMultiplier.get(multiplier)!;
      console.log(
        `\n--- Creating ${rules.length} rules for ${multiplier}x earn rate ---\n`
      );

      for (const merchantRule of rules) {
        const merchantName = merchantRule.merchants[0];
        const bonusMultiplier = merchantRule.totalMultiplier - 1; // Total = base + bonus

        try {
          if (merchantRule.isFlat) {
            // Flat rate rule (e.g., Disney+ 150 points)
            await repository.createRule({
              cardTypeId: cardTypeId,
              name: `${merchantName} - ${merchantRule.totalMultiplier} Flying Blue Miles (flat)`,
              description: `Earn ${merchantRule.totalMultiplier} Flying Blue Miles per transaction at ${merchantName}`,
              enabled: true,
              priority: currentPriority++,
              conditions: [
                {
                  type: "merchant",
                  operation: "include",
                  values: merchantRule.merchants,
                },
              ],
              reward: {
                calculationMethod: "flat_rate",
                baseMultiplier: merchantRule.totalMultiplier,
                bonusMultiplier: 0,
                pointsCurrency: "Flying Blue Miles",
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                monthlyCap: null,
                bonusTiers: [],
              },
            });
          } else {
            // Standard multiplier rule
            await repository.createRule({
              cardTypeId: cardTypeId,
              name: `${merchantRule.totalMultiplier}x Flying Blue Miles at ${merchantName} (Online)`,
              description: `Earn ${merchantRule.totalMultiplier} Flying Blue Miles per $1 at ${merchantName} - online purchases only (${merchantRule.category})`,
              enabled: true,
              priority: currentPriority++,
              conditions: [
                {
                  type: "merchant",
                  operation: "include",
                  values: merchantRule.merchants,
                },
                {
                  type: "transaction_type",
                  operation: "include",
                  values: ["online"],
                },
              ],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: bonusMultiplier,
                pointsCurrency: "Flying Blue Miles",
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                monthlyCap: null,
                bonusTiers: [],
              },
            });
          }

          console.log(
            `  ✅ ${merchantName}: ${merchantRule.totalMultiplier}x${merchantRule.isFlat ? " (flat)" : ""}`
          );
          rulesCreated++;
        } catch (error) {
          console.error(
            `  ❌ Failed to create rule for ${merchantName}:`,
            error
          );
          rulesFailed++;
        }
      }
    }

    console.log("\n=== Setup Complete ===\n");
    console.log(`✅ Created ${rulesCreated} merchant-specific rules`);
    if (rulesFailed > 0) {
      console.log(`❌ Failed to create ${rulesFailed} rules`);
    }

    console.log("\nSummary by earn rate:");
    for (const [mult, rules] of groupedByMultiplier) {
      console.log(`  ${mult}x: ${rules.length} merchants`);
    }

    console.log("\nNotes:");
    console.log("1. These rules apply to online purchases at listed merchants");
    console.log("2. Disney+ earns 150 flat points per transaction");
    console.log(
      "3. Rules have higher priority than base/restaurant/AF-KLM rules"
    );
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Run the setup
setupBrimAFKLMMerchantRules().catch(console.error);
