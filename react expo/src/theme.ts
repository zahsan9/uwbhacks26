export const VQ = {
  seashell:      '#EAE4DA',
  seashellDeep:  '#ded6c6',
  seashellSoft:  '#f4efe6',
  ink:           '#1D1D1B',
  inkSoft:       '#4a4a46',
  inkDim:        '#8a8880',
  lavender:      '#808BC5',
  lavenderSoft:  '#c9cee4',
  tea:           '#245E55',
  teaSoft:       '#8eb2aa',
  pink:          '#EAA7C7',
  mustard:       '#EAC119',
  tangerine:     '#ED773C',
  tangerineSoft: '#f4b494',
  sky:           '#9ED6DF',
  skySoft:       '#d3ebef',
  red:           '#C63F3E',
  redSoft:       '#e79b9a',
  coral:         '#ED773C',
  coralDeep:     '#c85b22',
  surface:       '#ffffff',
  border:        'rgba(29,29,27,0.10)',
  borderStrong:  'rgba(29,29,27,0.18)',
  water2:        '#6ac0cb',
  water3:        '#3d8c96',
} as const;

export type AvatarState = 'thriving' | 'healthy' | 'sick' | 'critical';
export type IslandType  = 'walk' | 'sleep' | 'screen' | 'learn' | 'quest';

export const stateColor: Record<AvatarState, string> = {
  thriving: VQ.tea,
  healthy:  VQ.lavender,
  sick:     VQ.tangerine,
  critical: VQ.red,
};

export const stateSoftColor: Record<AvatarState, string> = {
  thriving: VQ.teaSoft,
  healthy:  VQ.lavenderSoft,
  sick:     VQ.tangerineSoft,
  critical: VQ.redSoft,
};

export const avatarMessage: Record<AvatarState, string> = {
  thriving: 'All my islands are thriving.',
  healthy:  'Doing okay — volcano runs warm.',
  sick:     'My volcano needs help…',
  critical: "I don't feel so good.",
};

export const bobDuration: Record<AvatarState, number> = {
  thriving: 1600,
  healthy:  2200,
  sick:     2200,
  critical: 3500,
};

export const bobAmount: Record<AvatarState, number> = {
  thriving: 6,
  healthy:  5,
  sick:     5,
  critical: 3,
};
