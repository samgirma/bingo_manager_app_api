import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SAVED_DIR_KEY = 'bingo_saf_directory_uri';

interface EncryptedFile {
  fileName: string;
  filePayload: string;
  checksum: string;
  transactionRef?: string;
  fileContent?: string;
}

export async function downloadEncryptedFile(file: EncryptedFile): Promise<boolean> {
  const content = file.fileContent || file.filePayload;

  // 1. Web Deployment Pipeline
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'application/octet-stream' });
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

  // 2. Production SAF Pipeline (Android Only Optimization)
  if (Platform.OS === 'android') {
    try {
      const FS = require('expo-file-system');
      const SAF = FS.StorageAccessFramework;

      if (SAF) {
        let dirUri = await SecureStore.getItemAsync(SAVED_DIR_KEY);

        if (!dirUri) {
          const permissions = await SAF.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            dirUri = permissions.directoryUri;
            await SecureStore.setItemAsync(SAVED_DIR_KEY, dirUri);
          }
        }

        if (dirUri) {
          try {
            // FIX: Extract raw name without extension because Android SAF 
            // injects extensions dynamically based on the MIME type string
            const baseName = file.fileName.endsWith('.enc') 
              ? file.fileName.slice(0, -4) 
              : file.fileName;

            // Using "text/plain" or generic stream depending on fallback rules
            const fileUri = await SAF.createFileAsync(dirUri, baseName, 'application/octet-stream');
            
            // FIX: Explicitly enforce raw UTF8 string layout writing
            await FS.writeAsStringAsync(fileUri, content, {
              encoding: FS.EncodingType.UTF8,
            });

            // Decode the URI path cleanly to show a readable folder string to the user
            const decodedUri = decodeURIComponent(fileUri);
            const shortPath = decodedUri.split('/').slice(-2).join('/');

            Alert.alert('File Saved Successfully', `Saved to: /${shortPath}`);
            return true;
          } catch (writeErr) {
            // Token likely invalidated or parent folder deleted manually by operator
            await SecureStore.deleteItemAsync(SAVED_DIR_KEY).catch(() => {});
          }
        }
      }
    } catch (safError) {
      console.warn('SAF compilation skipped or failed: ', safError);
    }
  }

  // 3. Native Sharesheet Fallback (iOS / Android Permission Rejection)
  try {
    const FS = require('expo-file-system');
    const Sharing = require('expo-sharing');
    
    // Check fallback targets systematically
    const dir = FS.documentDirectory || FS.cacheDirectory || '';
    if (dir) {
      const fileUri = dir + file.fileName;
      
      await FS.writeAsStringAsync(fileUri, content, {
        encoding: FS.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: `Export ${file.fileName}`,
        });
        return true;
      }
      
      Alert.alert('Saved to App Space', `Location:\n${fileUri}`);
      return true;
    }
  } catch (sharingError) {
    console.error('Sharing context failed: ', sharingError);
  }

  // 4. Absolute Safety Net: Clipboard / Manual Copy Interface
  Alert.alert(
    'Action Required: Copy Payload',
    `Could not save file automatically.\n\nFile: ${file.fileName}\n\nPayload:\n${content.substring(0, 400)}...`,
    [{ text: 'OK' }]
  );
  return false;
}