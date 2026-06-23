import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SAVED_DIR_KEY = 'bingo_saf_directory_uri';
const UNIQUE_BINGO_DIR_KEY = 'bingo_unique_bingo_uri';

interface EncryptedFile {
  fileName: string;
  filePayload: string;
  checksum: string;
  transactionRef?: string;
  fileContent?: string;
  downloadAsBinary?: boolean;
}

export async function downloadEncryptedFile(file: EncryptedFile): Promise<boolean> {
  const content = file.fileContent || file.filePayload;
  const binaryDownload = file.downloadAsBinary === true;

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

  const FileSystem = require('expo-file-system/legacy');
  const SAF = FileSystem.StorageAccessFramework;

  const writeAsString = async (fileUri: string, fileContent: string, useBase64: boolean) => {
    await FileSystem.writeAsStringAsync(fileUri, fileContent, {
      encoding: useBase64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
    });
  };

  const exportContent = binaryDownload ? content : content;
  const exportAsBase64 = binaryDownload;

  // SAF: try to use stored "unique bingo" folder
  if (SAF) {
    try {
      let uniqueBingoUri = await SecureStore.getItemAsync(UNIQUE_BINGO_DIR_KEY);

      // Validate stored URI still works
      if (uniqueBingoUri) {
        try {
          await SAF.readDirectoryAsync(uniqueBingoUri);
        } catch {
          uniqueBingoUri = null;
          await SecureStore.deleteItemAsync(UNIQUE_BINGO_DIR_KEY);
        }
      }

      // No valid folder — ask user to pick parent (e.g. Downloads) and create the subfolder
      if (!uniqueBingoUri) {
        const perm = await SAF.requestDirectoryPermissionsAsync();
        if (perm.granted) {
          try {
            uniqueBingoUri = await SAF.createFolderAsync(perm.directoryUri, 'unique bingo');
          } catch {
            // Folder already exists — fall back to parent directory
            uniqueBingoUri = perm.directoryUri;
          }
          await SecureStore.setItemAsync(UNIQUE_BINGO_DIR_KEY, uniqueBingoUri);
        }
      }

      if (uniqueBingoUri) {
        const fileUri = await SAF.createFileAsync(uniqueBingoUri, file.fileName, 'application/octet-stream');
        await writeAsString(fileUri, exportContent, exportAsBase64);
        Alert.alert('File Saved', `Downloads/unique bingo/\n${file.fileName}`);
        return true;
      }
    } catch (e: any) {
      console.error('SAF unique bingo error:', e?.message || e);
    }
  }

  // Fallback: saved generic SAF directory
  try {
    if (SAF) {
      let dirUri = await SecureStore.getItemAsync(SAVED_DIR_KEY);

      if (!dirUri) {
        const perm = await SAF.requestDirectoryPermissionsAsync();
        if (perm.granted) {
          dirUri = perm.directoryUri;
          await SecureStore.setItemAsync(SAVED_DIR_KEY, dirUri);
        }
      }

      if (dirUri) {
        try {
          const fileUri = await SAF.createFileAsync(dirUri, file.fileName, 'application/octet-stream');
          await writeAsString(fileUri, exportContent, exportAsBase64);
          Alert.alert('File Saved', file.fileName);
          return true;
        } catch {
          await SecureStore.deleteItemAsync(SAVED_DIR_KEY).catch(() => {});
        }
      }
    }
  } catch (e: any) {
    console.error('SAF fallback error:', e?.message || e);
  }

  // Fallback: legacy expo-file-system
  try {
    const { documentDirectory, cacheDirectory } = require('expo-file-system/legacy');
    const dir = documentDirectory || cacheDirectory;
    if (dir) {
      const fileUri = dir + file.fileName;
      await writeAsString(fileUri, exportContent, exportAsBase64);

      const Sharing = require('expo-sharing').default || require('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        return true;
      }
      Alert.alert('Saved', `File saved to:\n${fileUri}`);
      return true;
    }
  } catch (e: any) {
    console.error('Legacy fallback error:', e?.message || e);
  }

  Alert.alert('File Content', `File: ${file.fileName}\n\n${content.substring(0, 800)}`);
  return false;
}
