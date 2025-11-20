export const computeDiff = (oldText, newText) => {
  if (!oldText) oldText = "";
  if (!newText) newText = "";
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const matrix = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));
  
  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }
  
  let i = oldLines.length;
  let j = newLines.length;
  const diffs = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffs.unshift({ type: 'same', value: oldLines[i - 1], oldLine: i, newLine: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      diffs.unshift({ type: 'add', value: newLines[j - 1], newLine: j });
      j--;
    } else {
      diffs.unshift({ type: 'remove', value: oldLines[i - 1], oldLine: i });
      i--;
    }
  }
  return diffs;
};