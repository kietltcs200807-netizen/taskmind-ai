import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { addDoc, collection, serverTimestamp, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "./config";

export interface ProjectDocument {
  id: string;
  name: string;
  url: string;
  roomId: string;
  uploadedBy: string;
  uploadedAt: any;
  type: string;
}

export const uploadDocument = async (file: File, roomId: string, userId: string): Promise<string> => {
  try {
    // 1. Upload to Storage
    const storageRef = ref(storage, `rooms/${roomId}/documents/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // 2. Save metadata to Firestore
    const docRef = await addDoc(collection(db, "documents"), {
      name: file.name,
      url: downloadUrl,
      roomId,
      uploadedBy: userId,
      uploadedAt: serverTimestamp(),
      type: file.type || "unknown"
    });

    return docRef.id;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

export const getRoomDocuments = async (roomId: string): Promise<ProjectDocument[]> => {
  try {
    const q = query(
      collection(db, "documents"),
      where("roomId", "==", roomId)
    );
    const snap = await getDocs(q);
    const docs: ProjectDocument[] = [];
    snap.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() } as ProjectDocument);
    });
    // Sort client-side if needed since compound index might be missing
    return docs.sort((a, b) => b.uploadedAt?.toMillis() - a.uploadedAt?.toMillis());
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};
