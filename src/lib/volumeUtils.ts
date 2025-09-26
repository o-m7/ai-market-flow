/**
 * Parse volume strings like "10.3K", "6.3M", "113.7M" back to numbers
 */
export const parseVolumeString = (volumeStr: string | number): number => {
  if (typeof volumeStr === 'number') {
    return volumeStr;
  }
  
  if (!volumeStr || typeof volumeStr !== 'string') {
    return 0;
  }
  
  const str = volumeStr.toString().trim().toUpperCase();
  const numStr = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(numStr);
  
  if (isNaN(num)) {
    return 0;
  }
  
  if (str.includes('B')) {
    return num * 1000000000;
  } else if (str.includes('M')) {
    return num * 1000000;
  } else if (str.includes('K')) {
    return num * 1000;
  }
  
  return num;
};

/**
 * Format volume number back to readable string
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toLocaleString();
};