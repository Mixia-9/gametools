export interface DropResult {
  /** 对齐后保留下来的尺寸；0 表示完全没搭上 */
  size: number;
  /** 保留下来的部分的中心，相对下方方块中心的偏移 */
  offset: number;
  /** 被切掉部分的尺寸；0 表示完美对齐或没搭上 */
  cut: number;
  /** 被切掉部分的中心，相对保留下来的方块中心的偏移 */
  cutOffset: number;
  perfect: boolean;
}

/**
 * 叠塔的核心计算（尺寸都归一化，1 = 初始大小）。
 * 下落方块和下方方块尺寸相同，沿移动轴相对偏移了 delta；超出下方的部分会被切掉掉落。
 */
export function resolveDrop(size: number, delta: number, perfectTolerance = 0.045): DropResult {
  const d = Math.abs(delta);
  if (d >= size) {
    return { size: 0, offset: delta, cut: 0, cutOffset: 0, perfect: false };
  }
  // 落在容差内算完美对齐：直接吸附到正中
  if (d <= perfectTolerance) {
    return { size, offset: 0, cut: 0, cutOffset: 0, perfect: true };
  }
  return {
    size: size - d,
    offset: delta / 2,
    cut: d,
    cutOffset: (Math.sign(delta) * size) / 2,
    perfect: false,
  };
}
