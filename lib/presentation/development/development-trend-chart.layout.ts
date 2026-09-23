export type DevelopmentTrendChartValueDomain = {
  min: number;
  max: number;
};

export type DevelopmentTrendChartCoord = {
  x: number;
  y: number;
  index: number;
};

export function buildDevelopmentTrendChartCoords(
  values: readonly number[],
  width: number,
  height: number,
  domain?: DevelopmentTrendChartValueDomain | null,
): DevelopmentTrendChartCoord[] {
  if (values.length === 0 || width <= 0 || height <= 0) {
    return [];
  }

  const finiteValues = values.filter((value) => Number.isFinite(value));
  const minValue = domain?.min ?? (finiteValues.length > 0 ? Math.min(...finiteValues) : 0);
  const maxValue = domain?.max ?? (finiteValues.length > 0 ? Math.max(...finiteValues) : 1);
  const valueSpan = maxValue - minValue;
  const padY = 8;
  const usableHeight = Math.max(height - padY * 2, 1);
  const lastIndex = Math.max(values.length - 1, 1);

  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (width * index) / lastIndex;
    const normalized =
      !Number.isFinite(value) || valueSpan === 0
        ? 0.5
        : (value - minValue) / valueSpan;
    const y = padY + usableHeight * (1 - normalized);
    return { x, y, index };
  });
}
