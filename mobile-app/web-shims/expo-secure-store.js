const SecureStore = {
  async setItemAsync(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  },
  async getItemAsync(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  async deleteItemAsync(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

module.exports = SecureStore;
exports.default = SecureStore;
