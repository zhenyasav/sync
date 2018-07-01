export type KeyFunction<T> = (o: T) => string;

export function cache<T>(iterable: T[], keyFn: KeyFunction<T>) {
  const result = {};
  (iterable || []).forEach((v) => {
    const key = keyFn(v);
    result[key] = v;
  });
  return result;
}