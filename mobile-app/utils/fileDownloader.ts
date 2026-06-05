import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SAVED_DIR_KEY = 'bingo_saf_directory_uri';

interface EncryptedFile {
  fileName: string;
  filePayload: string;
  checksum: string;
  transactionRef?: string;
  fileContent?: string;
  downloadAsBinary?: boolean;
}

function isBase64String(value: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;
}

export async function downloadEncryptedFile(file: EncryptedFile): Promise<boolean> {
  const content = file.fileContent || file.filePayload;
  const binaryDownload = file.downloadAsBinary === true;

  console.log('=== FILE DOWNLOAD ===');
  console.log('File:', file.fileName, '| Size:', content?.length || 0, 'bytes', '| binary:', binaryDownload);

  if (Platform.OS === 'web') {
    const blob = binaryDownload
      ? new Blob([Uint8Array.from(atob(content), (c) => c.charCodeAt(0))], { type: 'application/octet-stream' })
      : new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  const writeAsString = async (fileUri: string, fileContent: string, useBase64: boolean) => {
    const FileSystem = require('expo-file-system/legacy');
    console.log('Writing to:', fileUri, '| base64:', useBase64);
    await FileSystem.writeAsStringAsync(fileUri, fileContent, {
      encoding: useBase64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
    });
  };

  const exportContent = binaryDownload ? content : content;
  const exportAsBase64 = binaryDownload;

  // Try SAF
  try {
    const SAF = require('expo-file-system').StorageAccessFramework;
    console.log('SAF available:', !!SAF);

    if (SAF) {
      let dirUri = await SecureStore.getItemAsync(SAVED_DIR_KEY);
      console.log('Saved dir:', dirUri || 'NONE');

      if (!dirUri) {
        const perm = await SAF.requestDirectoryPermissionsAsync();
        console.log('Permission granted:', perm.granted);
        if (perm.granted) {
          dirUri = perm.directoryUri;
          await SecureStore.setItemAsync(SAVED_DIR_KEY, dirUri!);
          console.log('SAF: saved dir', dirUri);
        }
      }

      if (dirUri) {
        try {
          const fileUri = await SAF.createFileAsync(dirUri, file.fileName, 'application/octet-stream');
          console.log('SAF: created file', fileUri);
          await writeAsString(fileUri, exportContent, exportAsBase64);
          console.log('SAF: write SUCCESS');
          Alert.alert('File Saved', file.fileName);
          return true;
        } catch (e: any) {
          console.error('SAF write failed:', e?.message || e);
          await SecureStore.deleteItemAsync(SAVED_DIR_KEY).catch(() => {});
        }
      }
    }
  } catch (e: any) {
    console.error('SAF error:', e?.message || e);
  }

  // Fallback: use legacy expo-file-system for directory paths
  try {
    const { documentDirectory, cacheDirectory } = require('expo-file-system/legacy');
    console.log('Legacy dirs - doc:', documentDirectory, '| cache:', cacheDirectory);

    const dir = documentDirectory || cacheDirectory;
    if (dir) {
      const fileUri = dir + file.fileName;
      await writeAsString(fileUri, exportContent, exportAsBase64);
      console.log('Legacy: write SUCCESS');

      const Sharing = require('expo-sharing').default || require('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        return true;
      }
      Alert.alert('Saved', `File saved to:\n${fileUri}`);
      return true;
    }
    console.log('Legacy dirs empty');
  } catch (e: any) {
    console.error('Legacy fallback error:', e?.message || e);
  }

  console.log('All methods failed');
  Alert.alert('File Content', `File: ${file.fileName}\n\n${content.substring(0, 800)}`);
  return false;
}
