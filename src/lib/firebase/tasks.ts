import { db } from "./config";
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";

export interface Task {
  id: string;
  roomId: string;
  title: string;
  description: string;
  assigneeId: string; // user ID
  assigneeName?: string; // string or generic names for now
  deadline: string; // YYYY-MM-DD
  status: "todo" | "in-progress" | "done";
  createdAt: any;
}

export const createTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, "tasks"), {
      ...taskData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task["status"]) => {
  try {
    const docRef = doc(db, "tasks", taskId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const docRef = doc(db, "tasks", taskId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
