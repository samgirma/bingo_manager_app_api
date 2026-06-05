const ImagePicker = {
  async requestMediaLibraryPermissionsAsync() {
    return { status: 'granted' };
  },
  async launchImageLibraryAsync(options = {}) {
    return { canceled: true };
  },
  async launchCameraAsync(options = {}) {
    return { canceled: true };
  },
};

module.exports = ImagePicker;
exports.default = ImagePicker;
