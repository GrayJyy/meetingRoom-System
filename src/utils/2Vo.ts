export function toVo(
  real: Record<string, any>,
  virtual: Record<string, any>,
): Record<string, any> {
  const _virtual = {};
  for (const key in real) {
    if (Object.keys(virtual).includes(key)) _virtual[key] = real[key];
  }
  return _virtual;
}
