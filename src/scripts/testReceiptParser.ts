import { receiptTextParser } from "../core/ocr/ReceiptTextParser";

const ocrText = `NOT A MEMBER YET? DOWNLOAD & JOIN NOW!
立即下載APP,加入大統華積分獎勵計劃
⚫ GET EXCLUSIVE OFFERS
AND EARN REWARDS
ENJOY ONLINE GROCERY
DELIVERY
*獨家優惠和積分獎勵
•生鮮商品配送到家
T&T Supermarket
147-4800 Kingsway, Burnaby, B.C., V5H 4J2
Ph: (604) 436-4881 / Gst# 135747137RT
01/03/26 10:37:39 AM
01LANE06 SC006 -
401065684
$0.00
GROCERY
DAI PHAT RICE VERMICELLI
W $4.69
FOOD
TARO TOAST
W $3.49
TOTAL
$8.18
Master
$8.18
Item count: 2
01/03/26 10:37:39 AM
Trans:703038
MID: 5532196
01LANE06 SC006
Terminal:050108013-001006
T&T SUPERMARKET #001
147-4800 KINGSWAY
BURNABY, BC V5H4J2
(604) 436-4881
PURCHASE
TID: A0532196
Batch #: 117
01/03/26
AUTH #: 588752
************8141 S
MasterCard
Total
Ref #: 30
10:38:26
Seq. #: 1170010010300
00 APPROVED 588752 001
CARDHOLDER ACKNOWLEDGES RECEIPT
OF GOODS AND/OR SERVICES IN THE
AMOUNT OF THE TOTAL SHOWN ABOVE
Thank You/Merci!
Please Come Again!
**/**
$8.18`;

// Convert text to PaddleOcrTextLine format
const lines = ocrText.split("\n").map((text, i) => ({
  text,
  frame: { top: i * 20, left: 0, width: 200, height: 20 },
}));

const result = receiptTextParser.parseReceiptText(lines);

console.log("=== Parser Results ===");
console.log("Merchant Name:", result.merchantName);
console.log("Total Amount:", result.totalAmount);
console.log("Date:", result.transactionDate);
console.log("Time:", result.transactionTime);
console.log("Confidence:", result.confidence);
