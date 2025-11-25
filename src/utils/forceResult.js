export const getForcedBoolean = (value) => {
  // Handle boolean values directly (from query string parsing)
  if (typeof value === 'boolean') {
    return value;
  }

  // Handle string values
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return null;
};

