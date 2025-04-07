export function getSortData(
  by: number,
  direction: number,
): Record<string, 1 | -1> {
  let field: string;

  switch (by) {
    case 1:
      field = 'created_at';
      break;
    case 2:
      field = 'first_name';
      break;
    case 3:
      field = 'last_name';
      break;
    default:
      field = 'created_at';
  }

  const dir = direction === 1 ? 1 : -1;

  return { [field]: dir };
}
