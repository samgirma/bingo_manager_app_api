const documentDirectory = '/';
const cacheDirectory = '/';

const writeAsStringAsync = async (uri, content) => {
  // attempt to trigger a download if a path-like uri is provided
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
  } catch (e) {
    // ignore
  }
};

const StorageAccessFramework = null;

module.exports = {
  documentDirectory,
  cacheDirectory,
  writeAsStringAsync,
  StorageAccessFramework,
};
exports.default = module.exports;
