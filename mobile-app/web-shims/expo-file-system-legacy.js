const documentDirectory = '/';
const cacheDirectory = '/';

const writeAsStringAsync = async (uri, content) => {
  try {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = uri.split('/').pop() || 'file.bin';
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {}
};

module.exports = {
  documentDirectory,
  cacheDirectory,
  writeAsStringAsync,
};
exports.default = module.exports;
