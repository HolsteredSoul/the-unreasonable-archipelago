/** Optional presentation copy. Titles, fleets, rules and unlocks belong to campaign.ts. */
export type CampaignCopy = Readonly<{
  chartSubtitle: string;
  victoryCoda: string;
  /** Describes the next map after winning this one; absent at the campaign ending. */
  nextShoreHook?: string;
  lesson: string;
}>;

export const CAMPAIGN_COPY: Readonly<Partial<Record<number, CampaignCopy>>> = {
  1: {
    chartSubtitle: 'The Committee has put the kettle on. Bring one bell home; check shelter after drift.',
    victoryCoda: 'The Committee puts breakfast back on the calendar.',
    nextShoreHook: 'A distant bell and a borrowed breakwater await.',
    lesson: 'Grow the bell, then bring it home with shelter and time to recover.',
  },
  2: {
    chartSubtitle: 'The keeper lends you a breakwater. The bell is taking the long way home.',
    victoryCoda: 'The keeper leaves a light on for the next unlikely visitor.',
    nextShoreHook: 'A new town has more than one voice to bring into shelter.',
    lesson: 'Read the new currents and find a sheltered route home.',
  },
  3: {
    chartSubtitle: 'The Contrary Bell has joined in. Give both voices somewhere sheltered to sing.',
    victoryCoda: 'The bell keepers agree on breakfast, though not on the tune.',
    nextShoreHook: 'The next town has a thinner pantry. Make room for a garden.',
    lesson: 'Plan for every bell; a neighbouring shore can help shelter them.',
  },
  4: {
    chartSubtitle: 'The bakers have set the table. Build a pantry before the bells empty it.',
    victoryCoda: 'The bakers add another morning to the menu.',
    nextShoreHook: 'Another voice is waiting. Let the shores shelter one another.',
    lesson: 'Balance food spent on growth with food for the coming tides.',
  },
  5: {
    chartSubtitle: 'The gardeners ask for a dry seat at the concert. Let the shores shelter one another.',
    victoryCoda: 'The gardeners can hear the concert from their doorstep.',
    nextShoreHook: 'Scattered shores have supper to share, if you can bring them together.',
    lesson: 'Move ordinary shores into useful bridges and windbreaks.',
  },
  6: {
    chartSubtitle: 'Everyone brings something to supper. Bring scattered shores home on a thin pantry.',
    victoryCoda: 'Supper is served. Someone has thoughtfully left the sea off the guest list.',
    nextShoreHook: 'The full choir is waiting. Every shore can help make a harbour.',
    lesson: 'Sequence nourishment and shelter while keeping the town fed.',
  },
  7: {
    chartSubtitle: 'The Committee has found enough chairs. Now find shelter for the whole choir.',
    victoryCoda: 'The Committee calls for a rehearsal. Nobody agrees which morning this is.',
    nextShoreHook: 'One last town is listening. Plan for the final wind.',
    lesson: 'Coordinate the full fleet and check every bell after drift.',
  },
  8: {
    chartSubtitle: 'The Moon has stayed for an encore. Bring every voice through the last squall.',
    victoryCoda: 'The whole archipelago sings. The Moon has forgotten why it came.',
    lesson: 'Bring growth, connection, shelter and recovery together for the final chorus.',
  },
};
