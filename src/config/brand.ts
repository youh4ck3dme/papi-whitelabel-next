export type BrandConfig = {
  name: string;
  shortName: string;
  description: string;
  locale: string;
  timezone: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  colors: {
    background: string;
    gold: string;
    text: string;
  };
};

export const brandConfig: BrandConfig = {
  name: "WhitelabelDesign Hair Design Booking",
  shortName: "WhitelabelDesign Booking",
  description: "White-label salon booking starter built with Next.js and mock data.",
  locale: "sk-SK",
  timezone: "Europe/Bratislava",
  contact: {
    email: "hello@example.com",
    phone: "+421 900 000 000",
    address: "Salon address, Slovakia",
  },
  colors: {
    background: "#050505",
    gold: "#D6B25E",
    text: "#F7F2E8",
  },
};
