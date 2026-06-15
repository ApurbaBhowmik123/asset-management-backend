export const generateNextCode = async (
  model: any,
  codeField: string,
  prefix: string,
  length: number = 3
): Promise<string> => {
  const entries = await model.findMany({
    where: {
      [codeField]: {
        startsWith: prefix,
      },
    },
    orderBy: {
      [codeField]: 'desc',
    },
    take: 50,
  });

  let lastNumber = 0;
  for (const entry of entries) {
    const rawVal = entry[codeField].slice(prefix.length);
    const num = parseInt(rawVal, 10);
    if (!isNaN(num) && /^\d+$/.test(rawVal)) {
      lastNumber = num;
      break;
    }
  }

  const newNumber = (lastNumber + 1).toString().padStart(length, '0');
  return `${prefix}${newNumber}`;
};
