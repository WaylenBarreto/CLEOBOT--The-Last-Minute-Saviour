import { QuickTemplate } from "./types";

export const templates: QuickTemplate[] = [
  {
    title: "Client Server Down",
    description: "Production Server 502 gateway error with client in high-intensity panic.",
    rawInput: "OMG the main client production server is returning a 502 bad gateway and our CTO is on a flight to Tokyo. The client just slacked me saying they're losing 10k an hour. I don't even know who has the AWS keys but I think it might be Dave, or maybe it's in the secure vault. Help me draft an update email to the client to reassure them, outline server debug checklist resources, and put a solid focus block to deal with this.",
    dueInfo: "Within 2 hours"
  },
  {
    title: "Midnight Term Paper Cram",
    description: "Unstarted 8-page law and technology essay due tomorrow morning.",
    rawInput: "I have an 8-page term paper on 'The Impact of Generative AI on Modern Copyright Laws' due tomorrow morning at 9:00 AM. It's already late. I haven't written a single word, I only have 3 chaotic bookmarks of legal articles, and I need a strong outline structure, an initial draft email explaining potential delay justification if I submit slightly late, and a focused study block schedule to survive the night.",
    dueInfo: "By 9:00 AM tomorrow"
  },
  {
    title: "Wedding Toast Emergency",
    description: "Best man toast required for reception starting in a few hours.",
    rawInput: "I'm the best man and the reception is in 3 hours. I completely forgot to write my speech. The couple is Sarah and Tom, they met in college at UC Berkeley, and Tom once accidentally fell into the campus fountain trying to impress her. I need a witty, heartwarming speech draft, a brief list of wedding groom checklist items, and a scheduled blocking event to practice.",
    dueInfo: "In 3 hours"
  },
  {
    title: "Hurried Travel Itinerary",
    description: "Last-minute business trip flight boarding tonight with no packing/plans.",
    rawInput: "I have to fly out to San Francisco tonight at 8 PM for an emergency investor meeting tomorrow at 9 AM. I haven't packed, I don't have a hotel booked, and I don't know the best airport transit options. Give me a packing list, find transit checklists, draft an email to the hotel requesting early check-in, and block time to pack.",
    dueInfo: "Departing at 8:00 PM tonight"
  }
];
