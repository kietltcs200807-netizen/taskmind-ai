import { db } from "./config";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp 
} from "firebase/firestore";

// Interfaces
export interface Room {
  id: string;
  name: string;
  course: string;
  leaderId: string;
  createdAt: any;
  members: string[];
}

export interface UserRole {
  userId: string;
  roomId: string;
  role: "Leader" | "Member";
}

// 1. Create a Room
export const createRoom = async (name: string, course: string, userId: string): Promise<string> => {
  try {
    const roomRef = await addDoc(collection(db, "rooms"), {
      name,
      course,
      leaderId: userId,
      createdAt: serverTimestamp(),
      members: [userId],
    });

    // Add role document
    await addDoc(collection(db, "roomRoles"), {
      roomId: roomRef.id,
      userId,
      role: "Leader",
    });

    return roomRef.id;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

// 2. Fetch User's Rooms
export const getUserRooms = async (userId: string): Promise<Room[]> => {
  try {
    const q = query(
      collection(db, "rooms"),
      where("members", "array-contains", userId)
    );
    const querySnapshot = await getDocs(q);
    const rooms: Room[] = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() } as Room);
    });
    return rooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
};

// 3. Join a Room
export const joinRoom = async (roomId: string, userId: string): Promise<boolean> => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error("Room not found");
    }

    const roomData = roomSnap.data();
    if (roomData.members.includes(userId)) {
      return true; // Already joined
    }

    // Add to members array in room
    await updateDoc(roomRef, {
      members: arrayUnion(userId)
    });

    // Add standard Member role
    await addDoc(collection(db, "roomRoles"), {
      roomId,
      userId,
      role: "Member",
    });

    return true;
  } catch (error) {
    console.error("Error joining room:", error);
    throw error;
  }
};

// 4. Get a specific room
export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomSnap = await getDoc(doc(db, "rooms", roomId));
    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() } as Room;
    }
    return null;
  } catch (error) {
    console.error("Error fetching room:", error);
    return null;
  }
};

// 5. Get User Role in a Room
export const getRoomRole = async (roomId: string, userId: string): Promise<"Leader" | "Member" | null> => {
  try {
    const q = query(
      collection(db, "roomRoles"),
      where("roomId", "==", roomId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data().role as "Leader" | "Member";
    }
    return null;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
};
