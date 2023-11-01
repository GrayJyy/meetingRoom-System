export function toVo(
  real: Record<string, any>,
  virtual: Record<string, any>,
): Record<string, any> {
  const _virtual = {};
  console.log(virtual);
  console.log(Object.keys(virtual));

  for (const key in real) {
    console.log(real[key]);

    if (Object.keys(virtual).includes(key)) _virtual[key] = real[key];
    console.log(_virtual[key]);
  }

  return _virtual;
}
