export enum Easing {
  In,
  Out,
  InOut,
  Linear,
}

type EasingFunction = (from: number, to: number, factor: number) => number;

export const easingFuncs: Record<Easing, EasingFunction> = {
  [Easing.Out]: (from, to, factor) =>
    from + (to - from) * (1 - Math.pow(1 - factor, 3)),
  [Easing.In]: (from, to, factor) => from + (to - from) * Math.pow(factor, 3),
  [Easing.InOut]: (from, to, factor) =>
    from +
    (to - from) *
      (factor < 0.5
        ? 4 * Math.pow(factor, 3)
        : 1 - Math.pow(-2 * factor + 2, 3) / 2),
  [Easing.Linear]: (from, to, factor) => from + (to - from) * factor,
};

export let DEFAULT_EASING = Easing.Linear;
export const setDefaultEasing = (newDefault: Easing) =>
  (DEFAULT_EASING = newDefault);
