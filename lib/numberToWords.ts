/**
 * Converts a numeric amount to Indian Rupee Words format.
 * Example: 12500.50 -> "Rupees Twelve Thousand Five Hundred and Fifty Paise Only"
 */

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertLessThanThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + " ";
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + " ";
  }
  return str.trim();
}

export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rupees Zero Only";
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  const rupeesPart = Math.floor(roundedAmount);
  const paisePart = Math.round((roundedAmount - rupeesPart) * 100);

  if (rupeesPart === 0 && paisePart === 0) {
    return "Rupees Zero Only";
  }

  let rupeesInWords = "";

  if (rupeesPart > 0) {
    let num = rupeesPart;

    // Crores (1,00,00,000)
    const crores = Math.floor(num / 10000000);
    num %= 10000000;

    // Lakhs (1,00,000)
    const lakhs = Math.floor(num / 100000);
    num %= 100000;

    // Thousands (1,000)
    const thousands = Math.floor(num / 1000);
    num %= 1000;

    // Hundreds & Below
    const remaining = num;

    if (crores > 0) {
      rupeesInWords += convertLessThanThousand(crores) + " Crore ";
    }
    if (lakhs > 0) {
      rupeesInWords += convertLessThanThousand(lakhs) + " Lakh ";
    }
    if (thousands > 0) {
      rupeesInWords += convertLessThanThousand(thousands) + " Thousand ";
    }
    if (remaining > 0) {
      rupeesInWords += convertLessThanThousand(remaining);
    }

    rupeesInWords = "Rupees " + rupeesInWords.trim();
  }

  let paiseInWords = "";
  if (paisePart > 0) {
    paiseInWords = convertLessThanThousand(paisePart) + " Paise";
  }

  if (rupeesPart > 0 && paisePart > 0) {
    return `${rupeesInWords} and ${paiseInWords} Only`;
  } else if (rupeesPart > 0) {
    return `${rupeesInWords} Only`;
  } else {
    return `${paiseInWords} Only`;
  }
}
